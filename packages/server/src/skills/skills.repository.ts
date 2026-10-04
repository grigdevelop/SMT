import { Injectable, Inject } from '@nestjs/common';
import { Selectable } from 'kysely';
import { KyselyService } from '../database/kysely.service';
import { SkillTable } from '../database/types';

export type SkillRowWithCount = Selectable<SkillTable> & { completed_task_count: number };

@Injectable()
export class SkillsRepository {
  constructor(@Inject(KyselyService) private readonly kysely: KyselyService) {}

  /**
   * Lists the user's skills with the mastery count derived on the fly:
   * COUNT of completed tasks linked through task_skills. Single query, no stored counter.
   */
  async findAllWithCounts(userId: string): Promise<SkillRowWithCount[]> {
    const rows = await this.kysely.db
      .selectFrom('skills')
      .leftJoin('task_skills', 'task_skills.skill_id', 'skills.id')
      .leftJoin('tasks', (join) =>
        join.onRef('tasks.id', '=', 'task_skills.task_id').on('tasks.is_completed', '=', true),
      )
      .selectAll('skills')
      .select((eb) => eb.fn.count<string>('tasks.id').as('completed_task_count'))
      .where('skills.user_id', '=', userId)
      .groupBy('skills.id')
      .orderBy('skills.name')
      .execute();

    return rows.map((r) => ({ ...r, completed_task_count: Number(r.completed_task_count) }));
  }

  async findByIdWithCount(id: string, userId: string): Promise<SkillRowWithCount | undefined> {
    const rows = await this.kysely.db
      .selectFrom('skills')
      .leftJoin('task_skills', 'task_skills.skill_id', 'skills.id')
      .leftJoin('tasks', (join) =>
        join.onRef('tasks.id', '=', 'task_skills.task_id').on('tasks.is_completed', '=', true),
      )
      .selectAll('skills')
      .select((eb) => eb.fn.count<string>('tasks.id').as('completed_task_count'))
      .where('skills.id', '=', id)
      .where('skills.user_id', '=', userId)
      .groupBy('skills.id')
      .execute();

    const row = rows[0];
    return row ? { ...row, completed_task_count: Number(row.completed_task_count) } : undefined;
  }

  async create(
    userId: string,
    data: { name: string; color?: string },
  ): Promise<Selectable<SkillTable>> {
    return this.kysely.db
      .insertInto('skills')
      .values({
        user_id: userId,
        name: data.name,
        ...(data.color ? { color: data.color } : {}),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(
    id: string,
    userId: string,
    data: { name?: string; color?: string },
  ): Promise<Selectable<SkillTable> | undefined> {
    return this.kysely.db
      .updateTable('skills')
      .set({ ...data, updated_at: new Date().toISOString() })
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.kysely.db
      .deleteFrom('skills')
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }

  async findExistingUserSkillIds(userId: string, skillIds: string[]): Promise<string[]> {
    if (skillIds.length === 0) return [];
    const rows = await this.kysely.db
      .selectFrom('skills')
      .select('id')
      .where('user_id', '=', userId)
      .where('id', 'in', skillIds)
      .execute();
    return rows.map((r) => r.id);
  }
}
