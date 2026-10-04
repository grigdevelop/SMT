import { describe, it, expect } from 'vitest';
import { CreateTaskSchema, UpdateTaskSchema } from './task.contract';

describe('Task Contracts (Zod Validation)', () => {
  describe('CreateTaskSchema', () => {
    it('validates and trims valid task input', () => {
      const input = {
        title: '  Plan sprint  ',
        description: 'Detail tasks',
      };
      const result = CreateTaskSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Plan sprint');
      }
    });

    it('rejects empty title or whitespace-only title', () => {
      expect(CreateTaskSchema.safeParse({ title: '' }).success).toBe(false);
      expect(CreateTaskSchema.safeParse({ title: '   ' }).success).toBe(false);
    });

    it('rejects title longer than 255 chars', () => {
      expect(CreateTaskSchema.safeParse({ title: 'a'.repeat(256) }).success).toBe(false);
    });
  });

  describe('UpdateTaskSchema', () => {
    it('allows updating only completion state', () => {
      const result = UpdateTaskSchema.safeParse({ isCompleted: true });
      expect(result.success).toBe(true);
    });

    it('allows nullifying dueDate', () => {
      const result = UpdateTaskSchema.safeParse({ dueDate: null });
      expect(result.success).toBe(true);
    });
  });
});
