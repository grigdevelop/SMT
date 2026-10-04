import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('tasks')
    .addColumn('recurrence_rule', 'jsonb')
    .addColumn('parent_task_id', 'uuid', (col) => col.references('tasks.id').onDelete('set null'))
    .execute();

  await db.schema
    .createIndex('idx_tasks_parent_task_id')
    .on('tasks')
    .column('parent_task_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('idx_tasks_parent_task_id').execute();
  await db.schema
    .alterTable('tasks')
    .dropColumn('parent_task_id')
    .dropColumn('recurrence_rule')
    .execute();
}
