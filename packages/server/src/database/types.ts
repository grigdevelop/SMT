import { Generated } from 'kysely';

export interface TaskTable {
  id: Generated<string>;
  user_id: string;
  title: string;
  description: string | null;
  is_completed: Generated<boolean>;
  todo_date: string | null;
  deadline: string | null;
  due_date: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface UserTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  role: Generated<string>;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface ApiTokenTable {
  id: Generated<string>;
  user_id: string;
  name: string;
  token_hash: string;
  token_preview: string;
  last_used_at: string | null;
  created_at: Generated<string>;
}

export interface Database {
  tasks: TaskTable;
  users: UserTable;
  api_tokens: ApiTokenTable;
}
