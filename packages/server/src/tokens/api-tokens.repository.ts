import { Injectable, Inject } from '@nestjs/common';
import { Selectable } from 'kysely';
import { KyselyService } from '../database/kysely.service';
import { ApiTokenTable } from '../database/types';

@Injectable()
export class ApiTokensRepository {
  constructor(@Inject(KyselyService) private readonly kysely: KyselyService) {}

  async findByUserId(userId: string): Promise<Selectable<ApiTokenTable>[]> {
    return this.kysely.db
      .selectFrom('api_tokens')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  async findById(id: string, userId: string): Promise<Selectable<ApiTokenTable> | undefined> {
    return this.kysely.db
      .selectFrom('api_tokens')
      .selectAll()
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .executeTakeFirst();
  }

  async create(data: {
    user_id: string;
    name: string;
    token_hash: string;
    token_preview: string;
  }): Promise<Selectable<ApiTokenTable>> {
    return this.kysely.db
      .insertInto('api_tokens')
      .values({
        user_id: data.user_id,
        name: data.name,
        token_hash: data.token_hash,
        token_preview: data.token_preview,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.kysely.db
      .deleteFrom('api_tokens')
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }
}
