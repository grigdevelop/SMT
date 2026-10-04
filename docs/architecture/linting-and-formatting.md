# Linting & Formatting Standards Specification

- **Status:** Accepted
- **Date:** 2026-10-04
- **Scope:** Entire repository (`@self/contracts`, `@self/server`, `@self/client`, root config)
- **Council Reviewers:** Jason Fried (PO), Anders Hejlsberg (Architect), John Carmack (Critic)

---

## 1. Executive Summary

This standard enforces a strict separation of concerns between code formatting and static code analysis. We reject developer bikeshedding over aesthetics by delegating 100% of styling to **Prettier**. Static analysis and bug prevention are handled by **ESLint 9 (Flat Config)** with **typescript-eslint**, optimized for fast AST analysis without redundant full-project type-checker rebuilds.

---

## 2. Responsibilities Breakdown

```
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│           PRETTIER (Style)           │     │            ESLINT (Quality)          │
│ • Indentation (2 spaces)             │     │ • Bug detection                      │
│ • Semicolons & Single Quotes         │     │ • React Hook lifecycle safety        │
│ • Print Width (100)                  │     │ • Dead code / unused variable alerts │
│ • Trailing commas                    │     │ • Disallowed unsafe `any` casts      │
└──────────────────────────────────────┘     └──────────────────────────────────────┘
                   ▲                                            ▲
                   └────────── eslint-config-prettier ──────────┘
                              (Disables all style rules in ESLint)
```

---

## 3. Tooling & Configurations

### A. Prettier Configuration (`.prettierrc`)

Unified formatting across TypeScript, JSX, JSON, and Markdown files:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### B. ESLint 9 Flat Config (`eslint.config.js`)

- **TypeScript:** Uses `@typescript-eslint/eslint-plugin` and parser with recommended syntax rules.
- **React:** Applies `eslint-plugin-react-hooks` across `packages/client/**/*.{ts,tsx}`.
- **Server:** Accommodates NestJS dependency injection constructor parameters.
- **Performance Rule:** ESLint operates in pure AST mode (`tsc --noEmit` retains ownership of deep type verification).

---

## 4. Commands & Scripts

The following scripts are exposed at the repository root:

- `npm run format`: Formats all files in-place using Prettier.
- `npm run format:check`: Validates formatting in CI pipelines.
- `npm run lint`: Runs ESLint across all workspaces.
- `npm run lint:fix`: Automatically fixes fixable ESLint warnings and errors.
