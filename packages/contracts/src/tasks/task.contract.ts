import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or less'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
  dueDate: z.string().datetime().optional(),
});
export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  isCompleted: z.boolean().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});
export type UpdateTaskDto = z.infer<typeof UpdateTaskSchema>;

export interface TaskDto {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly isCompleted: boolean;
  readonly dueDate: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
