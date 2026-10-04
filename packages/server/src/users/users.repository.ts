import { Injectable } from '@nestjs/common';
import { Selectable } from 'kysely';
import { KyselyService } from '../database/kysely.service';
import { UserTable } from '../database/types';

@Injectable()
export class UsersRepository {
  constructor(private readonly kysely: KyselyService) {}

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
}
