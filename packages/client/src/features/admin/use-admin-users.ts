import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Role, AdminUserListItemDto } from '@self/contracts';

export const ADMIN_USERS_QUERY_KEY = ['admin-users'] as const;

export function useAdminUsers() {
  return useQuery<AdminUserListItemDto[]>({
    queryKey: ADMIN_USERS_QUERY_KEY,
    queryFn: () => api.admin.listUsers(),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => api.admin.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.admin.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
    },
  });
}
