import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminPage } from './AdminPage';
import { Role } from '@self/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as authContextModule from '../auth/AuthContext';
import * as adminHooksModule from './use-admin-users';

vi.mock('../auth/AuthContext');
vi.mock('./use-admin-users');

describe('AdminPage Component', () => {
  let queryClient: QueryClient;

  const mockAdminUser = {
    id: 'admin-1',
    email: 'admin@self.local',
    role: Role.ADMIN,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  const mockUsersList = [
    {
      id: 'admin-1',
      email: 'admin@self.local',
      role: Role.ADMIN,
      taskCount: 5,
      skillCount: 2,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
    {
      id: 'user-2',
      email: 'member@self.local',
      role: Role.USER,
      taskCount: 12,
      skillCount: 4,
      createdAt: '2026-10-02T00:00:00.000Z',
      updatedAt: '2026-10-02T00:00:00.000Z',
    },
  ];

  const mockUpdateRoleMutateAsync = vi.fn().mockResolvedValue({});
  const mockDeleteUserMutateAsync = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
      user: mockAdminUser,
      token: 'jwt-token',
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    vi.spyOn(adminHooksModule, 'useAdminUsers').mockReturnValue({
      data: mockUsersList,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof adminHooksModule.useAdminUsers>);

    vi.spyOn(adminHooksModule, 'useUpdateUserRole').mockReturnValue({
      mutateAsync: mockUpdateRoleMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof adminHooksModule.useUpdateUserRole>);

    vi.spyOn(adminHooksModule, 'useDeleteUser').mockReturnValue({
      mutateAsync: mockDeleteUserMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof adminHooksModule.useDeleteUser>);
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <AdminPage />
      </QueryClientProvider>,
    );

  it('renders metric cards and user listing correctly', () => {
    renderComponent();

    expect(screen.getByText(/Administration/i)).toBeDefined();
    expect(screen.getByText('Total Accounts')).toBeDefined();
    expect(screen.getByText('Administrators')).toBeDefined();
    expect(screen.getByText('Standard Users')).toBeDefined();

    // Verify emails rendered
    expect(screen.getAllByText('admin@self.local').length).toBeGreaterThan(0);
    expect(screen.getAllByText('member@self.local').length).toBeGreaterThan(0);
  });

  it('renders (You) badge for the logged-in admin and disables modification', () => {
    renderComponent();

    // The logged-in admin row should display "You"
    const youBadges = screen.getAllByText('You');
    expect(youBadges.length).toBeGreaterThan(0);

    // There should be no role select for the logged in user
    expect(screen.queryByLabelText('Change role for admin@self.local')).toBeNull();
  });

  it('allows promoting/demoting another user role', async () => {
    renderComponent();

    // Standard user role selector exists
    const selects = screen.getAllByLabelText('Change role for member@self.local');
    expect(selects.length).toBeGreaterThan(0);

    fireEvent.change(selects[0], { target: { value: Role.ADMIN } });

    await waitFor(() => {
      expect(mockUpdateRoleMutateAsync).toHaveBeenCalledWith({
        id: 'user-2',
        role: Role.ADMIN,
      });
    });
  });

  it('provides inline confirmation friction before deleting a user', async () => {
    renderComponent();

    // Click delete for member@self.local
    const deleteButtons = screen.getAllByLabelText('Delete user member@self.local');
    fireEvent.click(deleteButtons[0]);

    // Should reveal confirmation prompt
    const confirmButtons = screen.getAllByRole('button', { name: /confirm/i });
    expect(confirmButtons.length).toBeGreaterThan(0);

    // Click Cancel
    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButtons[0]);

    // Confirmation should be dismissed
    expect(screen.queryByRole('button', { name: /confirm/i })).toBeNull();
  });
});
