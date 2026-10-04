import { Generated } from 'kysely';

export interface TaskTable {
  id: Generated<string>;
  title: string;
  description: string | null;
  is_completed: Generated<boolean>;
  due_date: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface Database {
  tasks: TaskTable;
}
