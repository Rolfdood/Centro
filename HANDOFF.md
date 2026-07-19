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
| `feature/Centro-008` | Merged to `develop` |
| `feature/Centro-009` | In progress |

---

## Centro-001 to Centro-004 Summary

- Established the Next.js 14, TypeScript, Tailwind, Prisma, and PostgreSQL project foundation, including local setup, environment documentation, and a Prisma singleton.
- Implemented the complete Prisma domain schema and migration for users, social accounts, posts, targets, media, analytics, and AI generations.
- Added the client-safe platform constraints module as the single source of truth for supported platforms, character limits, and media validation.
- Delivered credentials authentication with Auth.js, Prisma adapter models, registration and login flows, shared auth validation, throttled failed logins, session user IDs, development seed credentials, and shadcn-compatible UI primitives.

---

## Centro-005 to Centro-008 Summary

- Established shared Zod request/response contracts, authenticated-user resolution, and CI verification for API work.
- Added the mock platform adapter boundary for all five supported platforms, including deterministic publishing, failure simulation through `MOCK_FAILURE_RATE`, auth checks, and analytics fixtures.
- Delivered authenticated mock social-account APIs for connecting, listing, and safely disconnecting user-owned accounts.
- Delivered idempotent post creation, list, and detail APIs with durable draft targets, user scoping, shared DTO mapping, and explicit Day 2 hard-cut validation for media uploads and scheduling.

---

## Centro-009 - Idempotent Publish Service and Target Status Handling

### Changes
- Added a server-only publish service that loads a user-owned post with its targets, media, and social accounts before publishing.
- Publishes only `DRAFT` targets through the platform adapter registry, transitioning each target through `PUBLISHING` to `PUBLISHED` or `FAILED`.
- Atomically claims the parent post with `DRAFT` to `PUBLISHING` before loading targets, so a concurrent publish request cannot deliver the same target twice.
- Persists target publish timestamps, URLs, sanitized errors, and attempt counts; previously published targets are idempotent no-ops.
- Checks account availability before publishing and marks accounts `RECONNECT_REQUIRED` when authentication is no longer active or expires during publishing.
- Added one shared parent-status derivation function for `PUBLISHED`, `PARTIALLY_FAILED`, and `FAILED` post outcomes.
- Added publisher smoke coverage for successful and all-failed publishing, inactive accounts, adapter exceptions, attempts, concurrent publish requests, and repeated publish no-op behavior.

### Files
- `src/lib/posts/publisher.ts`
- `tests/publisher.test.ts`
- `package.json`

### Verification
- Publisher smoke tests pass, along with the existing platform, account, and post API smoke suites.
- TypeScript verification and linting for the publisher implementation and tests pass.

---

## Branch State

```
4e04f9b feature/Centro-009 [Centro-009] - Correct Centro-008 handoff status
3a7a075 origin/develop [Centro-008] - Implement idempotent post APIs
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

1. Review Centro-009 and open its PR when approved.
2. Stack the publish-now route work on top of Centro-009 after review.
