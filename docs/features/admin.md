# Specification: Admin Role & User Management

## 1. Overview & Business Value

As the application supports multi-user authentication, administrators require a dedicated management view to inspect user accounts, manage role permissions (`USER` vs `ADMIN`), and remove test or deactivated users.

To eliminate manual SQL seeding in new environments, the system automatically bootstraps a default administrator account on startup if no admin account exists.

---

## 2. Security Boundaries & Invariants

1. **Privilege Escalation Prevention:**
   - Public registration (`POST /auth/register`) strictly assigns `role = 'USER'`.
   - The public registration contract (`RegisterSchema`) does not accept a `role` field.
   - Any attempt to submit a `role` during registration is stripped and ignored by backend validation.

2. **Self-Lockout Invariant (Norman Error Prevention):**
   - An administrator cannot demote their own account from `ADMIN` to `USER`.
   - An administrator cannot delete their own account.
   - This invariant is enforced both at the NestJS domain service layer (returning `403 Forbidden`) and in the React UI (disabling the action with a `(You)` badge).

3. **Role-Based Access Control (RBAC):**
   - All `/admin/*` API endpoints require a valid JWT or PAT token and are guarded by `@UseGuards(AuthGuard, RolesGuard)` and `@Roles(Role.ADMIN)`.
   - Non-admin requests receive `403 Forbidden`.
   - Unauthenticated requests receive `401 Unauthorized`.

4. **Cascading Data Integrity:**
   - Deleting a user in PostgreSQL cascades automatically to all associated `tasks`, `skills`, `task_skills`, and `api_tokens` via existing foreign key constraints (`ON DELETE CASCADE`).

---

## 3. Default Admin Bootstrapping

On application startup (`OnApplicationBootstrap`), `AdminBootstrapService` runs a lightweight indexed check:

```sql
SELECT 1 FROM users WHERE role = 'ADMIN' LIMIT 1;
```

- If an administrator exists, the check returns in `< 1ms` and exits immediately with zero password-hashing overhead.
- If no administrator exists, the service hashes the password and inserts the default administrator:
  - **Email:** `process.env.DEFAULT_ADMIN_EMAIL || 'admin@self.local'`
  - **Password:** `process.env.DEFAULT_ADMIN_PASSWORD || 'Admin12345!'`
  - **Role:** `'ADMIN'`

---

## 4. API Contracts (`@self/contracts`)

### Schemas & DTOs

```typescript
export const UpdateUserRoleSchema = z.object({
  role: RoleSchema,
});
export type UpdateUserRoleDto = z.infer<typeof UpdateUserRoleSchema>;

export interface AdminUserListItemDto extends UserDto {
  readonly taskCount: number;
  readonly skillCount: number;
}
```

### Endpoints

- `GET /admin/users` -> `Promise<AdminUserListItemDto[]>`
- `PATCH /admin/users/:id/role` -> `Body: UpdateUserRoleDto` -> `Promise<UserDto>`
- `DELETE /admin/users/:id` -> `Promise<{ success: boolean; deletedUserId: string }>`

---

## 5. User Experience & Ergonomics (`@self/client`)

1. **Role-Gated Affordance:**
   - The top header navigation in `App.tsx` displays the **Admin** tab if and only if `currentUser.role === Role.ADMIN`. Standard users never see a disabled or locked tab.
2. **Access Control Routing:**
   - Navigating directly to `/admin` as a standard user redirects immediately to `/` via `<ProtectedRoute requiredRole={Role.ADMIN} />`.
3. **Data Display & Interaction:**
   - Metric summary cards at the top: Total Users, Administrators, Standard Users.
   - Responsive user list:
     - **Desktop:** Crisp table showing Email, Role Badge (Shield icon for Admin), Created Date, Task Count, Skill Count, and Actions.
     - **Mobile (<640px):** Clean vertical cards with touch-friendly action buttons.
   - Logged-in admin's row displays an accent `(You)` badge with actions disabled to prevent accidental self-demotion or self-deletion.
   - Deleting any other user opens an inline confirmation dialog requiring explicit intent.
