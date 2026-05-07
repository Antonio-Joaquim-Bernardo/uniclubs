# UniClubs

UniClubs is a modern web system for managing university clubs, members, events and event registrations.
It was built with a professional dashboard feel, a PostgreSQL-first data model and server actions for fast flows.

## Main Features

- Create and list clubs
- View club details
- Register members
- Join members to clubs
- Create events
- Register members in events
- List events by club and by status
- Administrative dashboards for the whole platform, a club and a member
- Demo fallback when `DATABASE_URL` is not configured

## Tech Stack

- Next.js 16 App Router
- React 19
- PostgreSQL
- TypeScript
- Tailwind CSS v4
- GitHub for version control

## Routes

- `/` - Home
- `/clubes` - Club list and club creation
- `/clubes/[id]` - Club detail
- `/eventos` - Event list and quick registration
- `/inscricoes` - Registration list and registration form
- `/membros` - Member list and member creation
- `/dashboard` - Dashboard hub
- `/dashboard/dashboard_admin` - Global administrative dashboard
- `/dashboard/dashboard_admin_clube` - Club admin dashboard
- `/dashboard/dashboard_membro` - Member dashboard

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file at the project root:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. Import the SQL schema:

- Use [`bd_uniclubs.sql`](./bd_uniclubs.sql) to create the tables and demo data.
- The file already includes the full schema used by the app.

4. Start the development server:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Useful Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Database Notes

- `src/lib/repository.ts` reads from PostgreSQL when `DATABASE_URL` exists.
- If the database is not available, the app automatically falls back to an in-memory demo mode.
- The SQL schema matches the field names used by the repository and server actions.

## Project Structure

- `src/app` - Routes, pages, metadata and loading states
- `src/components` - Shared UI and forms
- `src/lib` - Data access, server actions and helpers

## Evaluation Checklist

- Clean code and clear component separation
- Correct Next.js App Router usage
- Relational PostgreSQL schema
- GitHub-friendly structure and README
- Professional UI and reusable design system

