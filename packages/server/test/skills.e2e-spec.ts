import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { KyselyService } from '../src/database/kysely.service';
import { truncateTestDatabase } from './test-utils/db-truncate';

describe('Skills API Integration (CRUD, Derived Mastery & Task Links)', () => {
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

  it('rejects unauthenticated requests to /api/skills with 401', async () => {
    await request(app.getHttpServer()).get('/api/skills').expect(401);
  });

  it('performs CRUD operations for skills and derives zero-drift completedTaskCount', async () => {
    const { accessToken } = await createTestUser('carmack@idsoftware.com');

    // 1. Create skills
    const mathRes = await request(app.getHttpServer())
      .post('/api/skills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Math', color: '#6366f1' })
      .expect(201);

    expect(mathRes.body).toMatchObject({
      name: 'Math',
      color: '#6366f1',
      completedTaskCount: 0,
    });
    expect(mathRes.body.id).toBeDefined();

    const readingRes = await request(app.getHttpServer())
      .post('/api/skills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Reading', color: '#10b981' })
      .expect(201);

    // 2. Reject duplicate skill name (case-insensitive)
    await request(app.getHttpServer())
      .post('/api/skills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'math' })
      .expect(409);

    // 3. Update skill
    const patchRes = await request(app.getHttpServer())
      .patch(`/api/skills/${mathRes.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Advanced Mathematics', color: '#0ea5e9' })
      .expect(200);

    expect(patchRes.body.name).toBe('Advanced Mathematics');
    expect(patchRes.body.color).toBe('#0ea5e9');

    // 4. Create tasks linked to skills
    const taskRes = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Study 3D Vectors',
        skillIds: [mathRes.body.id, readingRes.body.id],
      })
      .expect(201);

    expect(taskRes.body.skills).toHaveLength(2);
    expect(taskRes.body.skills.map((s: { name: string }) => s.name).sort()).toEqual([
      'Advanced Mathematics',
      'Reading',
    ]);

    // Query skills list: counts are still 0 because task is not completed
    let skillsList = await request(app.getHttpServer())
      .get('/api/skills')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(
      skillsList.body.find((s: { id: string }) => s.id === mathRes.body.id).completedTaskCount,
    ).toBe(0);

    // 5. Complete the task -> count dynamically increments to 1
    await request(app.getHttpServer())
      .patch(`/api/tasks/${taskRes.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ isCompleted: true })
      .expect(200);

    skillsList = await request(app.getHttpServer())
      .get('/api/skills')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const mathSkill = skillsList.body.find((s: { id: string }) => s.id === mathRes.body.id);
    const readingSkill = skillsList.body.find((s: { id: string }) => s.id === readingRes.body.id);
    expect(mathSkill.completedTaskCount).toBe(1);
    expect(readingSkill.completedTaskCount).toBe(1);

    // 6. Uncomplete the task -> count dynamically reverts to 0 (zero state drift)
    await request(app.getHttpServer())
      .patch(`/api/tasks/${taskRes.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ isCompleted: false })
      .expect(200);

    skillsList = await request(app.getHttpServer())
      .get('/api/skills')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(
      skillsList.body.find((s: { id: string }) => s.id === mathRes.body.id).completedTaskCount,
    ).toBe(0);

    // 7. Delete skill -> task_skills association removed, task still exists
    await request(app.getHttpServer())
      .delete(`/api/skills/${readingRes.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const singleTask = await request(app.getHttpServer())
      .get(`/api/tasks/${taskRes.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(singleTask.body.skills).toHaveLength(1);
    expect(singleTask.body.skills[0].id).toBe(mathRes.body.id);
  });

  it('enforces multi-tenant isolation: User A cannot tag User B skills or see User B skills', async () => {
    const userA = await createTestUser('userA@example.com');
    const userB = await createTestUser('userB@example.com');

    // User A creates a skill
    const userASkill = await request(app.getHttpServer())
      .post('/api/skills')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({ name: 'Private User A Skill' })
      .expect(201);

    // User B cannot see User A skill
    const userBSkills = await request(app.getHttpServer())
      .get('/api/skills')
      .set('Authorization', `Bearer ${userB.accessToken}`)
      .expect(200);

    expect(userBSkills.body).toEqual([]);

    // User B cannot attach User A's skill to User B's task (rejected with 400 Bad Request)
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userB.accessToken}`)
      .send({
        title: 'Unauthorized Tagging Task',
        skillIds: [userASkill.body.id],
      })
      .expect(400);

    // User B cannot modify or delete User A's skill
    await request(app.getHttpServer())
      .patch(`/api/skills/${userASkill.body.id}`)
      .set('Authorization', `Bearer ${userB.accessToken}`)
      .send({ name: 'Hacked Skill' })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/skills/${userASkill.body.id}`)
      .set('Authorization', `Bearer ${userB.accessToken}`)
      .expect(404);
  });

  it('propagates skills to newly materialized recurring task instances', async () => {
    const { accessToken } = await createTestUser('recurring-skills@example.com');

    const skill = await request(app.getHttpServer())
      .post('/api/skills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'TypeScript' })
      .expect(201);

    const recurringTask = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Daily Code Practice',
        todoDate: '2026-10-01',
        recurrenceRule: {
          frequency: 'DAILY',
          interval: 1,
        },
        skillIds: [skill.body.id],
      })
      .expect(201);

    // Complete the task on 2026-10-01
    await request(app.getHttpServer())
      .patch(`/api/tasks/${recurringTask.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-simulated-date', '2026-10-01')
      .send({ isCompleted: true })
      .expect(200);

    // Verify all tasks for user
    const listRes = await request(app.getHttpServer())
      .get('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(listRes.body).toHaveLength(2);
    const spawnedTask = listRes.body.find((t: { id: string }) => t.id !== recurringTask.body.id);
    expect(spawnedTask).toBeDefined();
    expect(spawnedTask.todoDate).toBe('2026-10-02');
    expect(spawnedTask.skills).toHaveLength(1);
    expect(spawnedTask.skills[0].id).toBe(skill.body.id);
  });
});
