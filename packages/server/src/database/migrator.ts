import { Kysely, PostgresDialect, Migrator, MigrationProvider, Migration } from 'kysely';
import pg from 'pg';
import * as dotenv from 'dotenv';
import * as migration001 from './migrations/001_create_tasks';
import * as migration002 from './migrations/002_create_users_and_api_tokens';

dotenv.config();

const { Pool } = pg;

export const migrations: Record<string, Migration> = {
  '001_create_tasks': migration001,
  '002_create_users_and_api_tokens': migration002,
};

export class MemoryMigrationProvider implements MigrationProvider {
  async getMigrations(): Promise<Record<string, Migration>> {
    return migrations;
  }
}

export function createMigrator(db: Kysely<unknown>): Migrator {
  return new Migrator({
    db,
    provider: new MemoryMigrationProvider(),
  });
}

export async function runMigrations(connectionString?: string): Promise<void> {
  const dbUrl =
    connectionString ||
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/self_mgmt_dev';

  const pool = new Pool({ connectionString: dbUrl });
  const db = new Kysely<unknown>({
    dialect: new PostgresDialect({ pool }),
  });

  const migrator = createMigrator(db);
  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`[Migration] "${it.migrationName}" executed successfully.`);
    } else if (it.status === 'Error') {
      console.error(`[Migration] failed to execute "${it.migrationName}".`);
    }
  });

  if (error) {
    console.error('[Migration] Failed to migrate to latest', error);
    await pool.end();
    process.exit(1);
  }

  await pool.end();
}

// Auto-run when executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('migrator.ts')) {
  runMigrations();
}
