import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { KyselyService } from '../src/database/kysely.service';
import { truncateTestDatabase } from './test-utils/db-truncate';
import { Role } from '@self/contracts';
import { AdminBootstrapService } from '../src/auth/admin-bootstrap.service';
import { UsersRepository } from '../src/users/users.repository';

describe('Admin Users API & Default Admin Bootstrap', () => {
  let app: INestApplication;
  let kysely: KyselyService;
  let bootstrapService: AdminBootstrapService;
  let usersRepo: UsersRepository;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/self_mgmt_test';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    kysely = app.get(KyselyService);
    bootstrapService = app.get(AdminBootstrapService);
    usersRepo = app.get(UsersRepository);
  });

  beforeEach(async () => {
    await truncateTestDatabase(kysely.db);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('AdminBootstrapService', () => {
    it('creates default administrator on startup when none exists', async () => {
      await bootstrapService.onApplicationBootstrap();

      const admin = await usersRepo.findByEmail('admin@self.local');
      expect(admin).toBeDefined();
      expect(admin?.role).toBe(Role.ADMIN);
      expect(admin?.email).toBe('admin@self.local');

      // Calling again is idempotent and does not create duplicate
      await bootstrapService.onApplicationBootstrap();
      const allAdmins = await kysely.db
        .selectFrom('users')
        .selectAll()
        .where('role', '=', Role.ADMIN)
        .execute();
      expect(allAdmins.length).toBe(1);
    });

    it('promotes existing user to admin if matching default email', async () => {
      // Register user as normal USER
      await usersRepo.create({
        email: 'admin@self.local',
        password_hash: 'somehash',
        role: Role.USER,
      });

      await bootstrapService.onApplicationBootstrap();

      const user = await usersRepo.findByEmail('admin@self.local');
      expect(user?.role).toBe(Role.ADMIN);
    });
  });

  describe('RBAC & User Management Endpoints', () => {
    let adminToken: string;
    let adminId: string;
    let standardToken: string;
    let standardId: string;

    beforeEach(async () => {
      // Create admin user
      const adminRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'admin@example.com', password: 'password123' });
      adminId = adminRes.body.user.id;

      // Manually set role to ADMIN in DB
      await usersRepo.updateRole(adminId, Role.ADMIN);

      // Re-login to get token with ADMIN role payload
      const loginAdmin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: 'password123' });
      adminToken = loginAdmin.body.accessToken;

      // Create regular user
      const userRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'user@example.com', password: 'password123' });
      standardId = userRes.body.user.id;
      standardToken = userRes.body.accessToken;
    });

    it('rejects unauthenticated requests with 401', async () => {
      await request(app.getHttpServer()).get('/api/admin/users').expect(401);
      await request(app.getHttpServer())
        .patch(`/api/admin/users/${standardId}/role`)
        .send({ role: Role.ADMIN })
        .expect(401);
      await request(app.getHttpServer()).delete(`/api/admin/users/${standardId}`).expect(401);
    });

    it('rejects regular users with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${standardToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .patch(`/api/admin/users/${standardId}/role`)
        .set('Authorization', `Bearer ${standardToken}`)
        .send({ role: Role.ADMIN })
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/api/admin/users/${standardId}`)
        .set('Authorization', `Bearer ${standardToken}`)
        .expect(403);
    });

    it('allows admin to list all users with taskCount and skillCount', async () => {
      // Add a task and a skill for standard user
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${standardToken}`)
        .send({ title: 'User Task 1' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/skills')
        .set('Authorization', `Bearer ${standardToken}`)
        .send({ name: 'User Skill 1' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);

      const targetUser = res.body.find((u: { id: string }) => u.id === standardId);
      expect(targetUser).toBeDefined();
      expect(targetUser.email).toBe('user@example.com');
      expect(targetUser.role).toBe(Role.USER);
      expect(targetUser.taskCount).toBe(1);
      expect(targetUser.skillCount).toBe(1);

      const adminUser = res.body.find((u: { id: string }) => u.id === adminId);
      expect(adminUser).toBeDefined();
      expect(adminUser.role).toBe(Role.ADMIN);
      expect(adminUser.taskCount).toBe(0);
      expect(adminUser.skillCount).toBe(0);
    });

    it('allows admin to change user role between USER and ADMIN', async () => {
      // Promote standard user to ADMIN
      const promoteRes = await request(app.getHttpServer())
        .patch(`/api/admin/users/${standardId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: Role.ADMIN })
        .expect(200);

      expect(promoteRes.body.role).toBe(Role.ADMIN);

      // Verify in DB
      const inDb = await usersRepo.findById(standardId);
      expect(inDb?.role).toBe(Role.ADMIN);

      // Demote back to USER
      const demoteRes = await request(app.getHttpServer())
        .patch(`/api/admin/users/${standardId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: Role.USER })
        .expect(200);

      expect(demoteRes.body.role).toBe(Role.USER);
    });

    it('prevents an admin from modifying their own role (self-lockout guard)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/admin/users/${adminId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: Role.USER })
        .expect(403);

      expect(res.body.message).toContain('Cannot modify your own administrator role');
    });

    it('prevents an admin from deleting their own account (self-lockout guard)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/admin/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(res.body.message).toContain('Cannot delete your own administrator account');
    });

    it('allows admin to delete a user and cascades tasks and skills', async () => {
      // Create a task and skill for standard user
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${standardToken}`)
        .send({ title: 'Task to be cascaded' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/skills')
        .set('Authorization', `Bearer ${standardToken}`)
        .send({ name: 'Skill to be cascaded' })
        .expect(201);

      // Delete standard user
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/admin/users/${standardId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleteRes.body).toEqual({ success: true, deletedUserId: standardId });

      // Verify user is deleted
      const userInDb = await usersRepo.findById(standardId);
      expect(userInDb).toBeUndefined();

      // Verify tasks and skills were cascaded
      const remainingTasks = await kysely.db
        .selectFrom('tasks')
        .selectAll()
        .where('user_id', '=', standardId)
        .execute();
      expect(remainingTasks.length).toBe(0);

      const remainingSkills = await kysely.db
        .selectFrom('skills')
        .selectAll()
        .where('user_id', '=', standardId)
        .execute();
      expect(remainingSkills.length).toBe(0);
    });
  });
});
