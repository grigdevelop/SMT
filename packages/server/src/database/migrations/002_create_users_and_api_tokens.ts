import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // 1. Create users table
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('password_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('role', 'varchar(50)', (col) => col.notNull().defaultTo('USER'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema.createIndex('idx_users_email').on('users').column('email').execute();

  // 2. Create api_tokens table
  await db.schema
    .createTable('api_tokens')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('name', 'varchar(100)', (col) => col.notNull())
    .addColumn('token_hash', 'varchar(64)', (col) => col.notNull().unique())
    .addColumn('token_preview', 'varchar(20)', (col) => col.notNull())
    .addColumn('last_used_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_api_tokens_token_hash')
    .on('api_tokens')
    .column('token_hash')
    .execute();

  await db.schema
    .createIndex('idx_api_tokens_user_id')
    .on('api_tokens')
    .column('user_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('api_tokens').execute();
  await db.schema.dropTable('users').execute();
}
