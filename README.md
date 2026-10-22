# Roomwise Web

Frontend for Roomwise, a step-by-step renovation cost configurator with a 3D
room preview. The backend lives in
[roomwise-api](https://github.com/OksanaVakuliak/roomwise-api).

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- CSS Modules, mobile-first
- next-intl for i18n (English and Ukrainian)
- Zustand for client state
- Serwist for the PWA (manifest, offline page, update notice)
- Sentry for error reporting
- Biome for linting and formatting, Vitest and Testing Library for tests
- lefthook and commitlint for git hooks and Conventional Commits

## Structure

pnpm workspace; the application is in `apps/web`.

```text
apps/web
  messages/        translation files
  public/          PWA icons
  scripts/         tooling (API type generation)
  src/
    app/           routes (App Router)
    components/    UI components, each with its own CSS module
    config/        environment validation and route constants
    generated/     API types generated from the OpenAPI spec
    i18n/          next-intl setup
    lib/           shared logic
    stores/        Zustand stores
    styles/        global styles
    test/          test helpers
```

## Requirements

- Node.js 24 or newer
- pnpm 10 (pinned in the `packageManager` field)

## Getting started

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
```

Set `API_ORIGIN` in `apps/web/.env` (see below), then start the dev server:

```bash
pnpm --filter web run dev
```

## Scripts

Run from the repository root:

| Script           | Description                                         |
| ---------------- | --------------------------------------------------- |
| `pnpm lint`      | Check the whole workspace with Biome                |
| `pnpm format`    | Format and fix the whole workspace with Biome       |
| `pnpm typecheck` | Type-check `apps/web`                               |
| `pnpm test`      | Run unit tests once                                 |
| `pnpm build`     | Production build of `apps/web`                      |
| `pnpm api:types` | Regenerate API types (see below)                    |
| `pnpm commit`    | Interactive Conventional Commits prompt (commitizen) |

Run in `apps/web` (or with `pnpm --filter web run <script>`): `dev`, `build`,
`start`, `typecheck`, `test`, `api:types`.

## Environment variables

Defined in `apps/web/.env.example`.

| Variable                       | Required | Description                                                                                                                  |
| ------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `API_ORIGIN`                   | yes      | Backend origin, validated as a URL. `/api/*` is proxied to it through Next.js rewrites, so cookies stay same-origin.         |
| `NEXT_PUBLIC_SHOWCASE_ENABLED` | no       | `true` or `false` (default `false`). Enables the component showcase route in `pnpm dev`; production builds never serve it.  |
| `SENTRY_DSN`                   | no       | Sentry DSN for server-side reporting.                                                                                        |
| `NEXT_PUBLIC_SENTRY_DSN`       | no       | Sentry DSN for the browser.                                                                                                  |
| `SENTRY_AUTH_TOKEN`            | no       | Used to upload source maps at build time. Without it, source map upload is disabled.                                         |

`API_ORIGIN` is read at build time: the rewrite is written into the routes
manifest. After changing it on a hosting platform, redeploy rather than just
updating the variable.

## Running against the backend

Either run [roomwise-api](https://github.com/OksanaVakuliak/roomwise-api)
locally and set `API_ORIGIN` to its address (`http://localhost:3000` by
default; this app's dev server runs on `http://localhost:3001`), or point
`API_ORIGIN` at the deployed API:

```text
API_ORIGIN=https://roomwise-api.onrender.com
```

The deployed API runs on the free Render plan and sleeps when idle. The app
shows a warm-up screen while it wakes up, which can take a short while.

## API types

`pnpm api:types` reads the backend's OpenAPI document and writes TypeScript
types to `apps/web/src/generated/api.d.ts` using `openapi-typescript`. By
default the spec is taken from `../roomwise-api/apps/api/openapi.json`, so the
API repository is expected to be checked out next to this one. Set
`OPENAPI_SPEC` to use another path; a relative path is resolved from `apps/web`.

## Deployment

The app is deployed to Vercel with these project settings:

- Root Directory: `apps/web`
- Framework preset: Next.js
- Node.js version: 24.x
- Function region: `fra1`

`main` deploys to production; every other branch, including `develop`, gets a
preview deployment.

Set `API_ORIGIN` for all environments.

To check a deployment, request `GET /api/v1/health`. It goes through the
rewrite and should return the API's health response.

## Branching

`develop` is the main working branch and `main` holds releases only. Work
happens in short-lived branches opened as pull requests into `develop` and
squash-merged. Releases are merged from `develop` into `main`.

## Fonts

Fonts are loaded through `next/font/google` and self-hosted at build time. All
three are licensed under the
[SIL Open Font License 1.1](https://openfontlicense.org/open-font-license-official-text/):

- [Tektur](https://fonts.google.com/specimen/Tektur)
- [Commissioner](https://fonts.google.com/specimen/Commissioner)
- [Caveat](https://fonts.google.com/specimen/Caveat)
