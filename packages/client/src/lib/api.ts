import type {
  TaskDto,
  CreateTaskDto,
  UpdateTaskDto,
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  UserDto,
} from '@self/contracts';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'smt_access_token';

export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // LocalStorage might be disabled or full
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // LocalStorage might be disabled
    }
  },
};

function getHeaders(customHeaders: Record<string, string> = {}): HeadersInit {
  const headers: Record<string, string> = { ...customHeaders };
  const token = tokenStorage.get();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  try {
    const simulatedDate = sessionStorage.getItem('smt_simulated_date');
    if (simulatedDate) {
      headers['x-simulated-date'] = simulatedDate;
    }
  } catch {
    // SessionStorage might be unavailable
  }
  return headers;
}

export const api = {
  auth: {
    async register(dto: RegisterDto): Promise<AuthResponseDto> {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Registration failed');
      }
      return res.json();
    },

    async login(dto: LoginDto): Promise<AuthResponseDto> {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Invalid email or password');
      }
      return res.json();
    },

    async me(): Promise<UserDto> {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: getHeaders(),
      });
      if (!res.ok) {
        throw new Error('Unauthorized');
      }
      return res.json();
    },
  },

  tasks: {
    async list(): Promise<TaskDto[]> {
      const res = await fetch(`${BASE_URL}/tasks`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },

    async create(dto: CreateTaskDto): Promise<TaskDto> {
      const res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
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
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(dto),
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },

    async delete(id: string): Promise<void> {
      const res = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete task');
    },
  },
};
