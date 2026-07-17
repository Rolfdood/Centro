# Centro Handoff

## Current Status

| Branch | Status |
|---|---|
| `feature/Centro-001` | Merged to `develop` |
| `feature/Centro-002` | Merged to `develop` |
| `feature/Centro-003` | Merged to `develop` |
| `feature/Centro-004` | Merged to `develop` |
| `feature/Centro-005` | Merged to `develop` |
| `feature/Centro-006` | Merged to `develop` |
| `feature/Centro-007` | Merged to `develop` |
| `feature/Centro-008` | In progress |

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

## Centro-007 - Mock Social Account APIs

### Changes
- Added authenticated `GET /api/accounts` to return the current user's social accounts in stable platform and handle order.
- Added authenticated `POST /api/accounts` for mocked account connection. It validates platform and handle input, generates a mock token server-side, and returns a sanitized account DTO.
- Added duplicate-connect handling for the user/platform/handle unique constraint with a sanitized `409` response.
- Added authenticated `DELETE /api/accounts/[id]`, scoped to the current user. It validates the route parameter, removes accounts without targets, and returns a clear conflict instead of deleting account history.
- Added structured field errors for invalid account payloads and route parameters, plus stricter cuid validation for account IDs.
- Added dependency-injected account route handlers and smoke coverage for list, connect, duplicate, invalid, missing, target-conflict, and successful-disconnect paths.
- Scheduling remains out of scope; a future scheduling phase must replace the target-history guard with scheduled-target cancellation.

### Files
- `src/app/api/accounts/route.ts`
- `src/app/api/accounts/[id]/route.ts`
- `src/lib/accounts/route-handlers.ts`
- `src/lib/validations/account.ts`
- `src/types/index.ts`
- `tests/account-api.test.ts`

### Verification
- The Centro-007 branch was rebased cleanly onto `origin/develop` after Centro-006 merged.
- `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass locally.

---

## Centro-008 - Idempotent Post APIs

### Changes
- Added authenticated `GET /api/posts`, returning the current user's posts in reverse creation order with sanitized list DTOs.
- Added authenticated `POST /api/posts`, which validates the idempotency key, base text, selected active accounts, platform text limits, and duplicate target accounts before creating durable draft post targets.
- Repeated idempotency keys return the original post for the owning user; a key owned by another user receives a generic conflict response.
- Added authenticated `GET /api/posts/[id]`, scoped to the current user and returning `404` without revealing another user's post.
- Added shared post mappers for stable list/detail DTOs, relation loading, and ISO date serialization.
- Day 2 hard cuts are enforced explicitly: media uploads and scheduling requests receive validation errors rather than being accepted and discarded.

### Files
- `src/app/api/posts/route.ts`
- `src/app/api/posts/[id]/route.ts`
- `src/lib/posts.ts`
- `src/lib/validations/post.ts`

### Verification
- The Centro-008 branch was rebased cleanly onto `origin/develop` after Centro-007 merged.
- Run before opening the PR: `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`.

---

## Branch State

```
364b652 feature/Centro-008 [Centro-008] - Implement idempotent post APIs
88e9c47 origin/develop [Centro-007] - Implement mock social account APIs
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

1. Review Centro-008 and open its PR when approved.
2. Continue with Day 3 publishing work after Centro-008 review is complete.
