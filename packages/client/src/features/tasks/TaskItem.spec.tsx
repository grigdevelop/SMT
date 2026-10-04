import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskItem } from './TaskItem';
import type { TaskDto } from '@self/contracts';
import { RecurrenceFrequency } from '@self/contracts';

const mockTask: TaskDto = {
  id: 'task-123',
  title: 'Refactor Query Cache',
  description: null,
  isCompleted: false,
  todoDate: '2026-10-04',
  deadline: '2026-10-10T23:59:59.000Z',
  recurrenceRule: null,
  dueDate: null,
  createdAt: '2026-10-04T00:00:00.000Z',
  updatedAt: '2026-10-04T00:00:00.000Z',
};

const mockTaskWithDescription: TaskDto = {
  id: 'task-456',
  title: 'Build Deployment Pipeline',
  description: '### Key Requirements\n- Setup **Docker** compose\n- Add `HEALTHCHECK`',
  isCompleted: false,
  todoDate: '2026-10-04',
  deadline: null,
  recurrenceRule: null,
  dueDate: null,
  createdAt: '2026-10-04T00:00:00.000Z',
  updatedAt: '2026-10-04T00:00:00.000Z',
};

const mockRecurringTask: TaskDto = {
  id: 'task-789',
  title: 'Daily Standup Meeting',
  description: null,
  isCompleted: false,
  todoDate: '2026-10-04',
  deadline: null,
  recurrenceRule: {
    frequency: RecurrenceFrequency.DAILY,
    interval: 1,
  },
  dueDate: null,
  createdAt: '2026-10-04T00:00:00.000Z',
  updatedAt: '2026-10-04T00:00:00.000Z',
};

describe('TaskItem & Inline Editing', () => {
  it('renders task normally with edit affordance', () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    const onUpdate = vi.fn();

    render(
      <TaskItem
        task={mockTask}
        currentDate="2026-10-04"
        onToggle={onToggle}
        onDelete={onDelete}
        onUpdate={onUpdate}
      />,
    );

    expect(screen.getByText('Refactor Query Cache')).toBeDefined();
    expect(screen.getByRole('button', { name: /edit task/i })).toBeDefined();
  });

  it('renders recurrence badge when task has recurrenceRule', () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    const onUpdate = vi.fn();

    render(
      <TaskItem
        task={mockRecurringTask}
        currentDate="2026-10-04"
        onToggle={onToggle}
        onDelete={onDelete}
        onUpdate={onUpdate}
      />,
    );

    const badge = screen.getByTestId('recurrence-badge');
    expect(badge).toBeDefined();
    expect(badge.textContent).toContain('Daily');
  });

  it('renders Notes button and toggles formatted Markdown viewer', () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    const onUpdate = vi.fn();

    render(
      <TaskItem
        task={mockTaskWithDescription}
        currentDate="2026-10-04"
        onToggle={onToggle}
        onDelete={onDelete}
        onUpdate={onUpdate}
      />,
    );

    const notesBtn = screen.getByTitle(/view formatted notes/i);
    expect(notesBtn).toBeDefined();

    // Notes container is not yet mounted (Carmack optimization)
    expect(screen.queryByText(/Key Requirements/i)).toBeNull();

    // Click to expand
    fireEvent.click(notesBtn);
    expect(screen.getByText(/Key Requirements/i)).toBeDefined();
    expect(screen.getByText(/Docker/i)).toBeDefined();

    // Click to collapse
    fireEvent.click(notesBtn);
    expect(screen.queryByText(/Key Requirements/i)).toBeNull();
  });

  it('switches to inline edit mode when Edit button is clicked', () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    const onUpdate = vi.fn();

    render(
      <TaskItem
        task={mockTask}
        currentDate="2026-10-04"
        onToggle={onToggle}
        onDelete={onDelete}
        onUpdate={onUpdate}
      />,
    );

    const editBtn = screen.getByRole('button', { name: /edit task/i });
    fireEvent.click(editBtn);

    // Form inputs should now be visible
    const titleInput = screen.getByPlaceholderText('Task title...') as HTMLInputElement;
    expect(titleInput).toBeDefined();
    expect(titleInput.value).toBe('Refactor Query Cache');
    expect(screen.getByRole('button', { name: /save changes/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDefined();
  });

  it('submits updated title, dates, and description when Save Changes is clicked', () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    const onUpdate = vi.fn();

    render(
      <TaskItem
        task={mockTask}
        currentDate="2026-10-04"
        onToggle={onToggle}
        onDelete={onDelete}
        onUpdate={onUpdate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /edit task/i }));

    const titleInput = screen.getByPlaceholderText('Task title...');
    fireEvent.change(titleInput, { target: { value: 'Refactor Query Cache Cleanly' } });

    const descInput = screen.getByPlaceholderText(/add detailed notes/i);
    fireEvent.change(descInput, { target: { value: 'Notes with **bold**' } });

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    expect(onUpdate).toHaveBeenCalledWith('task-123', {
      title: 'Refactor Query Cache Cleanly',
      description: 'Notes with **bold**',
      todoDate: '2026-10-04',
      deadline: '2026-10-10T23:59:59.000Z',
      recurrenceRule: null,
    });
  });

  it('allows configuring recurrence rule in edit mode and saving', () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    const onUpdate = vi.fn();

    render(
      <TaskItem
        task={mockTask}
        currentDate="2026-10-04"
        onToggle={onToggle}
        onDelete={onDelete}
        onUpdate={onUpdate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /edit task/i }));

    // Change recurrence frequency to WEEKLY
    const freqSelect = screen.getByLabelText(/repeat frequency/i);
    fireEvent.change(freqSelect, { target: { value: RecurrenceFrequency.WEEKLY } });

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    expect(onUpdate).toHaveBeenCalledWith(
      'task-123',
      expect.objectContaining({
        recurrenceRule: expect.objectContaining({
          frequency: RecurrenceFrequency.WEEKLY,
        }),
      }),
    );
  });

  it('cancels edit mode on Escape key without invoking onUpdate', () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    const onUpdate = vi.fn();

    render(
      <TaskItem
        task={mockTask}
        currentDate="2026-10-04"
        onToggle={onToggle}
        onDelete={onDelete}
        onUpdate={onUpdate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /edit task/i }));

    const titleInput = screen.getByPlaceholderText('Task title...');
    fireEvent.change(titleInput, { target: { value: 'Discarded change' } });

    // Press Escape
    fireEvent.keyDown(titleInput, { key: 'Escape' });

    expect(onUpdate).not.toHaveBeenCalled();
    // Switched back to normal display
    expect(screen.getByText('Refactor Query Cache')).toBeDefined();
  });

  it('allows clearing todoDate via Clear button', () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    const onUpdate = vi.fn();

    render(
      <TaskItem
        task={mockTask}
        currentDate="2026-10-04"
        onToggle={onToggle}
        onDelete={onDelete}
        onUpdate={onUpdate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /edit task/i }));

    const clearTodoBtn = screen.getByTitle(/clear todo date/i);
    fireEvent.click(clearTodoBtn);

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    expect(onUpdate).toHaveBeenCalledWith('task-123', {
      title: 'Refactor Query Cache',
      description: null,
      todoDate: null,
      deadline: '2026-10-10T23:59:59.000Z',
      recurrenceRule: null,
    });
  });
});
