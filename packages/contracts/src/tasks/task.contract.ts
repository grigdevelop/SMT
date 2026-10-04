import { z } from 'zod';

export const TaskStatus = {
  UPCOMING: 'UPCOMING',
  TODAY: 'TODAY',
  OVERDUE: 'OVERDUE',
  COMPLETED: 'COMPLETED',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

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
