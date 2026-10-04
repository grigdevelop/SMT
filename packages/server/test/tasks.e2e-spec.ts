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
});
