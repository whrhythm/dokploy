# AGENTS.md - Developer Guide for Dokploy

This document provides essential information for AI agents working on the Dokploy codebase.

## Project Overview

Dokploy is a self-hosted PaaS solution built with:
- **Frontend**: Next.js (React 18), tRPC, Radix UI, Tailwind CSS
- **Backend**: tRPC, Drizzle ORM, PostgreSQL, better-auth
- **Infrastructure**: Docker, Docker Compose, Traefik
- **Package Manager**: pnpm (monorepo with workspaces)

## Project Structure

```
/home/edge/dokploy/
├── apps/
│   ├── dokploy/        # Main Next.js application
│   │   ├── pages/      # Frontend pages (incl. pages/api as API spec)
│   │   ├── components/ # Reusable UI components
│   │   ├── public/     # Static assets
│   │   ├── server/     # Backend entry (tRPC API)
│   │   │   └── api/    # tRPC API routes
│   │   └── docker/     # Container deployment configs
│   └── schedules/      # Scheduled jobs
├── packages/
│   └── server/         # Shared server library (@dokploy/server)
│       └── src/
│           ├── services/ # Core backend services
│           └── db/       # Core schemas and validations
├── apps/dokploy/drizzle/ # Migrations
├── Dockerfile*           # Build entrypoints
└── setup_dokploy.sh      # One-click setup script
```

## Build, Lint, and Test Commands

### Running All Checks

```bash
# Type check all packages
pnpm run typecheck

# Lint and format check (Biome)
pnpm run format-and-lint

# Fix linting issues
pnpm run format-and-lint:fix
```

### Building

```bash
# Build all packages
pnpm run build

# Build specific app
pnpm run dokploy:build     # Main app
pnpm run server:build      # Server package
pnpm run dokploy:dev      # Dev mode
```

### Running Tests

The main test suite is in `apps/dokploy/__test__/` using Vitest.

```bash
# Run all tests
pnpm run test

# Run a specific test file
pnpm vitest run __test__/env/stack-environment.test.ts

# Run tests matching a pattern (by test name)
pnpm vitest run --testNamePattern "resolves environment variables"

# Run tests in watch mode
pnpm vitest
```

### Database Commands

```bash
# Generate migration
pnpm --filter=dokploy run migration:generate

# Run migrations
pnpm --filter=dokploy run migration:run

# Push schema changes
pnpm --filter=dokploy run db:push
```

## Code Style Guidelines

### Formatter and Linter

This project uses **Biome** (not ESLint/Prettier). Configuration is in `biome.json`.

```bash
# Check and auto-fix
biome check --write .
```

### TypeScript Configuration

- Strict mode enabled (`strict: true`)
- `noUncheckedIndexedAccess: true` - array access returns `T | undefined`
- Module resolution: `Bundler`
- Target: ES2022
- Path aliases:
  - `@/*` → `apps/dokploy/*`
  - `@dokploy/server/*` → `packages/server/src/*`

### Naming Conventions

- **Files**: kebab-case (e.g., `my-component.tsx`, `get-users.ts`)
- **Components**: PascalCase (e.g., `Dashboard.tsx`)
- **Functions**: camelCase (e.g., `getUserById`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `DEFAULT_PORT`)
- **Database tables**: snake_case (via Drizzle)

### Import Order

Biome automatically organizes imports. Standard order:

1. External libraries (React, Next.js, etc.)
2. tRPC imports
3. Internal packages (@dokploy/server)
4. Relative imports (local components/utils)

```typescript
import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { getUserById } from "@/server/users";
```

### Error Handling

- Use Zod for input validation in tRPC procedures
- Throw descriptive errors with context
- Use `TRPCError` for API errors

```typescript
import { TRPCError } from "@trpc/server";

if (!user) {
  throw new TRPCError({
    code: "NOT_FOUND",
    message: "User not found",
  });
}
```

### React/Component Guidelines

- Use functional components with hooks
- Prefer `use client` directive for client-side components
- Use TypeScript types for props
- Extract complex logic into custom hooks

```typescript
"use client";

import { useState, useEffect } from "react";

interface UserCardProps {
  userId: string;
  name: string;
}

export function UserCard({ userId, name }: UserCardProps) {
  const [loading, setLoading] = useState(true);

  return <div>{name}</div>;
}
```

## i18n Guidelines (UI)

Use the project i18n system for any UI copy changes in `apps/dokploy`.

- Use `useTranslation` from `apps/dokploy/hooks/translation-provider.tsx` and call `t("...")` for all UI text.
- Do not hardcode strings in components, toasts, dialogs, or placeholders.
- Add new keys to `apps/dokploy/public/locales/en/common.json` and `apps/dokploy/public/locales/zh-Hans/common.json`.
- Use `settings.json` only for settings pages; otherwise default to `common.json`.
- Prefer existing key patterns (for example `dashboard.*`, `menu.*`, `button.*`, `form.*`, `error.*`).
- For dynamic values, use `{param}` placeholders in JSON and pass params to `t(key, { param })`.

### Database (Drizzle ORM)

- Use Drizzle for all database operations
- Define schemas in `packages/server/src/db/schema/`
- Use drizzle-zod for schema validation

```typescript
import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});
```

### Testing Guidelines

- Tests in `__test__/` directory alongside source files
- Use Vitest with `describe`, `it`, `expect`
- Mock external dependencies (Docker, SSH, databases)

```typescript
import { describe, expect, it } from "vitest";

describe("my utility", () => {
  it("does something", () => {
    expect(result).toEqual(expected);
  });
});
```

### Common Patterns

**tRPC Procedure**:
```typescript
export const getUser = publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    return db.query.users.findFirst({
      where: eq(users.id, input.id),
    });
  });
```

**Tailwind CSS**:
- Use `cn()` utility from `lib/utils` for conditional classes
- Follow existing component patterns with Radix UI

## Branding Image/Logo

- Logo must use: `https://cognitoaigo.com/images/logo.png`
- Logo source image is not square: `1667x209` pixels (aspect ratio ~`7.97:1`).
- In emails, keep logo display in this ratio (recommended render size: `480x60`) to avoid stretching.
- If this branding URL changes, update both the email template and top-level documentation.

## Environment Variables

Required env files (not committed):
- `.env` - development
- `.env.local` - local overrides

Key variables:
- `DATABASE_URL` - PostgreSQL connection
- `GITHUB_CLIENT_ID/SECRET` - OAuth
- `JWT_SECRET` - Auth tokens

## Git Conventions

- Pre-commit hooks run `biome check --write` on staged files
- Conventional commit messages recommended but not enforced
- Never commit secrets or `.env` files
