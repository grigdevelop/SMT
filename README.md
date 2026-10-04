# Self-Management Tool (SMT)

A high-performance personal task, habit, and goal management platform built with TypeScript, React, NestJS, Kysely, and PostgreSQL.

---

## 🚀 Quickstart (Windows)

### Prerequisites

- **Node.js:** v20+ or v22+
- **Docker Desktop:** Running locally for PostgreSQL persistence

### Setup & Run

```powershell
# 1. Install dependencies
npm install

# 2. Start the entire platform (Database + Backend + Frontend)
npm run dev
```

- **Frontend Client:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3000/api](http://localhost:3000/api)

Press `Ctrl+C` in your terminal to shut down both the server and client concurrently.

---

## 🛠️ Utility Scripts

PowerShell automation scripts in `./scripts/` manage local development:

```powershell
# Start database, run migrations, and launch dev servers
npm run dev
# or
.\scripts\start-platform.ps1

# Stop database and kill any lingering processes on ports 3000 / 5173
npm run platform:stop
# or
.\scripts\stop-platform.ps1

# Wipe local Docker volume and re-run all migrations from scratch
npm run db:reset
# or
.\scripts\reset-db.ps1
```

For full details, see the [Developer Workflows Guide](docs/guides/developer-workflows.md).

---

## 📦 Monorepo Architecture

This monorepo follows the **3-Package Rule** to eliminate micro-package sprawl:

- **`@self/contracts` (`packages/contracts`):** Pure TypeScript domain contracts, DTOs, and Zod validation schemas. Zero runtime dependencies other than `zod`.
- **`@self/server` (`packages/server`):** NestJS modular backend powered by Kysely query builder and PostgreSQL. Features JWT sessions, RBAC (`ADMIN`/`USER`), and SHA-256 hashed Personal API Tokens.
- **`@self/client` (`packages/client`):** Vite + React SPA styled with Tailwind CSS, leveraging TanStack Query for optimistic zero-latency interactions.

---

## 🧪 Testing & Quality Assurance

```powershell
# Run unit and integration tests across all workspaces
npm run test

# Typecheck all TypeScript code
npm run typecheck

# Check code formatting (Prettier)
npm run format:check

# Run static analysis (ESLint 9 Flat Config)
npm run lint
```
