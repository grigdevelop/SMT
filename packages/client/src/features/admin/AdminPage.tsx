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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span>Administration</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage registered user accounts, role-based access permissions, and system access.
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div
          role="status"
          className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs flex items-center gap-2 animate-in fade-in duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {(error || updateRoleMutation.isError || deleteUserMutation.isError) && (
        <div
          role="alert"
          className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
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
        <div className="bg-card p-3.5 rounded-xl border border-border shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Accounts
            </div>
            <div className="text-lg font-bold text-foreground">{totalUsers}</div>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-border shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xs font-medium text-muted-foreground uppercase tracking-wider">
              Administrators
            </div>
            <div className="text-lg font-bold text-foreground">{adminCount}</div>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-border shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xs font-medium text-muted-foreground uppercase tracking-wider">
              Standard Users
            </div>
            <div className="text-lg font-bold text-foreground">{standardCount}</div>
          </div>
        </div>
      </div>

      {/* Users Container */}
      <div className="bg-card rounded-xl border border-border shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-semibold text-foreground">User Accounts</h2>
          <span className="text-2xs text-muted-foreground">{totalUsers} registered</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-xs">Loading user accounts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No users found.</div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on mobile < sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/30 text-muted-foreground border-b border-border text-2xs uppercase tracking-wider font-semibold">
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
                <tbody ref={tableBodyRef} className="divide-y divide-border">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isConfirmingDelete = confirmDeleteId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-muted/40 transition">
                        {/* Email & (You) pill */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{u.email}</span>
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
                              className="px-2 py-1 text-xs rounded border border-border bg-card text-foreground shadow-2xs focus:ring-1 focus:ring-primary focus:outline-hidden cursor-pointer"
                            >
                              <option value={Role.USER}>USER</option>
                              <option value={Role.ADMIN}>ADMIN</option>
                            </select>
                          )}
                        </td>

                        {/* Activity */}
                        <td className="px-4 py-3 text-muted-foreground">
                          <div className="flex items-center gap-2 text-2xs">
                            <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground">
                              {u.taskCount} tasks
                            </span>
                            <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground">
                              {u.skillCount} skills
                            </span>
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td className="px-4 py-3 text-muted-foreground text-2xs">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          {isSelf ? (
                            <span
                              className="text-2xs text-muted-foreground italic"
                              title="You cannot delete your own active admin account"
                            >
                              Current session
                            </span>
                          ) : isConfirmingDelete ? (
                            <div className="inline-flex items-center gap-1.5">
                              <span className="text-2xs text-destructive font-medium">Delete?</span>
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
                              className="text-muted-foreground hover:text-destructive"
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
            <div ref={mobileCardsRef} className="sm:hidden divide-y divide-border">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isConfirmingDelete = confirmDeleteId === u.id;

                return (
                  <div key={u.id} className="p-3.5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-foreground text-xs truncate">
                            {u.email}
                          </span>
                          {isSelf && <Badge variant="primary">You</Badge>}
                        </div>
                        <div className="text-2xs text-muted-foreground mt-0.5">
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
                          className="px-2 py-1 text-base sm:text-xs rounded border border-border bg-card text-foreground shadow-2xs shrink-0 cursor-pointer"
                        >
                          <option value={Role.USER}>USER</option>
                          <option value={Role.ADMIN}>ADMIN</option>
                        </select>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-2xs text-muted-foreground pt-1 border-t border-border">
                      <div className="flex items-center gap-2">
                        <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground">
                          {u.taskCount} tasks
                        </span>
                        <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground">
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
                              className="text-destructive font-medium hover:underline p-1 cursor-pointer"
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
