import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskList } from './TaskList';
import { api } from '../../lib/api';

vi.spyOn(api.tasks, 'list').mockResolvedValue([]);

describe('TaskList Component', () => {
  it('renders input field with placeholder after query loads', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TaskList />
      </QueryClientProvider>,
    );

    const input = await screen.findByPlaceholderText('What do you need to do today?');
    expect(input).toBeDefined();
  });
});
