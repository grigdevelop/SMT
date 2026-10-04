# Feature Specification: Tasks & The Two-Date Model

## 1. Overview & Problem Definition

In conventional task management tools, users are often given a single date field typically named "Due Date". This ambiguity forces users to conflate two fundamentally different temporal concepts:

1. **Execution Day:** When will I actually sit down and do this task?
2. **Hard Deadline:** By what date/time will negative consequences occur if this task is incomplete?

When these concepts are combined into one field, users either:

- Set the deadline as the due date, causing tasks scheduled for next week to clutter today's view or sit invisibly until the last minute.
- Set the planned work date as the due date, losing visibility of the genuine cutoff date.

To solve this, SMT introduces the **Two-Date Model** with pure dynamic status projection and strict civil date handling.

---

## 2. Core Concepts & Terminology

| Concept             | Field Name                  | Data Type                | Semantics & Rules                                                                                                                                                                                                  |
| :------------------ | :-------------------------- | :----------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Execution Day**   | `todo_date` (`todoDate`)    | `DATE` (`YYYY-MM-DD`)    | The specific calendar day the user commits to performing this task. Stored as a pure civil date (`YYYY-MM-DD`) without hours or UTC timezone offsets to prevent date drift across daylight savings and time zones. |
| **Hard Cutoff**     | `deadline` (`deadline`)     | `TIMESTAMPTZ` (ISO-8601) | The absolute moment in time by which the task must be completed. Optional or required depending on the task nature.                                                                                                |
| **Completed State** | `completed` (`completed`)   | `BOOLEAN`                | Whether the task has been marked finished. Completing records `completed_at` (`TIMESTAMPTZ`).                                                                                                                      |
| **Dynamic Status**  | Derived via `getTaskStatus` | Enum (`TaskStatus`)      | Calculated dynamically on demand: `COMPLETED`, `TODAY`, `UPCOMING`, `OVERDUE`. Never persisted in PostgreSQL to avoid midnight batch cron jobs and database drift.                                                 |

---

## 3. Dynamic Status Projection Formula

The task status is calculated via the pure function `getTaskStatus(task, referenceDate)`:

```typescript
export type TaskStatus = 'COMPLETED' | 'TODAY' | 'UPCOMING' | 'OVERDUE';

export function getTaskStatus(
  task: Pick<TaskResponseDto, 'completed' | 'todoDate' | 'deadline'>,
  referenceDateStr?: string,
): TaskStatus {
  if (task.completed) return 'COMPLETED';

  // referenceDateStr formatted as 'YYYY-MM-DD' (defaults to user's local today)
  const today = referenceDateStr ?? getLocalCivilDateString(new Date());

  // 1. If todoDate is in the future, it is UPCOMING
  if (task.todoDate && task.todoDate > today) {
    return 'UPCOMING';
  }

  // 2. If deadline exists and deadline civil date < today, it is OVERDUE
  if (task.deadline) {
    const deadlineDate = task.deadline.slice(0, 10);
    if (deadlineDate < today) {
      return 'OVERDUE';
    }
  }

  // 3. If todoDate is in the past without deadline or deadline >= today, it is OVERDUE
  if (task.todoDate && task.todoDate < today) {
    return 'OVERDUE';
  }

  // 4. Default for active tasks on current day
  return 'TODAY';
}
```

---

## 4. Business & Ergonomic Constraints

### 4.1 The "Only-When" Execution Rule

A task scheduled for a future `todo_date` cannot be completed prior to that date.

- **Backend Guard:** `TasksService.update()` verifies `if (dto.completed && task.todo_date > today) throw new BadRequestException('Cannot complete a task before its scheduled execution date.')`.
- **Cognitive Affordance (Don Norman):** The completion checkbox is disabled and rendered with a lock icon. Hovering or clicking provides immediate feedback: _"Scheduled for YYYY-MM-DD — not available for completion today."_

### 4.2 Timezone Immunity

- `todo_date` is strictly formatted as `YYYY-MM-DD`. It does not parse through UTC timestamp conversion on save, eliminating the common bug where choosing "October 5" in GMT+2 saves as `2026-10-04T22:00:00Z` and displays as "October 4" on GMT-5.

---

## 5. Development Time Travel Machine

To test and verify temporal states (`UPCOMING`, `TODAY`, `OVERDUE`) without altering operating system clocks or seeding fragile mock data:

- The UI contains a persistent **Dev Time Machine** toolbar at the top of the viewport.
- State is managed via `DateProvider` (`packages/client/src/lib/date-context.tsx`).
- Simulates any arbitrary reference date (`YYYY-MM-DD`) with quick jump shortcuts (`+1d`, `-1d`, `+1w`, `Reset to Real Today`).
- All status badge calculations throughout the UI react immediately to the simulated reference date.
