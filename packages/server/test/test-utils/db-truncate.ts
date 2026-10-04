import { Kysely, sql } from 'kysely';
import { Database } from '../../src/database/types';

export async function truncateTestDatabase(db: Kysely<Database>): Promise<void> {
  await sql`TRUNCATE TABLE task_skills, skills, tasks, api_tokens, users RESTART IDENTITY CASCADE`.execute(
    db,
  );
}
