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
```

`.env.example` ships without values. Before the first run, set `API_ORIGIN`
in `apps/web/.env` to the address of a locally running
[`roomwise-api`](https://github.com/OksanaVakuliak/roomwise-api) —
`http://localhost:3000` by default (the API's own default port; CI uses
`http://localhost:4000` instead, set explicitly in the workflow). `pnpm dev`
fails to start without it.

```bash
pnpm --filter web run dev
```

`API_ORIGIN` is baked into the build: the `/api/*` rewrite is written into
`routes-manifest.json` at build time. Changing it on Vercel requires a
redeploy, not just an environment variable update.

## Scripts

- `pnpm lint` — lint the whole workspace
- `pnpm format` — format the whole workspace
- `pnpm typecheck` — typecheck `apps/web`
- `pnpm test` — run unit tests
- `pnpm build` — build `apps/web`
