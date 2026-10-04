import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('skills')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('name', 'varchar(100)', (col) => col.notNull())
    .addColumn('color', 'varchar(20)', (col) => col.notNull().defaultTo('#6366f1'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  // Case-insensitive uniqueness per user ("Math" and "math" are the same skill).
  await sql`CREATE UNIQUE INDEX uq_skills_user_lower_name ON skills (user_id, lower(name))`.execute(
    db,
  );

  await db.schema
    .createTable('task_skills')
    .addColumn('task_id', 'uuid', (col) => col.notNull().references('tasks.id').onDelete('cascade'))
    .addColumn('skill_id', 'uuid', (col) =>
      col.notNull().references('skills.id').onDelete('cascade'),
    )
    .addPrimaryKeyConstraint('pk_task_skills', ['task_id', 'skill_id'])
    .execute();

  // PK (task_id, skill_id) already serves task_id lookups; skill_id needs its own index
  // for the mastery-count aggregation.
  await db.schema
    .createIndex('idx_task_skills_skill_id')
    .on('task_skills')
    .column('skill_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('task_skills').execute();
  await db.schema.dropTable('skills').execute();
}
