import type { TaskDto, CreateTaskDto, UpdateTaskDto } from '@self/contracts';

const BASE_URL = '/api';

export const api = {
  tasks: {
    async list(): Promise<TaskDto[]> {
      const res = await fetch(`${BASE_URL}/tasks`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },

    async create(dto: CreateTaskDto): Promise<TaskDto> {
      const res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to create task');
      }
      return res.json();
    },

    async update(id: string, dto: UpdateTaskDto): Promise<TaskDto> {
      const res = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },

    async delete(id: string): Promise<void> {
      const res = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete task');
    },
  },
};
