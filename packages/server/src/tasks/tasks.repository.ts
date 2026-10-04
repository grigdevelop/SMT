import { Injectable, Inject } from '@nestjs/common';
import { Selectable } from 'kysely';
import { KyselyService } from '../database/kysely.service';
import { TaskTable } from '../database/types';

@Injectable()
export class TasksRepository {
  constructor(@Inject(KyselyService) private readonly kysely: KyselyService) {}

  async findAll(userId: string): Promise<Selectable<TaskTable>[]> {
    return this.kysely.db
      .selectFrom('tasks')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  async findById(id: string, userId: string): Promise<Selectable<TaskTable> | undefined> {
    return this.kysely.db
      .selectFrom('tasks')
      .selectAll()
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .executeTakeFirst();
  }

  async create(
    userId: string,
    data: {
      title: string;
      description?: string | null;
      todo_date?: string | null;
      deadline?: string | null;
      due_date?: string | null;
      recurrence_rule?: unknown | null;
      parent_task_id?: string | null;
    },
  ): Promise<Selectable<TaskTable>> {
    return this.kysely.db
      .insertInto('tasks')
      .values({
        user_id: userId,
        title: data.title,
        description: data.description ?? null,
        todo_date: data.todo_date ?? null,
        deadline: data.deadline ?? null,
        due_date: data.due_date ?? null,
        recurrence_rule:
          data.recurrence_rule !== undefined
            ? data.recurrence_rule
              ? JSON.stringify(data.recurrence_rule)
              : null
            : null,
        parent_task_id: data.parent_task_id ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(
    id: string,
    userId: string,
    data: {
      title?: string;
      description?: string | null;
      is_completed?: boolean;
      todo_date?: string | null;
      deadline?: string | null;
      due_date?: string | null;
      recurrence_rule?: unknown | null;
    },
  ): Promise<Selectable<TaskTable> | undefined> {
    const updateValues: Record<string, unknown> = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    if (data.recurrence_rule !== undefined) {
      updateValues.recurrence_rule = data.recurrence_rule
        ? JSON.stringify(data.recurrence_rule)
        : null;
    }

    return this.kysely.db
      .updateTable('tasks')
      .set(updateValues)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.kysely.db
      .deleteFrom('tasks')
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }
}
