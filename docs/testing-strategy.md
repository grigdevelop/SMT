# Testing Strategy & Database Isolation Specification

- **Status:** Accepted
- **Date:** 2026-10-04
- **Scope:** Full monorepo testing framework (`@self/contracts`, `@self/server`, `@self/client`)
- **Council Reviewers:** Jason Fried (PO), Anders Hejlsberg (Architect), John Carmack (Critic)

---

## 1. Executive Summary

This testing strategy prioritizes **high-signal test coverage**, **sub-second developer feedback**, and **guaranteed database isolation** without test crosstalk. We reject brittle, mock-heavy testing in favor of pure unit tests for domain math and authentic integration tests against real PostgreSQL instances.

---

## 2. Test Runner: Vitest

**Vitest** is the single test runner across the entire monorepo:

- **Native ESM & TypeScript:** Directly parses TypeScript files with zero compilation overhead (no `ts-jest` or Babel).
- **Workspace Support:** Unified execution via `vitest.workspace.ts` allowing tests across packages to run in parallel worker pools.
- **Compatibility:** Drop-in compatibility with Jest assertions and `@testing-library/react`.

---

## 3. Test Taxonomy & Scope

```
                ▲
               / \
              /   \
             / E2E \       (Optional / Minimal Smoke Tests)
            /-------\
           /  Integ  \     API Controllers + Kysely + Real PostgreSQL
          /-----------\
         /    Unit     \   Domain Math (Streaks, Dates), Zod Contracts, UI Hooks
        /---------------\
```

### A. Unit Tests (Fast, In-Memory)

- **What to test:**
  - **Habit Streak Calculations:** Timezone boundaries, skipped days, weekly vs. daily target completions.
  - **Contract Validation:** Zod schema constraints in `@self/contracts` (edge cases, invalid payloads).
  - **Critical UI Hooks:** Optimistic UI state transitions in `@self/client` using `@testing-library/react` and `happy-dom`.
- **The Golden Rule:** **Zero mocking of Kysely / SQL query builders.** If code produces or executes SQL, it belongs in an integration test.

### B. Integration Tests (Real HTTP + Real PostgreSQL)

- **Scope:** `@self/server` integration suites.
- **Harness:** NestJS `Test.createTestingModule(...)` booting controllers and services.
- **HTTP Client:** `supertest` sending requests to the app instance.
- **Persistence:** Real SQL queries executed against a dedicated PostgreSQL database (`self_mgmt_test`) running in Docker.

---

## 4. Database Isolation Strategy: Fast Truncation

To guarantee that **no test ever contaminates another test**, we employ the **Fast Truncation** pattern rather than transaction rollback.

### Why Not Transaction Rollback?

Wrapping tests in `BEGIN ... ROLLBACK` fails in real-world scenarios:

1. Application code that legitimately uses nested transactions (`db.transaction().execute(...)`) breaks or requires savepoint emulation.
2. It fails to test deferred foreign key constraints and commit-time triggers.
3. Connection pool multiplexing can cause deadlocks when multiple queries are awaited.

### The Fast Truncation Solution

1. **Migration Lifecycle:** Kysely migrations are executed **once** before the test suite begins in Vitest's `globalSetup`.
2. **Per-Test Cleanup (`beforeEach`):** Before each test executes, a raw truncation query runs:
   ```typescript
   export async function truncateTestDatabase(db: Kysely<Database>): Promise<void> {
     await sql`
       TRUNCATE TABLE 
         tasks, 
         habits, 
         habit_logs, 
         goals 
       RESTART IDENTITY CASCADE;
     `.execute(db);
   }
   ```
3. **Performance:** In PostgreSQL on local hardware/Docker, multi-table truncation takes **~2 to 5 milliseconds**.
4. **Outcome:** Every test starts with an authentic, empty database schema. Tests can commit, roll back, or handle concurrent writes without state crosstalk.

---

## 5. Integration Test Pattern Example

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { KyselyService } from '../src/database/kysely.service';
import { truncateTestDatabase } from './test-utils/db-truncate';

describe('Habits Integration (POST /habits)', () => {
  let app: INestApplication;
  let kysely: KyselyService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    kysely = app.get(KyselyService);
  });

  beforeEach(async () => {
    // Ensures complete isolation - zero crosstalk from previous tests
    await truncateTestDatabase(kysely.db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a habit and returns a 201 with persisted record', async () => {
    const payload = { title: 'Read 20 mins', frequency: 'DAILY' };

    const res = await request(app.getHttpServer()).post('/habits').send(payload).expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(String),
      title: 'Read 20 mins',
      streakCount: 0,
    });

    // Verify raw persistence in PostgreSQL
    const inDb = await kysely.db
      .selectFrom('habits')
      .selectAll()
      .where('id', '=', res.body.id)
      .executeTakeFirst();

    expect(inDb).toBeDefined();
    expect(inDb?.title).toBe('Read 20 mins');
  });
});
```

---

## 6. Commands & NPM Scripts

- `npm run test`: Runs unit tests across all packages (`@self/contracts`, `@self/server`, `@self/client`).
- `npm run test:e2e`: Boots test database container, runs migrations, and executes server integration tests.
- `npm run test:watch`: Runs Vitest in interactive watch mode for rapid TDD.
