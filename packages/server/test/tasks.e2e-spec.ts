import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { KyselyService } from '../src/database/kysely.service';
import { truncateTestDatabase } from './test-utils/db-truncate';

describe('Tasks API Integration (User Scoping, AuthGuard & Multi-Tenancy)', () => {
  let app: INestApplication;
  let kysely: KyselyService;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/self_mgmt_test';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    kysely = app.get(KyselyService);
  });

  beforeEach(async () => {
    await truncateTestDatabase(kysely.db);
  });

  afterAll(async () => {
    await app.close();
  });

  async function createTestUser(email: string) {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'password123' })
      .expect(201);
    return res.body; // { accessToken, user }
  }

  it('rejects unauthenticated requests with 401', async () => {
    await request(app.getHttpServer()).get('/api/tasks').expect(401);
  });

  it('starts with an empty task list for an authenticated user', async () => {
    const { accessToken } = await createTestUser('alice@example.com');

    const res = await request(app.getHttpServer())
      .get('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it('creates a task scoped to the authenticated user and persists in PostgreSQL', async () => {
    const { accessToken, user } = await createTestUser('alice@example.com');
    const payload = {
      title: 'Setup Monorepo Architecture',
      description: 'Implement contracts, server, and client',
    };

    const res = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(String),
      title: 'Setup Monorepo Architecture',
      description: 'Implement contracts, server, and client',
      isCompleted: false,
    });

    // Directly verify Kysely query against Postgres confirms user_id scoping
    const inDb = await kysely.db
      .selectFrom('tasks')
      .selectAll()
      .where('id', '=', res.body.id)
      .executeTakeFirst();

    expect(inDb).toBeDefined();
    expect(inDb?.user_id).toBe(user.id);
    expect(inDb?.title).toBe('Setup Monorepo Architecture');
    expect(inDb?.is_completed).toBe(false);
  });

  it('rejects task creation when title is empty (Zod validation)', async () => {
    const { accessToken } = await createTestUser('alice@example.com');
    const invalidPayload = { title: '' };

    const res = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(invalidPayload)
      .expect(400);

    expect(res.body.message).toBe('Validation failed');
  });

  it('updates task completion state via PATCH /api/tasks/:id', async () => {
    const { accessToken } = await createTestUser('alice@example.com');

    // 1. Create task
    const createRes = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Review PR' })
      .expect(201);

    const taskId = createRes.body.id;

    // 2. Patch task to completed
    const patchRes = await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ isCompleted: true })
      .expect(200);

    expect(patchRes.body.isCompleted).toBe(true);

    // 3. Verify in DB
    const inDb = await kysely.db
      .selectFrom('tasks')
      .selectAll()
      .where('id', '=', taskId)
      .executeTakeFirst();

    expect(inDb?.is_completed).toBe(true);
  });

  it('enforces strict multi-tenant isolation: User B cannot see or modify User A tasks', async () => {
    const userA = await createTestUser('alice@example.com');
    const userB = await createTestUser('bob@example.com');

    // User A creates a task
    const createRes = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({ title: 'Alice Private Strategy' })
      .expect(201);

    const taskId = createRes.body.id;

    // User B lists tasks: must NOT see Alice's task
    const bobList = await request(app.getHttpServer())
      .get('/api/tasks')
      .set('Authorization', `Bearer ${userB.accessToken}`)
      .expect(200);

    expect(bobList.body).toEqual([]);

    // User B attempts to access Alice's task by ID: must return 404
    await request(app.getHttpServer())
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userB.accessToken}`)
      .expect(404);

    // User B attempts to update Alice's task: must return 404
    await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userB.accessToken}`)
      .send({ title: 'Hacked by Bob' })
      .expect(404);

    // User B attempts to delete Alice's task: must return 404
    await request(app.getHttpServer())
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userB.accessToken}`)
      .expect(404);

    // Verify task is still intact in Alice's list
    const aliceList = await request(app.getHttpServer())
      .get('/api/tasks')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .expect(200);

    expect(aliceList.body).toHaveLength(1);
    expect(aliceList.body[0].title).toBe('Alice Private Strategy');
  });

  describe('Two-Date Model (todoDate vs deadline) & Execution Guard', () => {
    it('creates a task with todoDate and deadline, verifying persistence and DTO', async () => {
      const { accessToken } = await createTestUser('carmack@example.com');
      const payload = {
        title: 'Optimize Render Pipeline',
        todoDate: '2026-10-15',
        deadline: '2026-10-20T12:00:00.000Z',
      };

      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      expect(res.body.title).toBe('Optimize Render Pipeline');
      expect(res.body.todoDate).toBe('2026-10-15');
      expect(res.body.deadline).toBe('2026-10-20T12:00:00.000Z');

      // Verify in DB
      const inDb = await kysely.db
        .selectFrom('tasks')
        .selectAll()
        .where('id', '=', res.body.id)
        .executeTakeFirst();

      expect(inDb).toBeDefined();
      expect(inDb?.todo_date).toBeDefined();
    });

    it('rejects completing a task before its scheduled todoDate (Only-When rule)', async () => {
      const { accessToken } = await createTestUser('norman@example.com');

      // Task scheduled for future date
      const createRes = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Prepare Lecture Slides',
          todoDate: '2026-12-01',
        })
        .expect(201);

      const taskId = createRes.body.id;

      // Attempting to complete before scheduled date (using reference date 2026-10-04)
      const patchRes = await request(app.getHttpServer())
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-simulated-date', '2026-10-04')
        .send({ isCompleted: true })
        .expect(400);

      expect(patchRes.body.message).toMatch(/Cannot complete task before its scheduled date/);

      // Verify task remains incomplete in DB
      const inDb = await kysely.db
        .selectFrom('tasks')
        .selectAll()
        .where('id', '=', taskId)
        .executeTakeFirst();

      expect(inDb?.is_completed).toBe(false);
    });

    it('permits completing the task once the scheduled todoDate is reached', async () => {
      const { accessToken } = await createTestUser('anders@example.com');

      const createRes = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Publish TypeScript 6.0',
          todoDate: '2026-10-10',
        })
        .expect(201);

      const taskId = createRes.body.id;

      // Simulate date travel to 2026-10-10
      const patchRes = await request(app.getHttpServer())
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-simulated-date', '2026-10-10')
        .send({ isCompleted: true })
        .expect(200);

      expect(patchRes.body.isCompleted).toBe(true);
    });

    it('spawns next occurrence upon completion for recurring tasks', async () => {
      const { accessToken } = await createTestUser('carmack_repeat@example.com');

      // 1. Create a daily recurring task
      const createRes = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Daily System Profiling',
          todoDate: '2026-10-04',
          recurrenceRule: { frequency: 'DAILY' },
        })
        .expect(201);

      const taskId = createRes.body.id;
      expect(createRes.body.recurrenceRule?.frequency).toBe('DAILY');

      // 2. Complete the task on simulated date 2026-10-04
      const patchRes = await request(app.getHttpServer())
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-simulated-date', '2026-10-04')
        .send({ isCompleted: true })
        .expect(200);

      expect(patchRes.body.isCompleted).toBe(true);

      // 3. Query all tasks for user: should have 2 tasks (1 completed for Oct 4, 1 pending for Oct 5)
      const listRes = await request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(listRes.body).toHaveLength(2);

      const completedTask = listRes.body.find((t: { id: string }) => t.id === taskId);
      expect(completedTask.isCompleted).toBe(true);
      expect(completedTask.todoDate).toBe('2026-10-04');

      const nextTask = listRes.body.find((t: { id: string }) => t.id !== taskId);
      expect(nextTask.isCompleted).toBe(false);
      expect(nextTask.title).toBe('Daily System Profiling');
      expect(nextTask.todoDate).toBe('2026-10-05');
      expect(nextTask.recurrenceRule?.frequency).toBe('DAILY');
      expect(nextTask.parentTaskId).toBe(taskId);
    });
  });
});
