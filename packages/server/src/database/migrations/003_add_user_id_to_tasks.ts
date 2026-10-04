import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Purge any pre-auth test tasks before enforcing non-null foreign key
  await sql`DELETE FROM tasks`.execute(db);

  await db.schema
    .alterTable('tasks')
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .execute();

  await db.schema.createIndex('idx_tasks_user_id').on('tasks').column('user_id').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('idx_tasks_user_id').execute();
  await db.schema.alterTable('tasks').dropColumn('user_id').execute();
}
