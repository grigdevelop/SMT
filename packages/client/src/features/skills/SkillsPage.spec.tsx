import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SkillsPage } from './SkillsPage';
import { api } from '../../lib/api';
import type { SkillDto } from '@self/contracts';

const mockSkills: SkillDto[] = [
  {
    id: 'skill-1',
    name: 'Mathematics',
    color: '#6366f1',
    completedTaskCount: 3, // Novice (0-5)
    createdAt: '2026-10-04T00:00:00.000Z',
    updatedAt: '2026-10-04T00:00:00.000Z',
  },
  {
    id: 'skill-2',
    name: 'TypeScript',
    color: '#0ea5e9',
    completedTaskCount: 15, // Practitioner (6-20)
    createdAt: '2026-10-04T00:00:00.000Z',
    updatedAt: '2026-10-04T00:00:00.000Z',
  },
  {
    id: 'skill-3',
    name: 'System Architecture',
    color: '#a855f7',
    completedTaskCount: 55, // Master (51+)
    createdAt: '2026-10-04T00:00:00.000Z',
    updatedAt: '2026-10-04T00:00:00.000Z',
  },
];

describe('SkillsPage Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  function renderSkillsPage() {
    return render(
      <QueryClientProvider client={queryClient}>
        <SkillsPage />
      </QueryClientProvider>,
    );
  }

  it('renders empty state when user has no skills', async () => {
    vi.spyOn(api.skills, 'list').mockResolvedValue([]);
    renderSkillsPage();

    const emptyText = await screen.findByText(/No skills cultivated yet/i);
    expect(emptyText).toBeDefined();
    expect(screen.getByRole('button', { name: /add first skill/i })).toBeDefined();
  });

  it('renders skills with names, completed counts, and calculated tiers', async () => {
    vi.spyOn(api.skills, 'list').mockResolvedValue(mockSkills);
    renderSkillsPage();

    await screen.findByText('Mathematics');
    expect(screen.getByText('TypeScript')).toBeDefined();
    expect(screen.getByText('System Architecture')).toBeDefined();

    // Check tiers
    expect(screen.getByText('Novice')).toBeDefined();
    expect(screen.getByText('Practitioner')).toBeDefined();
    expect(screen.getByText('Master')).toBeDefined();

    // Check counts
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('15')).toBeDefined();
    expect(screen.getByText('55')).toBeDefined();

    // Check total mastery counter
    expect(screen.getByText('73')).toBeDefined(); // 3 + 15 + 55
  });

  it('creates a new skill via the inline creation form', async () => {
    vi.spyOn(api.skills, 'list').mockResolvedValue(mockSkills);
    const createSpy = vi.spyOn(api.skills, 'create').mockResolvedValue({
      id: 'skill-4',
      name: 'Writing',
      color: '#10b981',
      completedTaskCount: 0,
      createdAt: '2026-10-04T00:00:00.000Z',
      updatedAt: '2026-10-04T00:00:00.000Z',
    });

    renderSkillsPage();
    await screen.findByText('Mathematics');

    const newSkillBtn = screen.getByRole('button', { name: /new skill/i });
    fireEvent.click(newSkillBtn);

    const nameInput = screen.getByPlaceholderText(/skill name/i);
    fireEvent.change(nameInput, { target: { value: 'Writing' } });

    const submitBtn = screen.getByRole('button', { name: /create skill/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Writing',
        }),
      );
    });
  });

  it('updates an existing skill name and color', async () => {
    vi.spyOn(api.skills, 'list').mockResolvedValue(mockSkills);
    const updateSpy = vi.spyOn(api.skills, 'update').mockResolvedValue({
      ...mockSkills[0],
      name: 'Advanced Mathematics',
    });

    renderSkillsPage();
    await screen.findByText('Mathematics');

    const editBtn = screen.getByRole('button', { name: /edit mathematics/i });
    fireEvent.click(editBtn);

    const editInput = screen.getByDisplayValue('Mathematics');
    fireEvent.change(editInput, { target: { value: 'Advanced Mathematics' } });

    const saveBtn = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        'skill-1',
        expect.objectContaining({
          name: 'Advanced Mathematics',
        }),
      );
    });
  });

  it('deletes a skill when confirmed', async () => {
    vi.spyOn(api.skills, 'list').mockResolvedValue(mockSkills);
    const deleteSpy = vi.spyOn(api.skills, 'delete').mockResolvedValue();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderSkillsPage();
    await screen.findByText('Mathematics');

    const deleteBtn = screen.getByRole('button', { name: /delete mathematics/i });
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('skill-1');
    });
  });
});
