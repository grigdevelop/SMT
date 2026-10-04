import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import crypto from 'node:crypto';
import { AppModule } from '../src/app.module';
import { KyselyService } from '../src/database/kysely.service';
import { truncateTestDatabase } from './test-utils/db-truncate';

describe('API Tokens & RBAC Integration (Real PostgreSQL & SHA-256)', () => {
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

  it('generates an API token, verifies SHA-256 hashing in DB, and enforces one-time secret reveal', async () => {
    // 1. Register a user
    const userRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'developer@example.com', password: 'password123' })
      .expect(201);

    const jwt = userRes.body.accessToken;

    // 2. Generate API token
    const tokenRes = await request(app.getHttpServer())
      .post('/api/tokens')
      .set('Authorization', `Bearer ${jwt}`)
      .send({ name: 'MacBook CLI' })
      .expect(201);

    expect(tokenRes.body).toMatchObject({
      id: expect.any(String),
      name: 'MacBook CLI',
      tokenPreview: expect.stringMatching(/^smt_pat_[a-f0-9]{4}\.\.\.[a-f0-9]{4}$/),
      rawToken: expect.stringMatching(/^smt_pat_[a-f0-9]{64}$/),
      lastUsedAt: null,
    });

    const rawToken = tokenRes.body.rawToken;

    // 3. Directly inspect PostgreSQL row: rawToken is NEVER stored; SHA-256 hash is stored!
    const inDb = await kysely.db
      .selectFrom('api_tokens')
      .selectAll()
      .where('id', '=', tokenRes.body.id)
      .executeTakeFirst();

    expect(inDb).toBeDefined();
    expect(inDb?.name).toBe('MacBook CLI');
    // Ensure raw token is not in DB
    expect(inDb?.token_hash).not.toBe(rawToken);

    // Verify SHA-256 hash derivation
    const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    expect(inDb?.token_hash).toBe(expectedHash);

    // 4. Listing tokens NEVER leaks rawToken or token_hash
    const listRes = await request(app.getHttpServer())
      .get('/api/tokens')
      .set('Authorization', `Bearer ${jwt}`)
      .expect(200);

    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].rawToken).toBeUndefined();
    expect(listRes.body[0].token_hash).toBeUndefined();
    expect(listRes.body[0].tokenPreview).toBe(tokenRes.body.tokenPreview);
  });

  it('authenticates API requests using a Personal API Token and updates last_used_at', async () => {
    // 1. Setup user & token
    const userRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'pat_user@example.com', password: 'password123' })
      .expect(201);

    const jwt = userRes.body.accessToken;

    const tokenRes = await request(app.getHttpServer())
      .post('/api/tokens')
      .set('Authorization', `Bearer ${jwt}`)
      .send({ name: 'Automation Cron' })
      .expect(201);

    const pat = tokenRes.body.rawToken;

    // 2. Call protected /api/auth/me using the PAT Bearer token!
    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${pat}`)
      .expect(200);

    expect(meRes.body.email).toBe('pat_user@example.com');

    // Wait a brief tick for async last_used_at update
    await new Promise((resolve) => setTimeout(resolve, 50));

    // 3. Verify in PostgreSQL that last_used_at was touched
    const inDb = await kysely.db
      .selectFrom('api_tokens')
      .selectAll()
      .where('id', '=', tokenRes.body.id)
      .executeTakeFirst();

    expect(inDb?.last_used_at).not.toBeNull();
  });

  it('revokes an API token and rejects subsequent requests', async () => {
    const userRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'revoke_test@example.com', password: 'password123' })
      .expect(201);

    const jwt = userRes.body.accessToken;

    const tokenRes = await request(app.getHttpServer())
      .post('/api/tokens')
      .set('Authorization', `Bearer ${jwt}`)
      .send({ name: 'To Be Revoked' })
      .expect(201);

    const pat = tokenRes.body.rawToken;
    const tokenId = tokenRes.body.id;

    // Verify it works initially
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${pat}`)
      .expect(200);

    // Revoke token
    await request(app.getHttpServer())
      .delete(`/api/tokens/${tokenId}`)
      .set('Authorization', `Bearer ${jwt}`)
      .expect(204);

    // Attempt request with revoked token -> 401
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${pat}`)
      .expect(401);
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('rejects standard USER accessing ADMIN-only endpoint with 403 Forbidden', async () => {
      // Standard USER registration
      const userRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'standard@example.com', password: 'password123', role: 'USER' })
        .expect(201);

      const userToken = userRes.body.accessToken;

      // Access admin endpoint -> 403
      const forbiddenRes = await request(app.getHttpServer())
        .get('/api/auth/admin/status')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(forbiddenRes.body.message).toContain('Access denied');
    });

    it('allows ADMIN accessing ADMIN-only endpoint with 200 OK', async () => {
      // ADMIN registration
      const adminRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'admin@example.com', password: 'password123', role: 'ADMIN' })
        .expect(201);

      const adminToken = adminRes.body.accessToken;

      // Access admin endpoint -> 200
      const okRes = await request(app.getHttpServer())
        .get('/api/auth/admin/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(okRes.body).toMatchObject({
        status: 'healthy',
        adminEmail: 'admin@example.com',
        role: 'ADMIN',
      });
    });
  });
});
