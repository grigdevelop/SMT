import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { Database } from './types';

const { Pool } = pg;

@Injectable()
export class KyselyService implements OnModuleDestroy {
  public readonly db: Kysely<Database>;
  private readonly pool: pg.Pool;

  constructor() {
    const connectionString =
      process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/self_mgmt_dev';

    this.pool = new Pool({ connectionString });
    this.db = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: this.pool,
      }),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
