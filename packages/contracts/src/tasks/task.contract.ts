import { z } from 'zod';
import type { SkillSummaryDto } from '../skills/skill.contract';

/** A task may develop at most 10 skills; duplicates are rejected client- and server-side. */
const SkillIdsSchema = z.array(z.string().uuid()).max(10, 'A task can have at most 10 skills');

export const TaskStatus = {
  UPCOMING: 'UPCOMING',
  TODAY: 'TODAY',
  OVERDUE: 'OVERDUE',
  COMPLETED: 'COMPLETED',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const RecurrenceFrequency = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
} as const;
export type RecurrenceFrequency = (typeof RecurrenceFrequency)[keyof typeof RecurrenceFrequency];

export const RecurrenceRuleSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  interval: z.number().int().min(1).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(), // 0 = Sun, 1 = Mon ... 6 = Sat
  daysOfMonth: z.array(z.number().int().min(1).max(31)).optional(), // 1 to 31
  yearlyDate: z
    .object({
      month: z.number().int().min(1).max(12),
      day: z.number().int().min(1).max(31),
    })
    .optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});
export type RecurrenceRule = z.infer<typeof RecurrenceRuleSchema>;

export const CreateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or less'),
  description: z
    .string()
    .trim()
    .max(5000, 'Description must be 5000 characters or less')
    .optional(),
  todoDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD date')
    .nullable()
    .optional(),
  deadline: z.string().datetime().nullable().optional(),
  dueDate: z.string().datetime().optional(), // Kept for backwards compatibility
  recurrenceRule: RecurrenceRuleSchema.nullable().optional(),
  skillIds: SkillIdsSchema.optional(),
});
export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  isCompleted: z.boolean().optional(),
  todoDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD date')
    .nullable()
    .optional(),
  deadline: z.string().datetime().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  recurrenceRule: RecurrenceRuleSchema.nullable().optional(),
  /** When provided, fully replaces the task's skill set. Omit to leave skills untouched. */
  skillIds: SkillIdsSchema.optional(),
});
export type UpdateTaskDto = z.infer<typeof UpdateTaskSchema>;

