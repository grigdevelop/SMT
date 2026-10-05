import { Injectable, Inject } from '@nestjs/common';
import { Selectable } from 'kysely';
import { KyselyService } from '../database/kysely.service';
import { UserTable } from '../database/types';

export type AdminUserRowWithCounts = Selectable<UserTable> & {
  task_count: number;
  skill_count: number;
};

@Injectable()
export class UsersRepository {
  constructor(@Inject(KyselyService) private readonly kysely: KyselyService) {}

  async findByEmail(email: string): Promise<Selectable<UserTable> | undefined> {
    return this.kysely.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email.toLowerCase().trim())
      .executeTakeFirst();
  }

  async findById(id: string): Promise<Selectable<UserTable> | undefined> {
    return this.kysely.db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async create(data: {
    email: string;
    password_hash: string;
    role?: string;
  }): Promise<Selectable<UserTable>> {
    return this.kysely.db
      .insertInto('users')
      .values({
        email: data.email.toLowerCase().trim(),
        password_hash: data.password_hash,
        role: data.role || 'USER',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async hasAdmin(): Promise<boolean> {
    const admin = await this.kysely.db
      .selectFrom('users')
      .select('id')
      .where('role', '=', 'ADMIN')
      .limit(1)
      .executeTakeFirst();
    return !!admin;
  }

  async findAllWithStats(): Promise<AdminUserRowWithCounts[]> {
    const rows = await this.kysely.db
      .selectFrom('users')
      .selectAll('users')
      .select((eb) => [
        eb
          .selectFrom('tasks')
          .select(eb.fn.countAll<string>().as('count'))
          .whereRef('tasks.user_id', '=', 'users.id')
          .as('task_count'),
        eb
          .selectFrom('skills')
          .select(eb.fn.countAll<string>().as('count'))
          .whereRef('skills.user_id', '=', 'users.id')
          .as('skill_count'),
      ])
      .orderBy('users.created_at', 'asc')
      .execute();

    return rows.map((r) => ({
      ...r,
      task_count: Number(r.task_count || 0),
      skill_count: Number(r.skill_count || 0),
    }));
  }

  async updateRole(id: string, role: string): Promise<Selectable<UserTable> | undefined> {
    return this.kysely.db
      .updateTable('users')
      .set({
        role,
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.kysely.db.deleteFrom('users').where('id', '=', id).executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }
}
