import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { KyselyService } from '../src/database/kysely.service';
import { truncateTestDatabase } from './test-utils/db-truncate';

describe('Tasks API Integration (Real PostgreSQL & Isolation)', () => {
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
    // Guaranteed Isolation: fast table truncation before each test
    await truncateTestDatabase(kysely.db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('starts with an empty task list due to isolation truncation', async () => {
    const res = await request(app.getHttpServer()).get('/api/tasks').expect(200);
    expect(res.body).toEqual([]);
  });

  it('creates a task via POST /api/tasks and verifies persistence in PostgreSQL', async () => {
    const payload = {
      title: 'Setup Monorepo Architecture',
      description: 'Implement contracts, server, and client',
    };

    const res = await request(app.getHttpServer()).post('/api/tasks').send(payload).expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(String),
      title: 'Setup Monorepo Architecture',
      description: 'Implement contracts, server, and client',
      isCompleted: false,
    });

    // Directly verify Kysely query against Postgres
    const inDb = await kysely.db
      .selectFrom('tasks')
      .selectAll()
      .where('id', '=', res.body.id)
      .executeTakeFirst();

    expect(inDb).toBeDefined();
    expect(inDb?.title).toBe('Setup Monorepo Architecture');
    expect(inDb?.is_completed).toBe(false);
  });

  it('rejects task creation when title is empty (Zod validation)', async () => {
    const invalidPayload = { title: '' };

    const res = await request(app.getHttpServer())
      .post('/api/tasks')
      .send(invalidPayload)
      .expect(400);

    expect(res.body.message).toBe('Validation failed');
  });

  it('updates task completion state via PATCH /api/tasks/:id', async () => {
    // 1. Create task
    const createRes = await request(app.getHttpServer())
      .post('/api/tasks')
      .send({ title: 'Review PR' })
      .expect(201);

    const taskId = createRes.body.id;

    // 2. Patch task to completed
    const patchRes = await request(app.getHttpServer())
      .patch(`/api/tasks/${taskId}`)
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
});
