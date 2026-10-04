import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { KyselyService } from '../src/database/kysely.service';
import { truncateTestDatabase } from './test-utils/db-truncate';

describe('Auth API Integration (Real PostgreSQL & JWT)', () => {
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

  it('registers a new user and returns a signed JWT', async () => {
    const payload = {
      email: 'alex@example.com',
      password: 'password123',
    };

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(payload)
      .expect(201);

    expect(res.body).toMatchObject({
      accessToken: expect.any(String),
      user: {
        id: expect.any(String),
        email: 'alex@example.com',
        role: 'USER',
      },
    });

    // Verify raw user in Postgres & ensure password was hashed
    const userInDb = await kysely.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', 'alex@example.com')
      .executeTakeFirst();

    expect(userInDb).toBeDefined();
    expect(userInDb?.password_hash).not.toBe('password123');
    expect(userInDb?.password_hash.startsWith('$2')).toBe(true);
  });

  it('rejects duplicate email registration with 409 Conflict', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'duplicate@example.com', password: 'password123' })
      .expect(201);

    const duplicateRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'duplicate@example.com', password: 'differentpassword' })
      .expect(409);

    expect(duplicateRes.body.message).toBe('Email is already registered');
  });

  it('authenticates a registered user via POST /api/auth/login', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'login@example.com', password: 'mypassword123' })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'mypassword123' })
      .expect(200);

    expect(loginRes.body.accessToken).toBeDefined();
    expect(loginRes.body.user.email).toBe('login@example.com');
  });

  it('rejects login with invalid password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'wrongpwd@example.com', password: 'mypassword123' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'wrongpwd@example.com', password: 'wrongpassword' })
      .expect(401);
  });

  it('protects GET /api/auth/me requiring valid Bearer JWT', async () => {
    // 1. Without token -> 401
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);

    // 2. Register to obtain token
    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'me@example.com', password: 'password123' })
      .expect(201);

    const token = regRes.body.accessToken;

    // 3. With valid token -> 200
    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(meRes.body.email).toBe('me@example.com');
    expect(meRes.body.id).toBe(regRes.body.user.id);
  });
});
