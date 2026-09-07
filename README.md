# Hotel Booking System

A full-stack hotel booking and property management prototype. Frontend built with Next.js, backend with Node.js + Express + Prisma, and PostgreSQL for data storage.

## Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Radix UI, Recharts
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: JWT-based authentication with bcrypt password hashing
- **Package Manager**: pnpm (workspace)

## Project Structure

```
hotel-booking-system/
├── apps/
│   ├── web/          # Next.js frontend + API routes (Next.js Route Handlers)
│   └── backend/      # Original Express server (kept for reference)
├── packages/
├── package.json      # Workspace root
└── pnpm-workspace.yaml
```

The Next.js app (`apps/web`) hosts both the UI and the backend API as Route Handlers under `app/api/*`. The original Express implementation in `apps/backend` is kept for reference.

## Features

- Role-based authentication (Admin / Manager / Receptionist)
- Room and room type management
- Guest profiles with stay history
- Booking lifecycle (pending → confirmed → checked-in → checked-out)
- Payments and refunds tracking
- Extra services (spa, restaurant, laundry, etc.)
- Room inspection and housekeeping status
- Dashboard with key metrics and charts
- Audit logs for sensitive operations

## Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment variables
cp apps/backend/.env.example apps/backend/.env
# edit DATABASE_URL if needed

# 3. Set up the database
pnpm db:push          # apply Prisma schema
pnpm db:seed          # load sample data (optional)

# 4. Run both apps in development
pnpm dev:all
```

Frontend runs on `http://localhost:3000` and backend on `http://localhost:5000`.

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Run backend in watch mode |
| `pnpm dev:web` | Run frontend in dev mode |
| `pnpm dev:all` | Run both frontend and backend in parallel |
| `pnpm build` | Build all workspaces |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:seed` | Seed sample data |
| `pnpm db:reset` | Reset database (destructive) |

## Environment Variables

### Backend (`apps/backend/.env`)

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (`apps/web/.env.local`)

```
# Leave empty to use same-origin /api routes.
# Set only if hosting the API on a different origin.
# NEXT_PUBLIC_API_URL=https://api.example.com/api
```

For production, set `NEXT_PUBLIC_API_URL` to your deployed API URL.

## Deployment

The prototype is designed to run as a single Next.js deployment on Vercel, backed by Vercel Postgres.

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. In **Project Settings → General**, set **Root Directory** to `apps/web`.
4. In **Storage**, create a **Postgres** database and copy the provided `DATABASE_URL`.
5. In **Project Settings → Environment Variables**, add:
   - `DATABASE_URL` (from the Postgres database)
   - `JWT_SECRET` (generate a strong random string)
   - `JWT_EXPIRES_IN` (e.g. `7d`)
6. Deploy. The build runs `prisma generate` automatically via `postinstall`.
7. After the first deploy, run Prisma migrations against the production database. The easiest way is from a local terminal:

   ```bash
   # set DATABASE_URL to the Vercel Postgres URL and run:
   pnpm --filter @hotel/web db:push
   pnpm --filter @hotel/web db:seed   # optional, loads sample data
   ```

API and frontend are served from the same origin, so no cross-origin or CORS configuration is required.

## Default Seeded Users (after `pnpm db:seed`)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hotel.com | admin123 |
| Manager | manager@hotel.com | manager123 |
| Receptionist | receptionist@hotel.com | reception123 |

> Change these credentials before deploying to any public environment.

## Notes

- This repository is a prototype intended for evaluation and demonstration.
- Code in this repository is provided as-is for the project owner.