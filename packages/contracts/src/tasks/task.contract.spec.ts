import { describe, it, expect } from 'vitest';
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  getTaskStatus,
  TaskStatus,
  calculateNextTodoDate,
  formatRecurrenceLabel,
} from './task.contract';

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

    it('accepts description up to 5000 chars and rejects over 5000 chars', () => {
      const valid = CreateTaskSchema.safeParse({
        title: 'Task',
        description: 'a'.repeat(5000),
      });
      expect(valid.success).toBe(true);

      const invalid = CreateTaskSchema.safeParse({
        title: 'Task',
        description: 'a'.repeat(5001),
      });
      expect(invalid.success).toBe(false);
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

  describe('calculateNextTodoDate & formatRecurrenceLabel', () => {
    it('calculates DAILY recurrence correctly', () => {
      expect(calculateNextTodoDate({ frequency: 'DAILY' }, '2026-10-04')).toBe('2026-10-05');
      expect(calculateNextTodoDate({ frequency: 'DAILY', interval: 3 }, '2026-10-04')).toBe(
        '2026-10-07',
      );
    });

    it('calculates WEEKLY recurrence forward to earliest selected weekday', () => {
      // 2026-10-04 is a Sunday (day 0)
      // Mon = 1, Wed = 3, Fri = 5
      const rule = { frequency: 'WEEKLY' as const, daysOfWeek: [1, 3, 5] };
      // From Sunday Oct 4, next is Monday Oct 5
      expect(calculateNextTodoDate(rule, '2026-10-04')).toBe('2026-10-05');
      // From Monday Oct 5, next is Wednesday Oct 7
      expect(calculateNextTodoDate(rule, '2026-10-05')).toBe('2026-10-07');
      // From Friday Oct 9, next cycles to next Monday Oct 12
      expect(calculateNextTodoDate(rule, '2026-10-09')).toBe('2026-10-12');
    });

    it('calculates MONTHLY recurrence with end-of-month day clamping', () => {
      const rule = { frequency: 'MONTHLY' as const, daysOfMonth: [1, 15] };
      // From Oct 4, next is Oct 15
      expect(calculateNextTodoDate(rule, '2026-10-04')).toBe('2026-10-15');
      // From Oct 15, next is Nov 1
      expect(calculateNextTodoDate(rule, '2026-10-15')).toBe('2026-11-01');

      // Clamping test: Day 31 in April (only 30 days)
      const day31Rule = { frequency: 'MONTHLY' as const, daysOfMonth: [31] };
      expect(calculateNextTodoDate(day31Rule, '2026-03-31')).toBe('2026-04-30');
      // In February (non-leap year 2027) -> Feb 28
      expect(calculateNextTodoDate(day31Rule, '2027-01-31')).toBe('2027-02-28');
    });

    it('calculates YEARLY recurrence', () => {
      const rule = {
        frequency: 'YEARLY' as const,
        yearlyDate: { month: 12, day: 25 },
      };
      // From Oct 4, 2026 -> Dec 25, 2026
      expect(calculateNextTodoDate(rule, '2026-10-04')).toBe('2026-12-25');
      // From Dec 26, 2026 -> Dec 25, 2027
      expect(calculateNextTodoDate(rule, '2026-12-26')).toBe('2027-12-25');
    });

    it('generates friendly human-readable recurrence labels', () => {
      expect(formatRecurrenceLabel({ frequency: 'DAILY' })).toBe('Daily');
      expect(formatRecurrenceLabel({ frequency: 'WEEKLY', daysOfWeek: [1, 3, 5] })).toBe(
        'Weekly: Mon, Wed, Fri',
      );
      expect(formatRecurrenceLabel({ frequency: 'MONTHLY', daysOfMonth: [1, 15] })).toBe(
        'Monthly: day 1, 15',
      );
      expect(
        formatRecurrenceLabel({
          frequency: 'YEARLY',
          yearlyDate: { month: 10, day: 4 },
        }),
      ).toBe('Yearly on Oct 4');
    });
  });
});
