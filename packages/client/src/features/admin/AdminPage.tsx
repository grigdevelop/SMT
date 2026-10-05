import { useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useAuth } from '../auth/AuthContext';
import { useAdminUsers, useUpdateUserRole, useDeleteUser } from './use-admin-users';
import { Role } from '@self/contracts';
import { Button, Badge } from '../../components/ui';
import {
  Shield,
  User as UserIcon,
  Users,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export function AdminPage() {
  const [tableBodyRef] = useAutoAnimate<HTMLTableSectionElement>({ duration: 150 });
  const [mobileCardsRef] = useAutoAnimate<HTMLDivElement>({ duration: 150 });
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading, error } = useAdminUsers();
  const updateRoleMutation = useUpdateUserRole();
  const deleteUserMutation = useDeleteUser();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === Role.ADMIN).length;
  const standardCount = users.filter((u) => u.role === Role.USER).length;

  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (userId === currentUser?.id) return;
    try {
      await updateRoleMutation.mutateAsync({ id: userId, role: newRole });
      setSuccessMessage('User role updated successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      // Error handled by mutation state
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) return;
    try {
      await deleteUserMutation.mutateAsync(userId);
      setConfirmDeleteId(null);
      setSuccessMessage('User deleted successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-300 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span>Administration</span>
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-0.5">
            Manage registered user accounts, role-based access permissions, and system access.
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div
          role="status"
          className="p-3 bg-success/10 border border-success/20 text-success rounded-lg text-xs flex items-center gap-2 animate-in fade-in duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {(error || updateRoleMutation.isError || deleteUserMutation.isError) && (
        <div
          role="alert"
          className="p-3 bg-error/10 border border-error/20 text-error rounded-lg text-xs flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-error shrink-0" />
          <span>
            {error instanceof Error
              ? error.message
              : updateRoleMutation.error instanceof Error
                ? updateRoleMutation.error.message
                : deleteUserMutation.error instanceof Error
                  ? deleteUserMutation.error.message
                  : 'An error occurred while managing users.'}
          </span>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card bg-base-100 p-3.5 border border-base-300 shadow-xs flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xs font-medium text-base-content/60 uppercase tracking-wider">
              Total Accounts
            </div>
            <div className="text-lg font-bold text-base-content">{totalUsers}</div>
          </div>
        </div>

        <div className="card bg-base-100 p-3.5 border border-base-300 shadow-xs flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xs font-medium text-base-content/60 uppercase tracking-wider">
              Administrators
            </div>
            <div className="text-lg font-bold text-base-content">{adminCount}</div>
          </div>
        </div>

        <div className="card bg-base-100 p-3.5 border border-base-300 shadow-xs flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-base-200 text-base-content/70 flex items-center justify-center shrink-0">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xs font-medium text-base-content/60 uppercase tracking-wider">
              Standard Users
            </div>
            <div className="text-lg font-bold text-base-content">{standardCount}</div>
          </div>
        </div>
      </div>

      {/* Users Container */}
      <div className="card bg-base-100 border border-base-300 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-base-300 bg-base-200/40 flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-semibold text-base-content">User Accounts</h2>
          <span className="text-2xs text-base-content/60">{totalUsers} registered</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-base-content/60 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs">Loading user accounts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-base-content/60 text-xs">No users found.</div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on mobile < sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="table w-full text-left text-xs">
                <thead className="bg-base-200/50 text-base-content/70 border-b border-base-300 text-2xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">
                      User Email
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Role
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Activity
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Joined
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody ref={tableBodyRef} className="divide-y divide-base-300">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isConfirmingDelete = confirmDeleteId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-base-200/50 transition">
                        {/* Email & (You) pill */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-base-content">{u.email}</span>
                            {isSelf && <Badge variant="primary">You</Badge>}
                          </div>
                        </td>

                        {/* Role Badge & Selector */}
                        <td className="px-4 py-3">
                          {isSelf ? (
                            <Badge variant="purple">
                              <Shield className="w-3 h-3 mr-1" />
                              <span>ADMIN</span>
                            </Badge>
                          ) : (
                            <select
                              aria-label={`Change role for ${u.email}`}
                              value={u.role}
                              disabled={updateRoleMutation.isPending}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                              className="select select-bordered select-xs text-xs font-normal cursor-pointer"
                            >
                              <option value={Role.USER}>USER</option>
                              <option value={Role.ADMIN}>ADMIN</option>
                            </select>
                          )}
                        </td>

                        {/* Activity */}
                        <td className="px-4 py-3 text-base-content/70">
                          <div className="flex items-center gap-2 text-2xs">
                            <span className="badge badge-ghost badge-sm text-2xs">
                              {u.taskCount} tasks
                            </span>
                            <span className="badge badge-ghost badge-sm text-2xs">
                              {u.skillCount} skills
                            </span>
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td className="px-4 py-3 text-base-content/70 text-2xs">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          {isSelf ? (
                            <span
                              className="text-2xs text-base-content/50 italic"
                              title="You cannot delete your own active admin account"
                            >
                              Current session
                            </span>
                          ) : isConfirmingDelete ? (
                            <div className="inline-flex items-center gap-1.5">
                              <span className="text-2xs text-error font-medium">Delete?</span>
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={deleteUserMutation.isPending}
                                className="px-2 py-0.5 h-auto text-2xs"
                              >
                                Confirm
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-0.5 h-auto text-2xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="iconSm"
                              onClick={() => setConfirmDeleteId(u.id)}
                              title={`Delete ${u.email}`}
                              aria-label={`Delete user ${u.email}`}
                              className="text-base-content/60 hover:text-error"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Hidden on sm+) */}
            <div ref={mobileCardsRef} className="sm:hidden divide-y divide-base-300">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isConfirmingDelete = confirmDeleteId === u.id;

                return (
                  <div key={u.id} className="p-3.5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-base-content text-xs truncate">
                            {u.email}
                          </span>
                          {isSelf && <Badge variant="primary">You</Badge>}
                        </div>
                        <div className="text-2xs text-base-content/60 mt-0.5">
                          Joined {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Role selection/badge */}
                      {isSelf ? (
                        <Badge variant="purple">
                          <Shield className="w-3 h-3 mr-1" />
                          <span>ADMIN</span>
                        </Badge>
                      ) : (
                        <select
                          aria-label={`Change role for ${u.email}`}
                          value={u.role}
                          disabled={updateRoleMutation.isPending}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                          className="select select-bordered select-xs text-xs font-normal shrink-0 cursor-pointer"
                        >
                          <option value={Role.USER}>USER</option>
                          <option value={Role.ADMIN}>ADMIN</option>
                        </select>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-2xs text-base-content/70 pt-1 border-t border-base-300">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-ghost badge-sm text-2xs">
                          {u.taskCount} tasks
                        </span>
                        <span className="badge badge-ghost badge-sm text-2xs">
                          {u.skillCount} skills
                        </span>
                      </div>

                      {/* Mobile Delete */}
                      {!isSelf && (
                        <div>
                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-1.5">
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={deleteUserMutation.isPending}
                                className="px-2 py-1 h-auto text-2xs"
                              >
                                Confirm
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 h-auto text-2xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(u.id)}
                              aria-label={`Delete user ${u.email}`}
                              className="text-error font-medium hover:underline p-1 cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