export interface TaskDto {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly isCompleted: boolean;
  readonly todoDate?: string | null;
  readonly deadline?: string | null;
  readonly dueDate?: string | null;
  readonly recurrenceRule?: RecurrenceRule | null;
  readonly parentTaskId?: string | null;
  readonly skills?: readonly SkillSummaryDto[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Pure projection function that determines the lifecycle status of a task
 * based on a reference civil date ('YYYY-MM-DD').
 */
export function getTaskStatus(
  task: {
    todoDate?: string | null;
    deadline?: string | null;
    dueDate?: string | null;
    isCompleted: boolean;
  },
  referenceDateStr: string, // 'YYYY-MM-DD'
): TaskStatus {
  if (task.isCompleted) {
    return TaskStatus.COMPLETED;
  }

  const effectiveDeadline = task.deadline || task.dueDate;
  if (effectiveDeadline && effectiveDeadline.slice(0, 10) < referenceDateStr) {
    return TaskStatus.OVERDUE;
  }

  if (!effectiveDeadline && task.todoDate && task.todoDate < referenceDateStr) {
    return TaskStatus.OVERDUE;
  }

  if (task.todoDate && task.todoDate > referenceDateStr) {
    return TaskStatus.UPCOMING;
  }

  return TaskStatus.TODAY;
}

/**
 * Pure calculation function that determines the initial civil todo_date (YYYY-MM-DD)
 * for a recurring task based on its schedule and reference date.
 */
export function calculateInitialTodoDate(rule: RecurrenceRule, referenceDateStr: string): string {
  const effectiveStart =
    rule.startDate && rule.startDate > referenceDateStr ? rule.startDate : referenceDateStr;

  const [startYear, startMonth, startDay] = effectiveStart.split('-').map(Number);
  const baseDate = new Date(startYear, startMonth - 1, startDay);

  const formatOutput = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
  };

  if (rule.frequency === RecurrenceFrequency.DAILY) {
    return effectiveStart;
  }

  if (rule.frequency === RecurrenceFrequency.WEEKLY) {
    const allowedDays =
      rule.daysOfWeek && rule.daysOfWeek.length > 0
        ? [...rule.daysOfWeek].sort((a, b) => a - b)
        : [baseDate.getDay()];

    const candidate = new Date(baseDate);
    for (let i = 0; i <= 14; i++) {
      if (allowedDays.includes(candidate.getDay())) {
        return formatOutput(candidate);
      }
      candidate.setDate(candidate.getDate() + 1);
    }
    return effectiveStart;
  }

  if (rule.frequency === RecurrenceFrequency.MONTHLY) {
    const allowedDays =
      rule.daysOfMonth && rule.daysOfMonth.length > 0
        ? [...rule.daysOfMonth].sort((a, b) => a - b)
        : [startDay];

    const currentMaxDays = getDaysInMonth(startYear, startMonth);
    const validDayThisMonth = allowedDays.find((d) => d >= startDay);

    if (validDayThisMonth) {
      const clampedDay = Math.min(validDayThisMonth, currentMaxDays);
      return `${startYear}-${String(startMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
    }

    // Move to next month
    let nextYear = startYear;
    let nextMonth = startMonth + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    const nextMaxDays = getDaysInMonth(nextYear, nextMonth);
    const clampedDay = Math.min(allowedDays[0], nextMaxDays);
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
  }

  if (rule.frequency === RecurrenceFrequency.YEARLY) {
    const targetMonth = rule.yearlyDate?.month ?? startMonth;
    const targetDay = rule.yearlyDate?.day ?? startDay;

    let candidateYear = startYear;
    let maxDaysInCandidate = getDaysInMonth(candidateYear, targetMonth);
    let clampedCandidateDay = Math.min(targetDay, maxDaysInCandidate);
    const candidateStr = `${candidateYear}-${String(targetMonth).padStart(2, '0')}-${String(clampedCandidateDay).padStart(2, '0')}`;

    if (candidateStr >= effectiveStart) {
      return candidateStr;
    }

    candidateYear += 1;
    maxDaysInCandidate = getDaysInMonth(candidateYear, targetMonth);
    clampedCandidateDay = Math.min(targetDay, maxDaysInCandidate);
    return `${candidateYear}-${String(targetMonth).padStart(2, '0')}-${String(clampedCandidateDay).padStart(2, '0')}`;
  }

  return effectiveStart;
}

/**
 * Pure calculation function that determines the next civil todo_date (YYYY-MM-DD)
 * for a recurring task based on a reference civil date.
 * Returns null if the recurrence has concluded (past rule.endDate).
 */
export function calculateNextTodoDate(
  rule: RecurrenceRule,
  referenceDateStr: string, // 'YYYY-MM-DD'
): string | null {
  const [refYear, refMonth, refDay] = referenceDateStr.split('-').map(Number);
  const baseDate = new Date(refYear, refMonth - 1, refDay);

  const formatOutput = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
  };

  const finalizeDate = (dateStr: string): string | null => {
    if (rule.endDate && dateStr > rule.endDate) {
      return null;
    }
    return dateStr;
  };

  if (rule.frequency === RecurrenceFrequency.DAILY) {
    const interval = Math.max(1, rule.interval || 1);
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + interval);
    return finalizeDate(formatOutput(nextDate));
  }

  if (rule.frequency === RecurrenceFrequency.WEEKLY) {
    const allowedDays =
      rule.daysOfWeek && rule.daysOfWeek.length > 0
        ? [...rule.daysOfWeek].sort((a, b) => a - b)
        : [baseDate.getDay()];

    // Scan forward from tomorrow (up to 14 days)
    const candidate = new Date(baseDate);
    for (let i = 1; i <= 14; i++) {
      candidate.setDate(candidate.getDate() + 1);
      if (allowedDays.includes(candidate.getDay())) {
        return finalizeDate(formatOutput(candidate));
      }
    }
    // Fallback +7 days
    const fallback = new Date(baseDate);
    fallback.setDate(fallback.getDate() + 7);
    return finalizeDate(formatOutput(fallback));
  }

  if (rule.frequency === RecurrenceFrequency.MONTHLY) {
    const allowedDays =
      rule.daysOfMonth && rule.daysOfMonth.length > 0
        ? [...rule.daysOfMonth].sort((a, b) => a - b)
        : [refDay];

    // Check if any allowed day remains in the current month
    const currentMaxDays = getDaysInMonth(refYear, refMonth);
    const laterDayInCurrentMonth = allowedDays.find((d) => d > refDay);

    if (laterDayInCurrentMonth) {
      const clampedDay = Math.min(laterDayInCurrentMonth, currentMaxDays);
      return finalizeDate(
        `${refYear}-${String(refMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`,
      );
    }

    // Move to next month(s)
    let nextYear = refYear;
    let nextMonth = refMonth + (rule.interval || 1);
    while (nextMonth > 12) {
      nextMonth -= 12;
      nextYear += 1;
    }

    const firstAllowedDay = allowedDays[0];
    const nextMaxDays = getDaysInMonth(nextYear, nextMonth);
    const clampedDay = Math.min(firstAllowedDay, nextMaxDays);

    return finalizeDate(
      `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`,
    );
  }

  if (rule.frequency === RecurrenceFrequency.YEARLY) {
    const targetMonth = rule.yearlyDate?.month ?? refMonth;
    const targetDay = rule.yearlyDate?.day ?? refDay;

    // Check if target date is in the current year and in the future
    let candidateYear = refYear;
    let maxDaysInCandidate = getDaysInMonth(candidateYear, targetMonth);
    let clampedCandidateDay = Math.min(targetDay, maxDaysInCandidate);
    const candidateStr = `${candidateYear}-${String(targetMonth).padStart(2, '0')}-${String(clampedCandidateDay).padStart(2, '0')}`;

    if (candidateStr > referenceDateStr) {
      return finalizeDate(candidateStr);
    }

    // Advance to next year
    candidateYear += Math.max(1, rule.interval || 1);
    maxDaysInCandidate = getDaysInMonth(candidateYear, targetMonth);
    clampedCandidateDay = Math.min(targetDay, maxDaysInCandidate);

    return finalizeDate(
      `${candidateYear}-${String(targetMonth).padStart(2, '0')}-${String(clampedCandidateDay).padStart(2, '0')}`,
    );
  }

  // Default fallback
  const fallbackDate = new Date(baseDate);
  fallbackDate.setDate(fallbackDate.getDate() + 1);
  return finalizeDate(formatOutput(fallbackDate));
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Returns a human-friendly signifier string describing the recurrence rule.
 */
export function formatRecurrenceLabel(rule: RecurrenceRule): string {
  let label = 'Recurring';

  if (rule.frequency === RecurrenceFrequency.DAILY) {
    label = rule.interval && rule.interval > 1 ? `Every ${rule.interval} days` : 'Daily';
  } else if (rule.frequency === RecurrenceFrequency.WEEKLY) {
    if (!rule.daysOfWeek || rule.daysOfWeek.length === 0) {
      label = 'Weekly';
    } else if (rule.daysOfWeek.length === 7) {
      label = 'Daily';
    } else if (
      rule.daysOfWeek.length === 5 &&
      !rule.daysOfWeek.includes(0) &&
      !rule.daysOfWeek.includes(6)
    ) {
      label = 'Weekdays (Mon-Fri)';
    } else {
      const days = rule.daysOfWeek.map((d) => WEEKDAY_NAMES[d]).join(', ');
      label = `Weekly: ${days}`;
    }
  } else if (rule.frequency === RecurrenceFrequency.MONTHLY) {
    if (!rule.daysOfMonth || rule.daysOfMonth.length === 0) {
      label = 'Monthly';
    } else {
      const days = rule.daysOfMonth.map((d) => `${d}`).join(', ');
      label = `Monthly: day ${days}`;
    }
  } else if (rule.frequency === RecurrenceFrequency.YEARLY) {
    if (rule.yearlyDate) {
      const monthStr = MONTH_NAMES[rule.yearlyDate.month - 1];
      label = `Yearly on ${monthStr} ${rule.yearlyDate.day}`;
    } else {
      label = 'Yearly';
    }
  }

  if (rule.endDate) {
    label += ` (until ${rule.endDate})`;
  }

  return label;
}
