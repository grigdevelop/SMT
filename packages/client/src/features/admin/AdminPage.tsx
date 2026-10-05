import { useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useAuth } from '../auth/AuthContext';
import { useAdminUsers, useUpdateUserRole, useDeleteUser } from './use-admin-users';
import { Role } from '@self/contracts';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            <span>Administration</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage registered user accounts, role-based access permissions, and system access.
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div
          role="status"
          className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 animate-in fade-in duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {(error || updateRoleMutation.isError || deleteUserMutation.isError) && (
        <div
          role="alert"
          className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
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
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xs font-medium text-slate-500 uppercase tracking-wider">
              Total Accounts
            </div>
            <div className="text-lg font-bold text-slate-900">{totalUsers}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xs font-medium text-slate-500 uppercase tracking-wider">
              Administrators
            </div>
            <div className="text-lg font-bold text-slate-900">{adminCount}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xs font-medium text-slate-500 uppercase tracking-wider">
              Standard Users
            </div>
            <div className="text-lg font-bold text-slate-900">{standardCount}</div>
          </div>
        </div>
      </div>

      {/* Users Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-semibold text-slate-800">User Accounts</h2>
          <span className="text-2xs text-slate-500">{totalUsers} registered</span>
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
                <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-200 text-2xs uppercase tracking-wider font-semibold">
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
                <tbody ref={tableBodyRef} className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isConfirmingDelete = confirmDeleteId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition">
                        {/* Email & (You) pill */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{u.email}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.5 rounded text-2xs font-semibold bg-indigo-100 text-indigo-700">
                                You
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Role Badge & Selector */}
                        <td className="px-4 py-3">
                          {isSelf ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                              <Shield className="w-3 h-3" />
                              <span>ADMIN</span>
                            </span>
                          ) : (
                            <select
                              aria-label={`Change role for ${u.email}`}
                              value={u.role}
                              disabled={updateRoleMutation.isPending}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                              className="px-2 py-1 text-xs rounded border border-slate-200 bg-white text-slate-800 shadow-2xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                            >
                              <option value={Role.USER}>USER</option>
                              <option value={Role.ADMIN}>ADMIN</option>
                            </select>
                          )}
                        </td>

                        {/* Activity */}
                        <td className="px-4 py-3 text-slate-500">
                          <div className="flex items-center gap-2 text-2xs">
                            <span className="bg-slate-100 px-2 py-0.5 rounded">
                              {u.taskCount} tasks
                            </span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded">
                              {u.skillCount} skills
                            </span>
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td className="px-4 py-3 text-slate-500 text-2xs">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          {isSelf ? (
                            <span
                              className="text-2xs text-slate-400 italic"
                              title="You cannot delete your own active admin account"
                            >
                              Current session
                            </span>
                          ) : isConfirmingDelete ? (
                            <div className="inline-flex items-center gap-1.5">
                              <span className="text-2xs text-rose-600 font-medium">Delete?</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={deleteUserMutation.isPending}
                                className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 active:scale-95 motion-reduce:transform-none text-white text-2xs font-semibold transition-all duration-75 cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 active:scale-95 motion-reduce:transform-none text-slate-700 text-2xs font-semibold transition-all duration-75 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(u.id)}
                              title={`Delete ${u.email}`}
                              aria-label={`Delete user ${u.email}`}
                              className="p-1.5 text-slate-400 hover:text-rose-600 active:scale-90 motion-reduce:transform-none rounded transition-all duration-75 cursor-pointer inline-flex items-center justify-center"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Hidden on sm+) */}
            <div ref={mobileCardsRef} className="sm:hidden divide-y divide-slate-100">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isConfirmingDelete = confirmDeleteId === u.id;

                return (
                  <div key={u.id} className="p-3.5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900 text-xs truncate">
                            {u.email}
                          </span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded text-2xs font-semibold bg-indigo-100 text-indigo-700 shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-2xs text-slate-400 mt-0.5">
                          Joined {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Role selection/badge */}
                      {isSelf ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-purple-100 text-purple-700 shrink-0">
                          <Shield className="w-3 h-3" />
                          <span>ADMIN</span>
                        </span>
                      ) : (
                        <select
                          aria-label={`Change role for ${u.email}`}
                          value={u.role}
                          disabled={updateRoleMutation.isPending}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                          className="px-2 py-1 text-base sm:text-xs rounded border border-slate-200 bg-white text-slate-800 shadow-2xs shrink-0 cursor-pointer"
                        >
                          <option value={Role.USER}>USER</option>
                          <option value={Role.ADMIN}>ADMIN</option>
                        </select>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-2xs text-slate-500 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 px-2 py-0.5 rounded">
                          {u.taskCount} tasks
                        </span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded">
                          {u.skillCount} skills
                        </span>
                      </div>

                      {/* Mobile Delete */}
                      {!isSelf && (
                        <div>
                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={deleteUserMutation.isPending}
                                className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 active:scale-95 motion-reduce:transform-none text-white font-semibold text-2xs transition-all duration-75 cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 active:scale-95 motion-reduce:transform-none text-slate-700 font-semibold text-2xs transition-all duration-75 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(u.id)}
                              aria-label={`Delete user ${u.email}`}
                              className="text-rose-600 font-medium hover:underline p-1 cursor-pointer"
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
