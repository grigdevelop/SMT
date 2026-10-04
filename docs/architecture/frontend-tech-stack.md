# Frontend Architecture & Technology Stack Decision

- **Status:** Accepted
- **Date:** 2026-10-04
- **Scope:** Frontend Application (`packages/client` or equivalent workspace package)
- **Council Reviewers:** Jason Fried (PO), Anders Hejlsberg (Architect), John Carmack (Critic)

---

## 1. Executive Summary

For our self-management tool (focusing on tasks, habits, and goals), the frontend architecture prioritizes:

1. **Low latency & instant interaction:** Personal tracking requires immediate feedback (e.g., checking off a habit or task must never wait on network roundtrips).
2. **First-principles simplicity:** No extraneous abstraction layers or unnecessary global state stores.
3. **End-to-end type safety:** Direct TypeScript type alignment with our NestJS API DTOs.

---

## 2. Selected Stack & Libraries

| Layer                    | Technology                      | Key Responsibility & Rationale                                                                                                                                                       |
| :----------------------- | :------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **App Runtime & Build**  | **Vite + React (TypeScript)**   | Single Page Application (SPA). Clean boundary separating browser bundle from NestJS API. Fast HMR, minimal build times, zero SSR hydration overhead.                                 |
| **Server State & Cache** | **TanStack Query (v5)**         | Manages all API query caches, background deduplication, and optimistic mutations for instant task/habit completion.                                                                  |
| **Client Routing**       | **React Router (v6/v7)**        | Standard, predictable client-side navigation (`/today`, `/habits`, `/goals`, `/settings`) without heavy recursive type inference slowing down `tsc`.                                 |
| **Styling & Components** | **Tailwind CSS + Radix UI**     | Tailwind for zero-runtime utility styling. Headless Radix UI primitives (shadcn pattern) used on-demand for accessible dialogs/dropdowns. No bloated monolithic UI component suites. |
| **Forms & Validation**   | **React Hook Form + Zod**       | Uncontrolled form inputs to eliminate unnecessary re-renders. Zod schemas guarantee runtime and compile-time contract safety.                                                        |
| **Client State Policy**  | **Native React + URL state**    | Explicit ban on external stores (Zustand, Redux). Server data lives in TanStack Query; UI view filters live in URL search params; local transient state lives in React components.   |
| **Utilities**            | **`date-fns` & `lucide-react`** | `date-fns` for pure functional, immutable date/streak calculations. `lucide-react` for tree-shakeable SVG icons.                                                                     |

---

## 3. Architectural Rules & Implementation Guidelines

### A. State Management Hierarchy

1. **Server Data:** Always accessed and mutated via TanStack Query custom hooks (e.g., `useHabits()`, `useToggleHabit()`).
2. **Navigation & Filters:** Keep view filters (e.g., active tab, selected date, habit category) in URL search parameters (`useSearchParams`) so views are shareable and bookmarkable.
3. **Transient UI State:** Use React `useState` / `useReducer` localized to the component subtree.
4. **No Global State Libraries:** Do not install Zustand, Redux, or Recoil unless a complex cross-tree synchronization requirement arises that cannot be solved via the URL or component composition.

### B. Optimistic Updates for High-Frequency Actions

For actions like toggling a habit or completing a task, use TanStack Query's `onMutate` pattern:

```typescript
const queryClient = useQueryClient();

const toggleHabitMutation = useMutation({
  mutationFn: (habitId: string) => api.habits.toggle(habitId),
  onMutate: async (habitId) => {
    await queryClient.cancelQueries({ queryKey: habitKeys.all });
    const previous = queryClient.getQueryData<HabitDto[]>(habitKeys.all);

    // Optimistically update cache immediately
    queryClient.setQueryData<HabitDto[]>(habitKeys.all, (old) =>
      old?.map((h) => (h.id === habitId ? { ...h, completedToday: !h.completedToday } : h)),
    );

    return { previous };
  },
  onError: (err, habitId, context) => {
    // Roll back to previous snapshot on error
    if (context?.previous) {
      queryClient.setQueryData(habitKeys.all, context.previous);
    }
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: habitKeys.all });
  },
});
```

### C. Headless UI & Tailwind Separation

- Never install monolithic UI kits (MUI, Ant Design, Mantine).
- Code reusable components directly into the codebase (`components/ui/button.tsx`, `components/ui/dialog.tsx`).
- Keep business logic in custom hooks and presentation strictly in JSX/Tailwind.

### D. Form Contracts with Zod

Forms must define their schema with Zod, enabling schema reuse between client forms and NestJS DTO boundaries:

```typescript
import { z } from 'zod';

export const createHabitSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  frequency: z.enum(['DAILY', 'WEEKLY']),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
```
