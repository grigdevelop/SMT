# Technology Stack & Implementation Laws

All architectural debates and code generation must strictly adhere to the following technology stack. The agents may debate _how_ to use these tools, but they may not debate _whether_ to use them.

## 1. TypeScript (The Universal Language)

- **Role:** The strict, single language spanning the entire stack.
- **Rules:** Strict mode is non-negotiable. Zero use of `any`. Rely heavily on discriminated unions, interfaces for domain boundaries, and generic constraints.

## 2. NestJS (Backend Architecture)

- **Role:** The API layer and business logic orchestrator.
- **Rules:** Leverage its modular dependency injection. Structure the application using Domain-Driven Design (DDD) principles and separate read/write operations utilizing CQRS patterns. Keep controllers exceptionally thin; push business logic into distinct services or command handlers.

## 3. PostgreSQL & Kysely (Data Persistence)

- **Role:** The single source of truth for relational state.
- **ORM / Query Builder:** **Kysely**. Type-safe SQL query builder. Zero runtime magic, explicit SQL semantics, compile-time type safety derived directly from TypeScript database interfaces, and minimal overhead on the Node.js event loop.
- **Rules:** Design normalized schemas with strict foreign key constraints and indexes. Interaction with PostgreSQL must be handled exclusively via Kysely to guarantee compile-time type safety from SQL queries to API boundary. Database migrations must be managed via Kysely's migration runner.

## 4. React (Frontend Interfaces & Ecosystem)

- **Role:** The browser-based user interface.
- **App Runtime & Bundler:** Vite + React SPA. Static client bundle communicating with the NestJS API; zero SSR hydration overhead.
- **Server State & Sync:** TanStack Query (React Query v5). Dedicated to server caching, query deduplication, and optimistic updates for instant interactions (e.g., habit toggles, task completion). Avoid homebrew synchronization engines.
- **Routing:** React Router. Predictable client-side routing (`/today`, `/habits`, `/goals`, `/settings`) with low TypeScript compilation overhead.
- **Styling & UI Primitives:** Tailwind CSS paired with Radix UI headless primitives (shadcn pattern). No heavyweight monolithic component libraries (MUI, AntD). Accessible primitives pulled in on-demand; zero CSS runtime overhead.
- **Forms & Validation:** React Hook Form + Zod. Uncontrolled DOM inputs for performance; Zod schemas shared with backend contract boundaries where applicable.
- **Client State Policy:** Zero external global state stores (no Redux, Zustand). State belongs in the server cache (TanStack Query), URL search parameters, or localized React component state.
- **Utilities:** `date-fns` (pure functional, tree-shakeable date math for habit streaks and scheduling) and `lucide-react` (modular SVG icons).

## 5. Docker (Infrastructure & Local Dev)

- **Role:** Containerization for deterministic environments.
- **Rules:** The PostgreSQL database must run locally via a `docker-compose.yml` file. The backend should be able to connect to this container seamlessly without requiring local host installations of Postgres.

## 6. Monorepo Architecture & Workspaces

- **Orchestration:** npm workspaces (`packages/*`) coordinated via Lerna.
- **Package Topology (The 3-Package Rule):**
  1.  `@self/contracts` (`packages/contracts`): Pure TypeScript domain contracts, DTOs, and Zod validation schemas. **Strict Isolation Rule:** Must only depend on `zod`. Zero database, Node.js, React, or NestJS dependencies allowed.
  2.  `@self/server` (`packages/server`): NestJS modular monolith with DDD contexts (`tasks`, `habits`, `goals`) and Kysely persistence.
  3.  `@self/client` (`packages/client`): Vite + React SPA consuming `@self/contracts`.
- **Local DX / Linking:** `@self/contracts` exports TypeScript source directly (`./src/index.ts`) via package exports. No intermediate build or watch step required for contracts during local development.

## 7. Testing Strategy & Database Isolation

- **Unified Test Runner:** **Vitest** across the entire monorepo (root workspace configuration, native TS/ESM execution).
- **Unit Testing Rules:**
  - Focus on domain calculations (habit streaks, intervals, date boundaries) and Zod schema validation.
  - Zero mocking of SQL or database query builders in unit tests. Never test against mocks of Kysely.
- **Integration Testing Rules:**
  - Execute against real NestJS application contexts and real PostgreSQL databases (via local Docker container `postgres_test` / dedicated test DB).
  - Use `supertest` for end-to-end HTTP request testing into controllers.
- **Database Isolation Policy:**
  - **Fast Truncation:** Apply Kysely migrations once at test suite setup. Before each test (`beforeEach`), execute `TRUNCATE TABLE ... RESTART IDENTITY CASCADE` across all application tables (~2-5ms).
  - **Prohibition:** Do not use transaction rollback savepoint emulation for test isolation; tests must execute against real commits and foreign key evaluations.

## 8. Linting & Formatting Standards

- **Code Formatting:** **Prettier** governs code aesthetics, indentation, and whitespace uniformly via root `.prettierrc`.
- **Code Quality & Linting:** **ESLint 9 (Flat Config)** (`eslint.config.js`) enforces syntax safety, bug detection, React hook rules, and boundaries.
- **Separation of Concerns:** `eslint-config-prettier` disables any conflicting stylistic ESLint rules. ESLint never formats; Prettier never lints.
- **Performance Guardrail:** Fast AST/syntax linting. Type-checking remains strictly with `tsc --noEmit`.

## 9. Authentication, RBAC & API Tokens

- **Role Model (RBAC):** `ADMIN` and `USER` enums defined strictly in `@self/contracts`. Enforced declaratively via `@Roles(Role.ADMIN)` and NestJS `RolesGuard`.
- **Guard Architecture:** Native NestJS `AuthGuard` implementing `CanActivate`. No Passport.js wrappers. Verifies both interactive JWT Bearer tokens and programmatic API tokens (`smt_pat_*`).
- **Cryptographic Security:**
  - Password hashing must use asynchronous routines (Argon2 or bcrypt) to prevent blocking the Node.js event loop.
  - Personal API Tokens (PAT) are generated with 32 bytes of entropy (`crypto.randomBytes(32)`), returned raw to the user once, and stored exclusively as SHA-256 hashes (`token_hash`) in PostgreSQL with a B-tree index.
- **Tenant & Data Scoping:** All user-generated domain models (`tasks`, `habits`, `goals`) must include a foreign key reference to `users.id`. All Kysely queries must strictly filter by the authenticated `user_id`.
