import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CreateTaskDto, UpdateTaskDto, TaskDto } from '@self/contracts';
import { Selectable } from 'kysely';
import { TaskTable } from '../database/types';
import { TasksRepository } from './tasks.repository';

function formatTodoDate(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(val).slice(0, 10);
}

@Injectable()
export class TasksService {
  constructor(@Inject(TasksRepository) private readonly repository: TasksRepository) {}

  async findAll(userId: string): Promise<TaskDto[]> {
    const rows = await this.repository.findAll(userId);
    return rows.map((row) => this.toDto(row));
  }

  async findById(id: string, userId: string): Promise<TaskDto> {
    const row = await this.repository.findById(id, userId);
    if (!row) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    return this.toDto(row);
  }

  async create(userId: string, dto: CreateTaskDto): Promise<TaskDto> {
    const row = await this.repository.create(userId, {
      title: dto.title,
      description: dto.description,
      todo_date: dto.todoDate ?? null,
      deadline: dto.deadline ?? dto.dueDate ?? null,
      due_date: dto.dueDate ?? dto.deadline ?? null,
    });
    return this.toDto(row);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateTaskDto,
    simulatedDate?: string,
  ): Promise<TaskDto> {
    // If completing the task, enforce the "only-when" execution day guard
    if (dto.isCompleted === true) {
      const existing = await this.repository.findById(id, userId);
      if (!existing) {
        throw new NotFoundException(`Task with ID "${id}" not found`);
      }

      const scheduledDate =
        dto.todoDate !== undefined ? dto.todoDate : formatTodoDate(existing.todo_date);

      if (scheduledDate) {
        const today =
          simulatedDate && /^\d{4}-\d{2}-\d{2}$/.test(simulatedDate)
            ? simulatedDate
            : new Date().toISOString().slice(0, 10);

        if (scheduledDate > today) {
          throw new BadRequestException(
            `Cannot complete task before its scheduled date (${scheduledDate}).`,
          );
        }
      }
    }

    const row = await this.repository.update(id, userId, {
      title: dto.title,
      description: dto.description,
      is_completed: dto.isCompleted,
      todo_date: dto.todoDate,
      deadline: dto.deadline !== undefined ? dto.deadline : dto.dueDate,
      due_date: dto.dueDate !== undefined ? dto.dueDate : dto.deadline,
    });

    if (!row) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    return this.toDto(row);
  }

  async delete(id: string, userId: string): Promise<void> {
    const deleted = await this.repository.delete(id, userId);
    if (!deleted) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
  }

  private toDto(row: Selectable<TaskTable>): TaskDto {
    const deadlineVal = row.deadline || row.due_date;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      isCompleted: row.is_completed,
      todoDate: formatTodoDate(row.todo_date),
      deadline: deadlineVal ? new Date(deadlineVal).toISOString() : null,
      dueDate: row.due_date ? new Date(row.due_date).toISOString() : null,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }
}
