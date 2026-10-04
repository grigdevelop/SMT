import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('tasks')
    .addColumn('todo_date', 'date')
    .addColumn('deadline', 'timestamptz')
    .execute();

  // Backfill deadline from existing due_date if any
  await sql`UPDATE tasks SET deadline = due_date WHERE deadline IS NULL AND due_date IS NOT NULL`.execute(
    db,
  );

  await db.schema
    .createIndex('idx_tasks_user_todo_date')
    .on('tasks')
    .columns(['user_id', 'todo_date'])
    .execute();

  await db.schema
    .createIndex('idx_tasks_user_deadline')
    .on('tasks')
    .columns(['user_id', 'deadline'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('idx_tasks_user_deadline').execute();
  await db.schema.dropIndex('idx_tasks_user_todo_date').execute();

  await db.schema.alterTable('tasks').dropColumn('deadline').dropColumn('todo_date').execute();
}
