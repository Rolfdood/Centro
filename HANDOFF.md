# Centro Handoff

## Current Status

| Branch | Status |
|---|---|
| `feature/Centro-001` | Merged to `develop` |
| `feature/Centro-002` | Merged to `develop` |
| `feature/Centro-003` | Merged to `develop` |
| `feature/Centro-004` | Merged to `develop` |
| `feature/Centro-005` | Merged to `develop` |
| `feature/Centro-006` | In progress |

---

## Centro-001 to Centro-004 Summary

- Established the Next.js 14, TypeScript, Tailwind, Prisma, and PostgreSQL project foundation, including local setup, environment documentation, and a Prisma singleton.
- Implemented the complete Prisma domain schema and migration for users, social accounts, posts, targets, media, analytics, and AI generations.
- Added the client-safe platform constraints module as the single source of truth for supported platforms, character limits, and media validation.
- Delivered credentials authentication with Auth.js, Prisma adapter models, registration and login flows, shared auth validation, throttled failed logins, session user IDs, development seed credentials, and shadcn-compatible UI primitives.

---

## Centro-005 - API Contracts and Validation Schemas

### Changes
- Added shared Zod request validation schemas:
  - `connectAccountSchema` validates platform and non-empty account handle input.
  - `createPostSchema` validates UUID idempotency keys, base text, targets, media, optional scheduling, and prevents duplicate account selection.
  - Missing target variants are normalized to the base text before persistence.
  - `validationErrorSchema` lives in `validations/common.ts` and defines the sanitized API validation-error response shape.
- Added client-safe, strict Zod response DTOs for social accounts, media assets, post targets, post lists, and post detail responses.
- Added inferred TypeScript types for every request and response contract in `src/types/index.ts`.
- Added `getAuthenticatedUser()` in `src/lib/auth.ts` so route handlers can consistently resolve the authenticated user ID without exposing session details.
- Added a GitHub Actions CI workflow for pull requests targeting `develop` and pushes to `develop`; it provisions PostgreSQL, installs dependencies from the frozen lockfile, generates Prisma Client, applies migrations, and runs lint, typecheck, and build.

### Files
- `src/lib/auth.ts`
- `src/lib/validations/account.ts`
- `src/lib/validations/common.ts`
- `src/lib/validations/post.ts`
- `src/types/index.ts`
- `.github/workflows/ci.yml`

### Verification
- The Centro-005 branch was rebased cleanly onto `origin/develop` after Centro-004 merged.
- `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass locally.

---

## Centro-006 - Mock Platform Adapters and Registry

### Changes
- Extended the platform adapter contract with Zod-validated publish, auth-check, and analytics response types.
- Added `BaseMockAdapter`, shared by the five platform adapters for X, Facebook, Instagram, TikTok, and LinkedIn.
- Mock publishing validates against the shared platform constraints, simulates approximately 600ms latency, returns deterministic mock URLs, and caches successful results by target and idempotency key.
- Added deterministic failure simulation through `MOCK_FAILURE_RATE`, account-status auth checks, and deterministic analytics that grow over time from each target ID.
- Documented that mock auth uses `RECONNECT_REQUIRED` as its inactive state; token expiry simulation belongs to real adapters.
- Added the platform adapter registry. It returns only mock adapters while `MOCK_PLATFORMS=true` and fails clearly when real adapters are not configured.
- Added adapter smoke coverage for idempotent publishing, constraint failures, auth status, failure-rate parsing, and deterministic analytics.

### Files
- `src/lib/platforms/types.ts`
- `src/lib/platforms/registry.ts`
- `src/lib/platforms/adapters/baseMock.ts`
- `src/lib/platforms/adapters/mockX.ts`
- `src/lib/platforms/adapters/mockFacebook.ts`
- `src/lib/platforms/adapters/mockInstagram.ts`
- `src/lib/platforms/adapters/mockTikTok.ts`
- `src/lib/platforms/adapters/mockLinkedIn.ts`
- `tests/platform-adapters.test.ts`

### Verification
- The Centro-006 branch was rebased cleanly onto `origin/develop` after Centro-005 merged.
- `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass locally.

---

## Branch State

```
2ef1928 feature/Centro-006 [Centro-006] - Implement mock platform adapters and registry
06bf912 origin/develop [Centro-005] - Define API contracts and validation schemas
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
pnpm build

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

1. Review Centro-006 and open its PR when approved.
2. Continue with Centro-007 after Centro-006 review is complete.
