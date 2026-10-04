import { describe, it, expect } from 'vitest';
import { CreateTaskSchema, UpdateTaskSchema, getTaskStatus, TaskStatus } from './task.contract';

describe('Task Contracts (Zod Validation & Status Lifecycle)', () => {
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

    it('validates valid civil todoDate format (YYYY-MM-DD)', () => {
      const valid = CreateTaskSchema.safeParse({ title: 'Task', todoDate: '2026-10-10' });
      expect(valid.success).toBe(true);

      const invalid = CreateTaskSchema.safeParse({ title: 'Task', todoDate: '10/10/2026' });
      expect(invalid.success).toBe(false);
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

  describe('getTaskStatus Pure Calculation', () => {
    const today = '2026-10-04';

    it('returns COMPLETED if isCompleted is true regardless of dates', () => {
      expect(
        getTaskStatus(
          { isCompleted: true, deadline: '2026-10-01T00:00:00Z', todoDate: '2026-10-10' },
          today,
        ),
      ).toBe(TaskStatus.COMPLETED);
    });

    it('returns OVERDUE if deadline date precedes today and task is incomplete', () => {
      expect(getTaskStatus({ isCompleted: false, deadline: '2026-10-02T18:00:00Z' }, today)).toBe(
        TaskStatus.OVERDUE,
      );
    });

    it('returns UPCOMING if todoDate is in the future', () => {
      expect(getTaskStatus({ isCompleted: false, todoDate: '2026-10-08' }, today)).toBe(
        TaskStatus.UPCOMING,
      );
    });

    it('returns OVERDUE if todoDate is in the past and no future deadline exists', () => {
      expect(getTaskStatus({ isCompleted: false, todoDate: '2026-10-02' }, today)).toBe(
        TaskStatus.OVERDUE,
      );
    });

    it('returns TODAY if todoDate is in the past but future deadline exists', () => {
      expect(
        getTaskStatus(
          { isCompleted: false, todoDate: '2026-10-02', deadline: '2026-10-10T12:00:00Z' },
          today,
        ),
      ).toBe(TaskStatus.TODAY);
    });

    it('returns TODAY if todoDate is today or if no dates are set', () => {
      expect(getTaskStatus({ isCompleted: false, todoDate: '2026-10-04' }, today)).toBe(
        TaskStatus.TODAY,
      );
      expect(getTaskStatus({ isCompleted: false }, today)).toBe(TaskStatus.TODAY);
    });
  });
});
