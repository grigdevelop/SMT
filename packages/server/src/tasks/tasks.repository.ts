import { Injectable } from '@nestjs/common';
import { Selectable } from 'kysely';
import { KyselyService } from '../database/kysely.service';
import { TaskTable } from '../database/types';

@Injectable()
export class TasksRepository {
  constructor(private readonly kysely: KyselyService) {}

  async findAll(): Promise<Selectable<TaskTable>[]> {
    return this.kysely.db.selectFrom('tasks').selectAll().orderBy('created_at', 'desc').execute();
  }

  async findById(id: string): Promise<Selectable<TaskTable> | undefined> {
    return this.kysely.db.selectFrom('tasks').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async create(data: {
    title: string;
    description?: string | null;
    due_date?: string | null;
  }): Promise<Selectable<TaskTable>> {
    return this.kysely.db
      .insertInto('tasks')
      .values({
        title: data.title,
        description: data.description ?? null,
        due_date: data.due_date ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string | null;
      is_completed?: boolean;
      due_date?: string | null;
    },
  ): Promise<Selectable<TaskTable> | undefined> {
    return this.kysely.db
      .updateTable('tasks')
      .set({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.kysely.db.deleteFrom('tasks').where('id', '=', id).executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }
}
