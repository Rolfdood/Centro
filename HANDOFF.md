# Centro-001 Handoff

## Current state

The infrastructure-only implementation of GitHub issue `Centro-001` has been
scaffolded on branch `feature/Centro-001`. The working tree was clean before the
scaffold work began; no existing application code was overwritten.

## Changes applied

- Added pnpm project metadata and scripts in `package.json`.
- Added and locked the approved minimal dependencies in `pnpm-lock.yaml`:
  Next.js 14, React 18, TypeScript, Tailwind/PostCSS, ESLint, Prisma, and Prisma
  Client.
- Added base configuration:
  `.gitignore`, `.eslintrc.json`, `tsconfig.json`, `next-env.d.ts`,
  `next.config.mjs`, `postcss.config.mjs`, and `tailwind.config.ts`.
- Added the safe environment template `.env.example`, documenting all variables
  from `SPEC.md` section 8 without secrets.
- Added `prisma/schema.prisma` with only the PostgreSQL datasource and Prisma
  Client generator. Per the agreed scope, there are no models or migrations yet.
- Added the minimal App Router UI in `src/app/` and a server-only Prisma singleton
  in `src/lib/db.ts`.
- Added `README.md` with local setup and verification instructions.

## Work not completed

- `pnpm prisma generate` did not complete. It failed with:

  ```text
  Error: ENOSPC: no space left on device, write
  ```

- The combined verification command (`pnpm prisma generate; pnpm lint; pnpm tsc
  --noEmit; pnpm build; pnpm test; git diff --check`) timed out before reporting
  individual results. Do not treat any verification step as passed.
- No database connectivity check was run because no configured local `.env` / valid
  `DATABASE_URL` was available.
- No Prisma data models, migration, Auth.js configuration, authentication flow,
  shadcn setup, Zod, TanStack Query, or Zustand work was applied; these are
  intentionally outside Centro-001's agreed infrastructure-only scope.

## Recommended resume steps

1. Free sufficient disk space, then inspect `git status --short` to identify any
   untracked `.next` artifacts (they are ignored and may be removed safely if
   needed). (Skip)
2. Run `pnpm prisma generate` and resolve any residual installation/build-script
   approval issue before continuing.
3. Run each verification command separately so failures are attributable:

   ```bash
   pnpm lint
   pnpm tsc --noEmit
   pnpm build
   pnpm test
   git diff --check
   ```

4. Copy `.env.example` to `.env`, set a valid PostgreSQL `DATABASE_URL`, and run a
   non-mutating Prisma connectivity check before declaring the issue complete.

## Important constraints

- Use `pnpm` only.
- Keep Prisma imports server-side; `src/lib/db.ts` is the intended shared entrypoint.
- Do not add domain models or a migration in this issue without changing scope.
- Do not add dependencies beyond the approved minimal bootstrap set.
