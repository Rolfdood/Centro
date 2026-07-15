# Centro

Centro is a centralized social media control hub. This repository currently contains
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

   This creates a container named `centro-postgres` on port `5432` with the
default credentials already reflected in `.env.example`.

3. Copy the environment template:

   ```powershell
   Copy-Item .env.example .env
   ```

   The default `DATABASE_URL` in `.env.example` matches the Docker Compose service.
   Update it only if you use your own PostgreSQL instance. Never commit `.env`.

4. Generate the Prisma Client:

   ```bash
   pnpm prisma generate --allow-no-models
   ```

5. Start the development server:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Verification commands

Run these individually to confirm the health of the codebase:

```bash
pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm prisma generate --allow-no-models
```

The initial Prisma schema deliberately contains only the PostgreSQL datasource and
client generator. The application models and first migration are introduced with the
next database feature.

## Stopping the database

```bash
docker compose down
```

To remove the database volume as well:

```bash
docker compose down -v
```
