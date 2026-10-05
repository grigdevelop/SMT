import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskItem, type TaskItemProps } from './TaskItem';
import type { TaskDto } from '@self/contracts';
import { RecurrenceFrequency } from '@self/contracts';
import { api } from '../../lib/api';

const mockTask: TaskDto = {
  id: 'task-123',
  title: 'Refactor Query Cache',
  description: null,
  isCompleted: false,
  todoDate: '2026-10-04',
  deadline: '2026-10-10T23:59:59.000Z',
  recurrenceRule: null,
  dueDate: null,
  skills: [],
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
  skills: [],
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
  skills: [],
  createdAt: '2026-10-04T00:00:00.000Z',
  updatedAt: '2026-10-04T00:00:00.000Z',
};

const mockTaskWithSkills: TaskDto = {
  id: 'task-skills-1',
  title: 'Study Vector Calculus',
  description: null,
  isCompleted: false,
  todoDate: '2026-10-04',
  deadline: null,
  recurrenceRule: null,
  dueDate: null,
  skills: [
    { id: 'skill-1', name: 'Math', color: '#6366f1' },
    { id: 'skill-2', name: 'Physics', color: '#10b981' },
  ],
  createdAt: '2026-10-04T00:00:00.000Z',
  updatedAt: '2026-10-04T00:00:00.000Z',
};

describe('TaskItem & Inline Editing', () => {
  beforeEach(() => {
    vi.spyOn(api.skills, 'list').mockResolvedValue([]);
  });

  function renderWithQuery(task: TaskDto, props: Partial<TaskItemProps> = {}) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <TaskItem
          task={task}
          currentDate="2026-10-04"
          onToggle={props.onToggle || vi.fn()}
          onDelete={props.onDelete || vi.fn()}
          onUpdate={props.onUpdate || vi.fn()}
        />
      </QueryClientProvider>,
    );
  }

  it('renders task normally with edit affordance', () => {
    renderWithQuery(mockTask);
    expect(screen.getByText('Refactor Query Cache')).toBeDefined();
    expect(screen.getByRole('button', { name: /edit task/i })).toBeDefined();
  });

  it('renders recurrence badge when task has recurrenceRule', () => {
    renderWithQuery(mockRecurringTask);
    const badge = screen.getByTestId('recurrence-badge');
    expect(badge).toBeDefined();
    expect(badge.textContent).toContain('Daily');
  });

  it('renders Notes button and toggles formatted Markdown viewer', () => {
    renderWithQuery(mockTaskWithDescription);
    const notesBtn = screen.getByTitle(/view formatted notes/i);
    expect(notesBtn).toBeDefined();

    expect(screen.queryByText(/Key Requirements/i)).toBeNull();
    fireEvent.click(notesBtn);
    expect(screen.getByText(/Key Requirements/i)).toBeDefined();

    const collapseBtn = screen.getByTitle(/collapse notes/i);
    fireEvent.click(collapseBtn);
    expect(screen.queryByText(/Key Requirements/i)).toBeNull();
  });

  it('switches to inline edit mode when Edit button is clicked', () => {
    renderWithQuery(mockTask);
    const editBtn = screen.getByRole('button', { name: /edit task/i });
    fireEvent.click(editBtn);

    const titleInput = screen.getByPlaceholderText('Task title...') as HTMLInputElement;
    expect(titleInput).toBeDefined();
    expect(titleInput.value).toBe('Refactor Query Cache');
    expect(screen.getByRole('button', { name: /save changes/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDefined();
  });

  it('submits updated title, dates, and description when Save Changes is clicked', () => {
    const onUpdate = vi.fn();
    renderWithQuery(mockTask, { onUpdate });

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
      skillIds: [],
    });
  });

  it('allows configuring recurrence rule in edit mode and saving', () => {
    const onUpdate = vi.fn();
    renderWithQuery(mockTask, { onUpdate });

    fireEvent.click(screen.getByRole('button', { name: /edit task/i }));

    expect(screen.getByLabelText(/todo date \(execution\):/i)).toBeDefined();

    const freqSelect = screen.getByLabelText(/repeat frequency/i);
    fireEvent.change(freqSelect, { target: { value: RecurrenceFrequency.WEEKLY } });

    expect(screen.queryByLabelText(/todo date \(execution\):/i)).toBeNull();
    expect(screen.queryByLabelText(/deadline \(cutoff\):/i)).toBeNull();
    expect(screen.getByLabelText(/starts on:/i)).toBeDefined();
    expect(screen.getByLabelText(/ends on \(optional\):/i)).toBeDefined();

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
    const onUpdate = vi.fn();
    renderWithQuery(mockTask, { onUpdate });

    fireEvent.click(screen.getByRole('button', { name: /edit task/i }));

    const titleInput = screen.getByPlaceholderText('Task title...');
    fireEvent.change(titleInput, { target: { value: 'Discarded change' } });

    fireEvent.keyDown(titleInput, { key: 'Escape' });

    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByText('Refactor Query Cache')).toBeDefined();
  });

  it('allows clearing todoDate via Clear button', () => {
    const onUpdate = vi.fn();
    renderWithQuery(mockTask, { onUpdate });

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
      skillIds: [],
    });
  });

  it('renders skill badges for associated skills', () => {
    renderWithQuery(mockTaskWithSkills);
    const mathBadge = screen.getByTestId('skill-badge-math');
    const physicsBadge = screen.getByTestId('skill-badge-physics');
    expect(mathBadge).toBeDefined();
    expect(mathBadge.textContent).toContain('#Math');
    expect(physicsBadge).toBeDefined();
    expect(physicsBadge.textContent).toContain('#Physics');
  });

  it('triggers micro-reward feedback pill when completing a task with skills', () => {
    const onToggle = vi.fn();
    renderWithQuery(mockTaskWithSkills, { onToggle });

    const toggleBtn = screen.getByRole('button', { name: /mark complete/i });
    fireEvent.click(toggleBtn);

    expect(onToggle).toHaveBeenCalledWith('task-skills-1', true);
    const rewardPill = screen.getByTestId('micro-reward-pill');
    expect(rewardPill).toBeDefined();
    expect(rewardPill.textContent).toContain('+1 #Math');
    expect(rewardPill.textContent).toContain('+1 #Physics');
  });

  it('triggers checkmark-pop animation class and tactile feedback when completed', () => {
    const onToggle = vi.fn();
    renderWithQuery(mockTask, { onToggle });

    const toggleBtn = screen.getByRole('button', { name: /mark complete/i });
    expect(toggleBtn.className).toContain('active:scale-90');
    expect(toggleBtn.className).toContain('motion-reduce:transform-none');
    expect(toggleBtn.className).not.toContain('animate-checkmark-pop');

    fireEvent.click(toggleBtn);
    expect(onToggle).toHaveBeenCalledWith('task-123', true);
    expect(toggleBtn.className).toContain('animate-checkmark-pop');
  });
});
