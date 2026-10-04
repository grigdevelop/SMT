# Developer Workflows & Automation Guide

- **Scope:** Local environment setup, platform lifecycle management, and PowerShell tooling on Windows
- **Location:** Automation scripts reside in `./scripts/`

---

## 1. Quickstart (One Command to Start)

To start the complete development environment (Docker PostgreSQL, automatic migrations, NestJS backend, and Vite React frontend):

```powershell
npm run dev
```

Or invoke the PowerShell script directly:

```powershell
.\scripts\start-platform.ps1
```

- **Backend API:** `http://localhost:3000/api`
- **Frontend Web App:** `http://localhost:5173`
- **Graceful Exit:** Press `Ctrl+C` in your terminal to shut down both the frontend and backend concurrently.

---

## 2. Core Automation Scripts

### A. Start Platform (`scripts/start-platform.ps1`)

```powershell
.\scripts\start-platform.ps1 [-OnlyDb]
```

1. Verifies that the Docker daemon is running.
2. Starts the PostgreSQL container via `docker compose up -d postgres`.
3. Actively polls `docker exec self_mgmt_postgres pg_isready -U postgres` until port 5432 is healthy (avoids the `ECONNREFUSED` startup race condition).
4. Automatically runs all pending Kysely migrations (`npm run db:migrate`).
5. Launches the NestJS API and Vite client concurrently using `concurrently -k` (single terminal, synchronized logging, auto-kills child processes on exit).
6. **Flag `-OnlyDb`:** Starts the PostgreSQL container and runs migrations, but skips launching dev servers (useful for backend unit testing).

### B. Stop Platform (`scripts/stop-platform.ps1`)

```powershell
npm run platform:stop
# or
.\scripts\stop-platform.ps1
```

1. Gracefully stops the PostgreSQL container (`docker compose down`).
2. Checks Windows TCP connections on development ports **`3000`** and **`5173`**.
3. Forcefully terminates any lingering background Node processes to prevent `EADDRINUSE` port collision errors on your next boot.

### C. Reset Database (`scripts/reset-db.ps1`)

```powershell
npm run db:reset
# or
.\scripts\reset-db.ps1
```

1. Destroys the container and wipes PostgreSQL data volumes (`docker compose down -v`).
2. Boots a clean PostgreSQL container.
3. Awaits container health readiness.
4. Automatically applies all migrations to both the development database (`self_mgmt_dev`) and test database (`self_mgmt_test`).

---

## 3. Daily Command Cheatsheet

| Task                 | Command                 | Description                                              |
| :------------------- | :---------------------- | :------------------------------------------------------- |
| **Start Everything** | `npm run dev`           | Boots DB, runs migrations, launches server + client      |
| **Stop Everything**  | `npm run platform:stop` | Stops Docker DB and kills processes on ports 3000 / 5173 |
| **Reset Database**   | `npm run db:reset`      | Wipes Docker volumes and re-runs all migrations          |
| **Start DB Only**    | `npm run db:up`         | Starts Docker PostgreSQL container                       |
| **Run Migrations**   | `npm run db:migrate`    | Runs Kysely migrations on dev database                   |
| **Typecheck**        | `npm run typecheck`     | Strict `tsc --noEmit` across all workspaces              |
| **Run All Tests**    | `npm run test`          | Runs Vitest across contracts, client, and server         |
| **Format Code**      | `npm run format`        | Prettier formats all repository files in-place           |
| **Lint Code**        | `npm run lint`          | ESLint 9 Flat Config static analysis                     |
