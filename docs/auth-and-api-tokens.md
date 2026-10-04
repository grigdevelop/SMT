# Authentication, RBAC, and API Tokens Specification

- **Status:** Accepted
- **Date:** 2026-10-04
- **Scope:** Full-stack authentication, role authorization, and programmatic API token system
- **Council Reviewers:** Jason Fried (PO), Anders Hejlsberg (Architect), John Carmack (Critic)

---

## 1. Executive Summary

This specification defines the authentication and authorization architecture for the Self-Management Tool. It provides:

1. **Interactive Authentication:** Standard email/password registration and login issuing signed JSON Web Tokens (JWT) for browser SPA sessions.
2. **Programmatic Access (Personal API Tokens):** Fast, cryptographically secure bearer tokens (`smt_pat_*`) for CLI tools, shell scripts, and third-party shortcuts.
3. **Role-Based Access Control (RBAC):** Minimal two-tier role hierarchy (`ADMIN` and `USER`).
4. **Data Isolation:** All personal resources (tasks, habits, goals) are strictly partitioned by foreign key to `users.id`.

---

## 2. Threat Model & Cryptographic Mechanics

### A. Personal API Tokens (PAT)

- **Format:** `smt_pat_<32_random_hex_characters>` (32 bytes entropy generated via `crypto.randomBytes(32)`).
- **Storage Law:** Raw API tokens are **never stored** in the database.
- **Hashing:** Tokens are hashed using **SHA-256** before database storage.
- **Verification Path:** Incoming bearer tokens are hashed in memory (<0.01ms CPU time) and matched against the indexed `token_hash` column in PostgreSQL.
- **Single-View Lifecycle:** The unhashed secret is presented to the user **exactly once** upon creation. Subsequent views only display `token_preview` (e.g. `smt_pat_...a4f1`).

### B. Password Security

- **Algorithm:** Asynchronous `bcrypt` (12 salt rounds) or `argon2id`.
- **Event Loop Rule:** Synchronous hashing methods (`hashSync`) are forbidden to prevent blocking the Node.js event loop during key stretching.

### C. Native NestJS Guard (No Passport.js)

Instead of multi-layered Passport middleware, authentication is evaluated by a single native `AuthGuard`:

```
Incoming Request (Authorization: Bearer <token>)
               │
               ▼
   Is token prefixed with "smt_pat_"?
         ├─── YES ───► Compute SHA-256 hash
         │             Look up token_hash in PostgreSQL `api_tokens`
         │             Touch `last_used_at` asynchronously
         │             Attach user to request
         │
         └─── NO ────► Verify JWT signature in-memory
                       Extract payload { sub: userId, role }
                       Attach user to request
```

---

## 3. Database Schema Design (Kysely)

### Table: `users`

| Column          | Type           | Constraints                     | Description                         |
| :-------------- | :------------- | :------------------------------ | :---------------------------------- |
| `id`            | `uuid`         | PK, default `gen_random_uuid()` | Unique user identifier              |
| `email`         | `varchar(255)` | UNIQUE, NOT NULL                | User login email (lowercased)       |
| `password_hash` | `varchar(255)` | NOT NULL                        | Asynchronously salted password hash |
| `role`          | `varchar(50)`  | NOT NULL, default `'USER'`      | `'ADMIN'` or `'USER'`               |
| `created_at`    | `timestamptz`  | NOT NULL, default `now()`       | Registration timestamp              |
| `updated_at`    | `timestamptz`  | NOT NULL, default `now()`       | Last modification                   |

### Table: `api_tokens`

| Column          | Type           | Constraints                         | Description                           |
| :-------------- | :------------- | :---------------------------------- | :------------------------------------ |
| `id`            | `uuid`         | PK, default `gen_random_uuid()`     | Token record identifier               |
| `user_id`       | `uuid`         | FK -> `users(id)` ON DELETE CASCADE | Owner of the API token                |
| `name`          | `varchar(100)` | NOT NULL                            | Friendly label (e.g., "Terminal CLI") |
| `token_hash`    | `varchar(64)`  | UNIQUE, NOT NULL, INDEXED           | SHA-256 hex digest of raw token       |
| `token_preview` | `varchar(20)`  | NOT NULL                            | Truncated prefix/suffix for display   |
| `last_used_at`  | `timestamptz`  | NULLABLE                            | Timestamp of last API call            |
| `created_at`    | `timestamptz`  | NOT NULL, default `now()`           | Creation timestamp                    |

### Domain Table Migration: `tasks`

- Add column `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`.
- Add index on `(user_id, is_completed)`.

---

## 4. Shared Contract Definitions (`@self/contracts`)

```typescript
export const Role = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export interface UserDto {
  readonly id: string;
  readonly email: string;
  readonly role: Role;
  readonly createdAt: string;
}

export interface AuthResponseDto {
  readonly accessToken: string;
  readonly user: UserDto;
}

export interface ApiTokenDto {
  readonly id: string;
  readonly name: string;
  readonly tokenPreview: string;
  readonly lastUsedAt: string | null;
  readonly createdAt: string;
}

export interface CreatedApiTokenDto extends ApiTokenDto {
  readonly rawToken: string; // Present only once in creation response
}
```

---

## 5. Implementation Roadmap

The implementation will proceed in four sequential, test-driven phases:

1. **Phase 1: Contracts & Database Migrations**
   - Define auth contracts, Zod schemas, and DTOs in `@self/contracts`.
   - Create Kysely migration `002_create_users_and_api_tokens.ts`.
   - Update Kysely `Database` interface in `@self/server`.

2. **Phase 2: Authentication Core & Password Security**
   - Implement `PasswordService` with asynchronous bcrypt hashing.
   - Implement `AuthService` handling register, login, and JWT issuance.
   - Build native `AuthGuard` (JWT & PAT dual-path resolver).

3. **Phase 3: Role-Based Access Control & API Token Management**
   - Implement `@Roles()` decorator and `RolesGuard`.
   - Implement `ApiTokensService` and controller (`POST /api/tokens`, `GET /api/tokens`, `DELETE /api/tokens/:id`).
   - Validate hashing and one-time display lifecycle with integration tests.

4. **Phase 4: Domain Scoping & Integration Tests**
   - Add `user_id` foreign key to `tasks`.
   - Scope `TasksRepository` and controller endpoints to the authenticated user.
   - End-to-end integration tests validating:
     - User isolation (User A cannot access User B's tasks).
     - Token authentication (CLI requests succeed with `Authorization: Bearer smt_pat_*`).
     - Role protection (Admin endpoints rejected for standard `USER`).
