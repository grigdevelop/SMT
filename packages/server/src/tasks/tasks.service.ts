import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CreateTaskDto, UpdateTaskDto, TaskDto } from '@self/contracts';
import { Selectable } from 'kysely';
import { TaskTable } from '../database/types';
import { TasksRepository } from './tasks.repository';

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
      due_date: dto.dueDate,
    });
    return this.toDto(row);
  }

  async update(id: string, userId: string, dto: UpdateTaskDto): Promise<TaskDto> {
    const row = await this.repository.update(id, userId, {
      title: dto.title,
      description: dto.description,
      is_completed: dto.isCompleted,
      due_date: dto.dueDate,
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
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      isCompleted: row.is_completed,
      dueDate: row.due_date ? new Date(row.due_date).toISOString() : null,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }
}
