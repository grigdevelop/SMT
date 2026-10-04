import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskDto,
  calculateNextTodoDate,
  calculateInitialTodoDate,
  RecurrenceRule,
} from '@self/contracts';
import { TaskRowWithSkills, TasksRepository } from './tasks.repository';
import { SkillsRepository } from '../skills/skills.repository';

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

function parseRecurrenceRule(val: unknown): RecurrenceRule | null {
  if (!val) return null;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val) as RecurrenceRule;
    } catch {
      return null;
    }
  }
  return val as RecurrenceRule;
}

@Injectable()
export class TasksService {
  constructor(
    @Inject(TasksRepository) private readonly repository: TasksRepository,
    @Inject(SkillsRepository) private readonly skillsRepository: SkillsRepository,
  ) {}

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

  async create(userId: string, dto: CreateTaskDto, simulatedDate?: string): Promise<TaskDto> {
    const today =
      simulatedDate && /^\d{4}-\d{2}-\d{2}$/.test(simulatedDate)
        ? simulatedDate
        : new Date().toISOString().slice(0, 10);

    let todoDate = dto.todoDate ?? null;
    if (dto.recurrenceRule && !todoDate) {
      todoDate = calculateInitialTodoDate(dto.recurrenceRule, today);
    }

    if (dto.skillIds && dto.skillIds.length > 0) {
      await this.validateSkillOwnership(userId, dto.skillIds);
    }

    const row = await this.repository.create(
      userId,
      {
        title: dto.title,
        description: dto.description,
        todo_date: todoDate,
        // Recurring tasks use horizon start/end dates instead of static deadlines
        deadline: dto.recurrenceRule ? null : (dto.deadline ?? dto.dueDate ?? null),
        due_date: dto.recurrenceRule ? null : (dto.dueDate ?? dto.deadline ?? null),
        recurrence_rule: dto.recurrenceRule ?? null,
      },
      dto.skillIds,
    );
    return this.toDto(row);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateTaskDto,
    simulatedDate?: string,
  ): Promise<TaskDto> {
    if (dto.skillIds && dto.skillIds.length > 0) {
      await this.validateSkillOwnership(userId, dto.skillIds);
    }

    // If completing the task, enforce the "only-when" guard and spawn recurring next occurrence
    if (dto.isCompleted === true) {
      const existing = await this.repository.findById(id, userId);
      if (!existing) {
        throw new NotFoundException(`Task with ID "${id}" not found`);
      }

      const scheduledDate =
        dto.todoDate !== undefined ? dto.todoDate : formatTodoDate(existing.todo_date);

      const today =
        simulatedDate && /^\d{4}-\d{2}-\d{2}$/.test(simulatedDate)
          ? simulatedDate
          : new Date().toISOString().slice(0, 10);

      if (scheduledDate && scheduledDate > today) {
        throw new BadRequestException(
          `Cannot complete task before its scheduled date (${scheduledDate}).`,
        );
      }

      // Check if task is recurring and spawn the next occurrence
      const rule =
        dto.recurrenceRule !== undefined
          ? dto.recurrenceRule
          : parseRecurrenceRule(existing.recurrence_rule);

      if (rule) {
        const nextTodoDate = calculateNextTodoDate(rule, today);

        // Only materialize if within boundary (not past endDate)
        if (nextTodoDate) {
          const inheritedSkillIds = existing.skills?.map((s) => s.id) || [];
          await this.repository.create(
            userId,
            {
              title: existing.title,
              description: existing.description,
              todo_date: nextTodoDate,
              recurrence_rule: rule,
              parent_task_id: existing.parent_task_id || existing.id,
            },
            inheritedSkillIds,
          );
        }
      }
    }

    const row = await this.repository.update(
      id,
      userId,
      {
        title: dto.title,
        description: dto.description,
        is_completed: dto.isCompleted,
        todo_date: dto.todoDate,
        deadline: dto.deadline !== undefined ? dto.deadline : dto.dueDate,
        due_date: dto.dueDate !== undefined ? dto.dueDate : dto.deadline,
        recurrence_rule: dto.recurrenceRule,
      },
      dto.skillIds,
    );

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

  private async validateSkillOwnership(userId: string, skillIds: string[]): Promise<void> {
    const validIds = await this.skillsRepository.findExistingUserSkillIds(userId, skillIds);
    const validSet = new Set(validIds);
    const invalidIds = skillIds.filter((id) => !validSet.has(id));
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Skill(s) not found or do not belong to you: ${invalidIds.join(', ')}`,
      );
    }
  }

  private toDto(row: TaskRowWithSkills): TaskDto {
    const deadlineVal = row.deadline || row.due_date;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      isCompleted: row.is_completed,
      todoDate: formatTodoDate(row.todo_date),
      deadline: deadlineVal ? new Date(deadlineVal).toISOString() : null,
      dueDate: row.due_date ? new Date(row.due_date).toISOString() : null,
      recurrenceRule: parseRecurrenceRule(row.recurrence_rule),
      parentTaskId: row.parent_task_id,
      skills: row.skills ?? [],
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }
}
