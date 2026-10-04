import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskList } from './TaskList';
import { DateProvider } from '../../lib/date-context';
import { api } from '../../lib/api';
import { RecurrenceFrequency } from '@self/contracts';

describe('TaskList Component', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  function renderTaskList() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <DateProvider>
          <TaskList />
        </DateProvider>
      </QueryClientProvider>,
    );
  }

  it('renders input field with placeholder after query loads', async () => {
    vi.spyOn(api.tasks, 'list').mockResolvedValue([]);
    renderTaskList();

    const input = await screen.findByPlaceholderText('What do you need to do today?');
    expect(input).toBeDefined();
  });

  it('displays lock signifier and Upcoming badge for tasks scheduled in the future', async () => {
    vi.spyOn(api.tasks, 'list').mockResolvedValue([
      {
        id: 'task-1',
        title: 'Future Feature Launch',
        description: null,
        isCompleted: false,
        todoDate: '2099-01-01',
        deadline: null,
        recurrenceRule: null,
        dueDate: null,
        createdAt: '2026-10-04T00:00:00Z',
        updatedAt: '2026-10-04T00:00:00Z',
      },
    ]);

    renderTaskList();

    expect(await screen.findByText('Future Feature Launch')).toBeDefined();
    expect(screen.getByText(/Upcoming \(2099-01-01\)/i)).toBeDefined();
    expect(
      screen.getByTitle(
        /Scheduled for 2099-01-01\. Cannot be completed before its scheduled date\./i,
      ),
    ).toBeDefined();
  });

  it('displays Out of Date / Overdue badge when task deadline is in the past', async () => {
    vi.spyOn(api.tasks, 'list').mockResolvedValue([
      {
        id: 'task-2',
        title: 'Overdue Tax Report',
        description: null,
        isCompleted: false,
        todoDate: null,
        deadline: '2020-01-01T00:00:00Z',
        recurrenceRule: null,
        dueDate: null,
        createdAt: '2020-01-01T00:00:00Z',
        updatedAt: '2020-01-01T00:00:00Z',
      },
    ]);

    renderTaskList();

    expect(await screen.findByText('Overdue Tax Report')).toBeDefined();
    expect(screen.getByText(/Out of Date \/ Overdue/i)).toBeDefined();
  });

  it('displays recurrence badge for recurring tasks', async () => {
    vi.spyOn(api.tasks, 'list').mockResolvedValue([
      {
        id: 'task-3',
        title: 'Sprint Retrospective',
        description: null,
        isCompleted: false,
        todoDate: '2026-10-04',
        deadline: null,
        recurrenceRule: {
          frequency: RecurrenceFrequency.WEEKLY,
          interval: 1,
          daysOfWeek: [5], // Friday
        },
        dueDate: null,
        createdAt: '2026-10-04T00:00:00Z',
        updatedAt: '2026-10-04T00:00:00Z',
      },
    ]);

    renderTaskList();

    expect(await screen.findByText('Sprint Retrospective')).toBeDefined();
    expect(screen.getByText('Weekly: Fri')).toBeDefined();
  });

  it('allows setting recurrence in Details drawer when creating a task', async () => {
    vi.spyOn(api.tasks, 'list').mockResolvedValue([]);
    const createSpy = vi.spyOn(api.tasks, 'create').mockResolvedValue({
      id: 'task-new',
      title: 'Water the plants',
      description: null,
      isCompleted: false,
      todoDate: null,
      deadline: null,
      recurrenceRule: {
        frequency: RecurrenceFrequency.DAILY,
        interval: 2,
      },
      createdAt: '2026-10-04T00:00:00Z',
      updatedAt: '2026-10-04T00:00:00Z',
    });

    renderTaskList();

    const titleInput = await screen.findByPlaceholderText('What do you need to do today?');
    fireEvent.change(titleInput, { target: { value: 'Water the plants' } });

    // Open Details drawer
    const detailsBtn = screen.getByRole('button', { name: /details/i });
    fireEvent.click(detailsBtn);

    // Change recurrence frequency to Daily
    const freqSelect = screen.getByLabelText(/repeat frequency/i);
    fireEvent.change(freqSelect, { target: { value: RecurrenceFrequency.DAILY } });

    // Set interval to 2
    const intervalInput = screen.getByRole('spinbutton');
    fireEvent.change(intervalInput, { target: { value: '2' } });

    // Submit form
    const form = titleInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Water the plants',
          recurrenceRule: {
            frequency: RecurrenceFrequency.DAILY,
            interval: 2,
          },
        }),
      );
    });
  });
});
