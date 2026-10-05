import { describe, it, expect } from 'vitest';
import {
  RegisterSchema,
  LoginSchema,
  CreateApiTokenSchema,
  UpdateUserRoleSchema,
  Role,
} from './auth.contract';

describe('Auth Contracts (Zod Validation)', () => {
  describe('RegisterSchema', () => {
    it('validates valid registration input and lowercases email', () => {
      const result = RegisterSchema.safeParse({
        email: '  USER@EXAMPLE.COM  ',
        password: 'securepassword123',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    it('ignores any extraneous role passed in registration payload (privilege escalation prevention)', () => {
      const result = RegisterSchema.safeParse({
        email: 'admin@example.com',
        password: 'securepassword123',
        role: Role.ADMIN,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Zod object strips keys not in schema
        expect((result.data as Record<string, unknown>).role).toBeUndefined();
      }
    });

    it('rejects passwords shorter than 8 characters', () => {
      const result = RegisterSchema.safeParse({
        email: 'user@example.com',
        password: '1234567',
      });

      expect(result.success).toBe(false);
    });

    it('rejects invalid email formats', () => {
      expect(
        RegisterSchema.safeParse({ email: 'not-an-email', password: 'password123' }).success,
      ).toBe(false);
    });
  });

  describe('LoginSchema', () => {
    it('validates valid login credentials', () => {
      const result = LoginSchema.safeParse({
        email: '  USER@EXAMPLE.COM ',
        password: 'anypassword',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    it('rejects empty password', () => {
      expect(LoginSchema.safeParse({ email: 'user@example.com', password: '' }).success).toBe(
        false,
      );
    });
  });

  describe('CreateApiTokenSchema', () => {
    it('validates and trims token name', () => {
      const result = CreateApiTokenSchema.safeParse({ name: '  MacBook CLI  ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('MacBook CLI');
      }
    });

    it('rejects empty name or names exceeding 100 characters', () => {
      expect(CreateApiTokenSchema.safeParse({ name: '   ' }).success).toBe(false);
      expect(CreateApiTokenSchema.safeParse({ name: 'a'.repeat(101) }).success).toBe(false);
    });
  });

  describe('UpdateUserRoleSchema', () => {
    it('validates ADMIN and USER roles', () => {
      expect(UpdateUserRoleSchema.safeParse({ role: Role.ADMIN }).success).toBe(true);
      expect(UpdateUserRoleSchema.safeParse({ role: Role.USER }).success).toBe(true);
    });

    it('rejects invalid or missing role values', () => {
      expect(UpdateUserRoleSchema.safeParse({ role: 'SUPERADMIN' }).success).toBe(false);
      expect(UpdateUserRoleSchema.safeParse({ role: '' }).success).toBe(false);
      expect(UpdateUserRoleSchema.safeParse({}).success).toBe(false);
    });
  });
});
