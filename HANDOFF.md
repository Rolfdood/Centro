# Centro Handoff

## Current Status

| Issue | Status | Branch | PR Status |
|---|---|---|---|
| Centro-001 | Complete & merged | `feature/Centro-001` | Merged to `develop` |
| Centro-002 | Complete & merged | `feature/Centro-002` | Merged to `develop` |
| Centro-003 | Complete & merged | `feature/Centro-003` | Merged to `develop` |
| Centro-004 | Complete & merged | `feature/Centro-004` | Merged to `develop` |
| Centro-005 | Complete, ready for review | `feature/Centro-005` | Draft PR #13 |

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
  - `createPostSchema` validates UUID idempotency keys, required base text, at least one target, and prevents duplicate account selection.
  - `validationErrorSchema` defines the sanitized API validation-error response shape.
- Added client-safe, Zod-validated response DTOs for social accounts, media assets, post targets, post lists, and post detail responses.
- Added inferred TypeScript types for every request and response contract in `src/types/index.ts`.
- Added `getAuthenticatedUser()` in `src/lib/auth.ts` so route handlers can consistently resolve the authenticated user ID without exposing session details.
- Added a GitHub Actions CI workflow for pull requests targeting `develop` and pushes to `develop`; it provisions PostgreSQL, installs dependencies from the frozen lockfile, generates Prisma Client, applies migrations, and runs lint, typecheck, and build.

### Files
- `src/lib/auth.ts`
- `src/lib/validations/account.ts`
- `src/lib/validations/post.ts`
- `src/types/index.ts`
- `.github/workflows/ci.yml`

### Verification
- The Centro-005 branch was rebased cleanly onto `origin/develop` after Centro-004 merged.
- `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass locally.

---

## Branch State

```
3311e32 feature/Centro-005 [Centro-005] - Define API contracts and validation schemas
f14c9a5 origin/develop [Centro-004] - Configure authentication and UI foundation
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

1. Review Centro-005 and open its PR when approved.
2. Continue with Centro-006 after Centro-005 review is complete.
