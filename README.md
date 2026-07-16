# Centro

Centro is a centralized social media control hub. This repository contains
the application and database infrastructure for the one-week demo slice.

## Prerequisites

- Node.js 20 or later
- pnpm 10 or later
- Docker (recommended) or a running PostgreSQL database

## Local setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start the PostgreSQL database with Docker:

   ```bash
   docker compose up -d
   ```

   This creates a container named `centro-postgres` on port `5433` with the
   default credentials already reflected in `.env.example`.

3. Copy the environment template:

   ```powershell
   Copy-Item .env.example .env
   ```

   The default `DATABASE_URL` in `.env.example` matches the Docker Compose service.
   Update it only if you use your own PostgreSQL instance. Never commit `.env`.

4. Apply database migrations:

   ```bash
   pnpm prisma migrate dev
   ```

5. Seed the development user:

   ```bash
   pnpm prisma db seed
   ```

   This creates a dev account you can use to sign in immediately:
   - **Email:** `dev@centro.local`
   - **Password:** `password123`

6. Start the development server:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Authentication

The app uses **NextAuth.js v4** with credentials-based authentication:

- **Sign up:** [http://localhost:3000/signup](http://localhost:3000/signup)
- **Sign in:** [http://localhost:3000/login](http://localhost:3000/login)
- Passwords are hashed with **argon2**
- Failed login attempts are throttled (>5 failures in 15 min blocks the account)

## Verification commands

Run these individually to confirm the health of the codebase:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm prisma generate
```

## Database commands

```bash
pnpm prisma migrate dev      # create / apply migrations
pnpm prisma db seed          # seed development data
pnpm prisma studio           # open database GUI
```

## Stopping the database

```bash
docker compose down
```

To remove the database volume as well:

```bash
docker compose down -v
```
