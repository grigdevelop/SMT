# AI Engineering Principles & Workflow Laws

This document captures the binding operational laws, domain conventions, and workflow rules established for all AI agents working in this repository.

---

## 1. Specification & Discussion First Protocol

1. **Council Debate & UX-First Mandate**:
   - When a new capability, concept, or feature is proposed, the Orchestrator must initiate the Council discussion first (Jason Fried -> Don Norman -> Anders Hejlsberg -> John Carmack).
   - Never skip UI/UX design or cognitive ergonomics (Norman affordances, signifiers, interaction states).
2. **Strict Authorization Gate**:
   - The AI must **never** immediately jump into writing or modifying code without explicit user confirmation.
   - If the user requests to explore, discuss, or document a concept (e.g., _"just write about this concept in docs"_), write the specification to `docs/features/<feature-name>.md` and make **zero changes** to application code.

---

## 2. Temporal & Date Domain Modeling

To prevent timezone drift, subtle off-by-one errors, and conceptual ambiguity:

1. **`todoDate` (Planned Execution Day)**:
   - Civil date string in `YYYY-MM-DD` format (timezone-agnostic).
   - Represents the specific calendar day the user plans to perform the task.
   - Tasks with a future `todoDate` are `UPCOMING` and cannot be completed before their date.
2. **`deadline` (Cutoff Moment)**:
   - Full ISO UTC timestamp string (`YYYY-MM-DDTHH:mm:ss.sssZ`).
   - Represents the strict cutoff moment after which the task is flagged as `OVERDUE`.
3. **Simulated Dev Time Travel (`DevTimeMachine`)**:
   - All temporal computations, UI statuses, and date filtering must support client/dev temporal overrides (e.g., date context or request headers) to enable deterministic testing of edge cases without altering system clocks.

---

## 3. Recurring Tasks & Event-Driven Engine

1. **Single-Active-Instance Law**:
   - Recurring tasks must **never** pre-populate hundreds of future calendar rows in the database.
   - The task list contains only 1 active pending occurrence at any given time.
2. **Zero-Daemon Materialization Law**:
   - Never rely on periodic background cron polling or heavy daemons.
   - The next recurring occurrence is materialized lazily within the database transaction when the current instance is marked completed.
3. **Pure Shared Contract Engine**:
   - All mathematical date projections (`calculateNextTodoDate`) and label formatters (`formatRecurrenceLabel`) must reside in `@self/contracts` as zero-dependency, pure functions thoroughly covered by unit tests.

---

## 4. Quality Gate & Verification Protocol

Before declaring any implementation task complete, the AI must execute and pass the complete verification pipeline:

1. **Tests**: `npm test` (all workspace tests passing across client, contracts, and server against real PostgreSQL).
2. **Typecheck**: `npm run typecheck` (`tsc --noEmit` across all workspaces with 0 errors, no `any`).
3. **Lint**: `npm run lint` (`eslint .` with 0 warnings or errors).
4. **Format**: `npm run format:check` (`prettier --check .` with 0 style violations).
5. **Build**: `npm run build` (clean production Vite client bundle and NestJS compilation).
6. **Git**: Stage changes, create clean conventional commit message, and push to `origin/main`.
