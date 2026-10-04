import { Injectable, Inject } from '@nestjs/common';
import { Selectable, sql } from 'kysely';
import { SkillSummaryDto } from '@self/contracts';
import { KyselyService } from '../database/kysely.service';
import { TaskTable } from '../database/types';

export type TaskRowWithSkills = Selectable<TaskTable> & {
  skills: SkillSummaryDto[];
};

@Injectable()
export class TasksRepository {
  constructor(@Inject(KyselyService) private readonly kysely: KyselyService) {}

  async findAll(userId: string): Promise<TaskRowWithSkills[]> {
    const rows = await this.kysely.db
      .selectFrom('tasks')
      .leftJoin('task_skills', 'task_skills.task_id', 'tasks.id')
      .leftJoin('skills', 'skills.id', 'task_skills.skill_id')
      .selectAll('tasks')
      .select(
        sql<SkillSummaryDto[]>`COALESCE(
          json_agg(
            json_build_object('id', skills.id, 'name', skills.name, 'color', skills.color)
            ORDER BY skills.name ASC
          ) FILTER (WHERE skills.id IS NOT NULL),
          '[]'::json
        )`.as('skills'),
      )
      .where('tasks.user_id', '=', userId)
      .groupBy('tasks.id')
      .orderBy('tasks.created_at', 'desc')
      .execute();

    return rows.map((r) => ({
      ...r,
      skills: (typeof r.skills === 'string' ? JSON.parse(r.skills) : r.skills) || [],
    }));
  }

  async findById(id: string, userId: string): Promise<TaskRowWithSkills | undefined> {
    const rows = await this.kysely.db
      .selectFrom('tasks')
      .leftJoin('task_skills', 'task_skills.task_id', 'tasks.id')
      .leftJoin('skills', 'skills.id', 'task_skills.skill_id')
      .selectAll('tasks')
      .select(
        sql<SkillSummaryDto[]>`COALESCE(
          json_agg(
            json_build_object('id', skills.id, 'name', skills.name, 'color', skills.color)
            ORDER BY skills.name ASC
          ) FILTER (WHERE skills.id IS NOT NULL),
          '[]'::json
        )`.as('skills'),
      )
      .where('tasks.id', '=', id)
      .where('tasks.user_id', '=', userId)
      .groupBy('tasks.id')
      .execute();

    const row = rows[0];
    if (!row) return undefined;
    return {
      ...row,
      skills: (typeof row.skills === 'string' ? JSON.parse(row.skills) : row.skills) || [],
    };
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
    skillIds?: string[],
  ): Promise<TaskRowWithSkills> {
    return this.kysely.db.transaction().execute(async (trx) => {
      const task = await trx
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

      const uniqueSkillIds = skillIds ? [...new Set(skillIds)] : [];
      if (uniqueSkillIds.length > 0) {
        await trx
          .insertInto('task_skills')
          .values(uniqueSkillIds.map((skillId) => ({ task_id: task.id, skill_id: skillId })))
          .execute();
      }

      const rows = await trx
        .selectFrom('tasks')
        .leftJoin('task_skills', 'task_skills.task_id', 'tasks.id')
        .leftJoin('skills', 'skills.id', 'task_skills.skill_id')
        .selectAll('tasks')
        .select(
          sql<SkillSummaryDto[]>`COALESCE(
            json_agg(
              json_build_object('id', skills.id, 'name', skills.name, 'color', skills.color)
              ORDER BY skills.name ASC
            ) FILTER (WHERE skills.id IS NOT NULL),
            '[]'::json
          )`.as('skills'),
        )
        .where('tasks.id', '=', task.id)
        .where('tasks.user_id', '=', userId)
        .groupBy('tasks.id')
        .execute();

      const created = rows[0];
      return {
        ...created,
        skills:
          (typeof created.skills === 'string' ? JSON.parse(created.skills) : created.skills) || [],
      };
    });
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
    skillIds?: string[],
  ): Promise<TaskRowWithSkills | undefined> {
    return this.kysely.db.transaction().execute(async (trx) => {
      const updateValues: Record<string, unknown> = {
        ...data,
        updated_at: new Date().toISOString(),
      };
      if (data.recurrence_rule !== undefined) {
        updateValues.recurrence_rule = data.recurrence_rule
          ? JSON.stringify(data.recurrence_rule)
          : null;
      }

      const task = await trx
        .updateTable('tasks')
        .set(updateValues)
        .where('id', '=', id)
        .where('user_id', '=', userId)
        .returningAll()
        .executeTakeFirst();

      if (!task) {
        return undefined;
      }

      if (skillIds !== undefined) {
        await trx.deleteFrom('task_skills').where('task_id', '=', id).execute();
        const uniqueSkillIds = [...new Set(skillIds)];
        if (uniqueSkillIds.length > 0) {
          await trx
            .insertInto('task_skills')
            .values(uniqueSkillIds.map((skillId) => ({ task_id: id, skill_id: skillId })))
            .execute();
        }
      }

      const rows = await trx
        .selectFrom('tasks')
        .leftJoin('task_skills', 'task_skills.task_id', 'tasks.id')
        .leftJoin('skills', 'skills.id', 'task_skills.skill_id')
        .selectAll('tasks')
        .select(
          sql<SkillSummaryDto[]>`COALESCE(
            json_agg(
              json_build_object('id', skills.id, 'name', skills.name, 'color', skills.color)
              ORDER BY skills.name ASC
            ) FILTER (WHERE skills.id IS NOT NULL),
            '[]'::json
          )`.as('skills'),
        )
        .where('tasks.id', '=', id)
        .where('tasks.user_id', '=', userId)
        .groupBy('tasks.id')
        .execute();

      const updated = rows[0];
      return {
        ...updated,
        skills:
          (typeof updated.skills === 'string' ? JSON.parse(updated.skills) : updated.skills) || [],
      };
    });
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
