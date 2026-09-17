# Roomwise Web

Frontend for Roomwise — a step-by-step renovation cost configurator with a 3D
room preview.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript 5
- CSS Modules, mobile-first
- pnpm workspaces (`apps/web`)
- Biome 2 for linting and formatting
- Vitest 4 for testing
- lefthook + commitlint for git hooks and Conventional Commits

## Getting started

```bash
pnpm install
pnpm --filter web exec cp .env.example .env
pnpm --filter web run dev
```

## Scripts

- `pnpm lint` — lint the whole workspace
- `pnpm format` — format the whole workspace
- `pnpm typecheck` — typecheck `apps/web`
- `pnpm test` — run unit tests
- `pnpm build` — build `apps/web`
