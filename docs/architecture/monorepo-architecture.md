# Monorepo Architecture & Database Persistence Decision

- **Status:** Accepted
- **Date:** 2026-10-04
- **Scope:** Repository-wide architecture, workspace topology, and data persistence
- **Council Reviewers:** Jason Fried (PO), Anders Hejlsberg (Architect), John Carmack (Critic)

---

## 1. Executive Summary

This monorepo is architected around the **3-Package Rule**: three clear, purpose-driven workspaces managed with `npm workspaces` and Lerna. We strictly reject the micro-package anti-pattern.

Database persistence is standardized on **PostgreSQL** paired with **Kysely**, providing compile-time type-safe SQL query generation without the runtime overhead or hidden query generation layers of heavy ORMs.

---

## 2. Monorepo Topology: The 3-Package Rule

```
self_management_tool/
├── package.json               # Root workspace orchestrator
├── tsconfig.base.json         # Shared compiler options (strict, NodeNext/bundler)
├── lerna.json                 # Monorepo task runner
├── docker-compose.yml         # Local PostgreSQL container
└── packages/
    ├── contracts/             # @self/contracts (Pure TS & Zod)
    ├── server/                # @self/server (NestJS + Kysely + PostgreSQL)
    └── client/                # @self/client (Vite + React SPA)
```

### A. `@self/contracts` (`packages/contracts`)

- **Role:** Single source of truth for domain types, DTOs, enums, and Zod validation schemas.
- **Strict Boundary Rule:** It has **one external runtime dependency: `zod`**. No database drivers, no NestJS decorators, no React hooks, and no Node-specific libraries (`fs`, `path`).
- **Developer Experience (DX):** Resolves directly via package exports (`"./src/index.ts"`). No intermediate build or file-watching step is required during local development.

### B. `@self/server` (`packages/server`)

- **Role:** NestJS backend API and domain orchestrator.
- **Architecture:** Modular monolith adhering to Domain-Driven Design (DDD) with CQRS handlers:
  - `modules/tasks/`
  - `modules/habits/`
  - `modules/goals/`
- **Data Access:** Kysely query builder querying PostgreSQL. Thin controllers pass validated input directly to command/query handlers.

### C. `@self/client` (`packages/client`)

- **Role:** Vite + React Single Page Application (SPA).
- **Architecture:** Feature-sliced or domain-colocated organization (`features/tasks`, `features/habits`, `features/goals`).
- **State & Network:** Imports `@self/contracts` for response typing and form validation schemas. Interacts with the API through TanStack Query with optimistic mutations.

---

## 3. Database Persistence: Why Kysely?

The Council unanimously approved **Kysely** over Prisma and traditional active-record ORMs:

1. **Zero Runtime Engine Bloat (Carmack's criteria):** Unlike engines with hidden binary engines (e.g. Prisma Rust query engine), Kysely is a lightweight, pure TypeScript SQL query builder. It translates TypeScript into raw parameterized SQL with near-zero CPU and memory footprint on the Node.js event loop.
2. **First-Principles SQL Control:** Full control over query generation, joins, indexes, and execution plans without ORM N+1 leaks or obscure abstraction layers.
3. **End-to-End Type Safety (Hejlsberg's criteria):** Database tables are defined as plain TypeScript interfaces:
   ```typescript
   export interface Database {
     tasks: TaskTable;
     habits: HabitTable;
     habit_logs: HabitLogTable;
     goals: GoalTable;
   }
   ```
   Kysely derives column types, auto-completes table joins, and verifies query expressions at compile time.
4. **Migrations:** Managed directly using Kysely's migration runner with deterministic up/down SQL or TypeScript migration files.

---

## 4. Root Orchestration & Development Workflow

To enforce friction-free developer onboarding, root scripts are unified:

- `npm run dev`: Concurrently runs:
  1. PostgreSQL via Docker (`docker compose up -d postgres`)
  2. NestJS server with watch mode (`@self/server`)
  3. Vite client with HMR (`@self/client`)
- `npm run build`: Type-checks and builds packages in topological order.
- `npm run lint`: Strict linter execution across all packages.
- `npm run test`: Runs unit tests across packages without starting extraneous services.
