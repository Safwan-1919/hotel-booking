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
│   ├── web/          # Next.js frontend
│   └── backend/      # Express API server
├── packages/
├── package.json      # Workspace root
└── pnpm-workspace.yaml
```

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
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

For production, set `NEXT_PUBLIC_API_URL` to your deployed API URL.

## Deployment

The prototype is designed to run on Vercel with a managed Postgres database.

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Add a Postgres database (Storage → Create Database) and copy the `DATABASE_URL`.
4. In **Project Settings → Environment Variables**, add:
   - `DATABASE_URL`
   - `JWT_SECRET` (generate a strong random string)
   - `JWT_EXPIRES_IN`
   - `FRONTEND_URL` (your Vercel domain)
   - `NEXT_PUBLIC_API_URL` (your API deployment URL)
5. Add a **Build Command** override if needed and a **Postinstall** script to generate the Prisma client.
6. After the first deploy, run `prisma db push` against the production database to create tables, then seed if desired.

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