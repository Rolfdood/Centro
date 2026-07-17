# Centro Handoff

## Current Status

| Issue | Status | Branch | PR Status |
|---|---|---|---|
| Centro-001 | Complete & merged | `feature/Centro-001` | Merged to `develop` |
| Centro-002 | Complete & merged | `feature/Centro-002` | Merged to `develop` |
| Centro-003 | Complete & merged | `feature/Centro-003` | Merged to `develop` |
| Centro-004 | Complete, PR open | `feature/Centro-004` | PR #8 |

---

## Centro-001 — Infrastructure Setup

### Changes
- Added pnpm project metadata and scripts in `package.json`.
- Locked minimal dependencies: Next.js 14, React 18, TypeScript, Tailwind/PostCSS, ESLint, Prisma.
- Added base configuration: `.gitignore`, `.eslintrc.json`, `tsconfig.json`, `next-env.d.ts`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`.
- Added `pnpm-workspace.yaml` and `.npmrc` for lockfile compatibility.
- Added `.env.example` with all documented variables from `SPEC.md` §8.
- Updated `docker-compose.yml`: removed obsolete `version` attribute, mapped PostgreSQL to host port `5433`.
- Added `prisma/schema.prisma` with PostgreSQL datasource and Prisma Client generator.
- Added minimal App Router UI in `src/app/` and server-only Prisma singleton in `src/lib/db.ts`.
- Added `README.md` with local setup and verification instructions.

### Verification
- `pnpm install`, `pnpm lint`, `pnpm tsc --noEmit`, `pnpm build`, `pnpm dev` all pass.
- Prisma Client connects to PostgreSQL container.

---

## Centro-002 — Core Prisma Schema

### Changes
- Implemented full Prisma schema in `prisma/schema.prisma`:
  - **Enums:** `Platform`, `AccountStatus`, `PostStatus`, `TargetStatus`, `MediaType`
  - **Models:** `User`, `SocialAccount`, `Post`, `PostTarget`, `MediaAsset`, `AnalyticsSnapshot`, `AiGeneration`
  - **Constraints:** `@@unique([userId, platform, handle])`, `@@unique([postId, accountId])`, `@@unique([idempotencyKey])`
  - **Indexes:** `@@index([status, scheduledAt])`, `@@index([targetId, fetchedAt])`
- Generated and applied migration: `20260716015557_centro_002_core_schema`
- All foreign keys with correct `ON DELETE` behavior.

### Verification
- `pnpm prisma migrate dev` applied cleanly.
- `pnpm typecheck` and `pnpm lint` pass.
- Database in sync with schema.

---

## Centro-003 — Shared Platform Constraints

### Changes
- Created `src/lib/platforms/types.ts`:
  - `PlatformConstraints` interface (`maxChars`, `maxImages`, `requiresImage`, `requiresVideo`, `maxVideoSeconds`, `maxFileSizeMB`, `supportedMediaTypes`)
- Created `src/lib/platforms/constraints.ts` — single source of truth:
  - `PLATFORMS` const + `Platform` type (no Prisma import, client-safe)
  - `PLATFORM_CONSTRAINTS` record with exact limits for all 5 platforms per `SPEC.md` §7
  - `getConstraints(platform)` — lookup helper
  - `validateTextLength(platform, text)` — returns `{ valid, error }`
  - `validateMedia(platform, media[])` — checks requirements, counts, size, MIME types
  - `validatePost(platform, text, media?)` — aggregates validation
  - `MediaValidationInput` interface — generic descriptor

### Verification
- `pnpm typecheck` passes.
- `pnpm lint` passes.
- Zero new dependencies.

---

## Centro-004 — Credentials Authentication

### Changes
#### Dependencies
- Installed `next-auth` (v5 beta), `@auth/prisma-adapter`, `argon2`, `zod`
- Added shadcn/ui-compatible Button, Input, Label, Card components
- Installed `tailwindcss-animate`

#### Schema
- Updated `prisma/schema.prisma`:
  - Renamed `User.accounts` → `User.socialAccounts`
  - Added NextAuth adapter models: `Account`, `Session`, `VerificationToken`
  - Added `emailVerified`, `image` to `User`
- Generated migration: `20260716032731_centro_004_auth_config`

#### Auth Configuration
- Created `src/lib/auth.ts`:
  - NextAuth v5 config with PrismaAdapter, JWT strategy, CredentialsProvider
  - `authorize` callback with zod validation + argon2 password verification
  - **Throttling:** >5 failed login attempts in 15 min → "Too many attempts. Try again in X minutes."
  - JWT/session callbacks inject `user.id` into session
- Created `src/app/api/auth/[...nextauth]/route.ts` — API route handlers

#### Validation
- Created `src/lib/validations/auth.ts`:
  - `loginSchema`, `registerSchema` (shared client+server)

#### Pages
- Created `src/app/(auth)/login/page.tsx` — client form, calls `signIn("credentials")`, redirects to `/dashboard`
- Created `src/app/(auth)/signup/page.tsx` — client form with name, email, password, confirm password
- Created `src/app/(auth)/signup/actions.ts` — server action:
  - Zod validate → check duplicate email → argon2 hash → create user
  - Sanitized errors: "An account with this email already exists."

#### Session Provider
- Created `src/components/providers/session-provider.tsx` — `"use client"` wrapper for `SessionProvider`
- Updated `src/app/layout.tsx` to use the wrapper

#### CSS / shadcn
- Fixed `src/app/globals.css` for Tailwind v3 + shadcn compatibility (HSL CSS variables)
- Updated `tailwind.config.ts` with shadcn color tokens and `tailwindcss-animate`

#### Development Seed
- Created `prisma/seed.ts` — idempotent dev user creation:
  - Email: `dev@centro.local`, Password: `password123`
- Added `prisma.seed` config to `package.json`
- Updated `README.md` with auth setup, seed instructions, and updated commands

#### Environment
- Updated `.env` and `.env.example`:
  - Added `AUTH_URL="http://localhost:3000"`
  - Added `AUTH_SECRET=""`

### Verification
- `pnpm typecheck` passes.
- `pnpm lint` passes.
- `pnpm prisma db seed` successfully creates dev user.
- Dev server smoke test:
  - `GET /login` → 200 ✅
  - `GET /signup` → 200 ✅
  - `GET /api/auth/providers` → 200 ✅
  - `GET /api/auth/session` → 200 ✅

---

## Branch State

```
73e7dc3 feature/Centro-004 [Centro-004] - Address auth review suggestions
a5e84d1 feature/Centro-004 [Centro-004] - Address auth review follow-up
4dbde56 feature/Centro-004 [Centro-004] - Address PR review feedback
165358c feature/Centro-004 [Centro-004] - Update HANDOFF.md with current project state
2b74e96 feature/Centro-004 [Centro-004] - Fix CSS/shadcn config and auth compatibility...
d9ad431 feature/Centro-004 [Centro-004] - Configure credentials authentication...
e230240 origin/develop    Merge pull request #7 from Rolfdood/feature/Centro-003
```

---

## Quick Commands

```bash
# Setup
pnpm install
docker compose up -d
pnpm prisma migrate dev
pnpm prisma db seed

# Dev server
pnpm dev

# Verification
pnpm typecheck
pnpm lint

# Database
pnpm prisma studio
```

---

## Dev Credentials

| Email | Password |
|---|---|
| `dev@centro.local` | `password123` |

---

## Next Steps

1. Merge PR #8 for `feature/Centro-004` into `develop`
2. Continue with next issues (Centro-005+)
