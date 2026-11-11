# CreateAccess — Partnership Management

A full-stack Next.js (App Router) application for managing youth-organization partnerships. Built for the workflow described in the README updates: intake form → dashboard → partner detail → status workflow → admin form configurator.

## Stack

- **Next.js 16** (App Router) with React 19
- **TypeScript**
- **PostgreSQL** on [Neon](https://neon.tech) via **Prisma ORM**
- **Tailwind CSS** with a custom editorial theme (cream + ink + basketball-orange)
- **lucide-react** icons 

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs out of the box with rich mock data — no database required.

## Connecting Neon with Prisma

1. Create a database at [console.neon.tech](https://console.neon.tech)
2. Copy your connection string into `.env.local`:
   ```
   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
   ```
3. Generate Prisma client:
  ```bash
  npm run db:generate
  ```
4. Create and apply a migration:
   ```bash
  npm run db:migrate
   ```
5. Seed default statuses, users, partners, and notes:
  ```bash
  npm run db:seed
  ```
6. Restart `npm run dev`. The dashboard now shows a "Connected to Neon Postgres" indicator and writes to your database.

When `DATABASE_URL` is unset in local development, the app falls back to the in-memory mock store at `lib/mock-data.ts`. Production refuses to start without it.

`npm run db:migrate` (`prisma migrate dev`) is for creating migrations against a development database only. To apply committed migrations to the production database, run `npm run db:deploy` (`prisma migrate deploy`) with the production `DATABASE_URL`, before deploying code that needs them.

## Creating accounts

1. Copy `users.example.json` to `users.local.json` (gitignored) and fill in each person's email, name, role (`admin` or `staff`) and a temporary password (8+ characters).
2. Run `npm run users:create`. It uses the `DATABASE_URL` in `.env.local`; to create accounts on the live site, point that at the production database.
3. Delete `users.local.json`, then send each person their temporary password privately.

They sign in with their email and the temporary password, and must choose their own password before the rest of the app opens. Existing accounts are never changed.

## Checks

| Command | What it does |
|---|---|
| `npm run lint` | ESLint (Next.js rules) |
| `npm run typecheck` | TypeScript, no output |
| `npm test` | Unit tests (`tests/*.test.ts`, Node's built-in test runner) |
| `npm run build` | Production build |

GitHub Actions (`.github/workflows/ci.yml`) runs all four, plus `prisma validate`, on every pull request and push to `main`. Vercel builds a preview of every pull request; use it to check anything that needs the real database or email before merging. Dependabot opens weekly pull requests for dependency updates.

## Project structure

```
app/
  page.tsx                 — landing page
  dashboard/               — main dashboard with stats + filterable partner grid
  partners/                — directory list, detail, new, edit
  intake/                  — public-facing partnership inquiry form
  admin/                   — form configurator (sections, fields, visibility)
  api/                     — REST routes: partners, notes, intake
components/
  Nav.tsx, PartnerCard.tsx, StatusBadge.tsx,
  PartnerForm.tsx          — shared 5-section form used by new/edit/intake
  HardwareChecklist.tsx    — reusable equipment-inventory input
  FormFields.tsx           — TextField, TextareaField, SelectField primitives
lib/
  db.ts                    — Prisma client (returns mock mode when unconfigured)
  partners.ts              — data-access layer; switches DB ↔ mock automatically
  types.ts                 — Partner, PartnerStatus, HARDWARE_CHECKLIST, etc.
  mock-data.ts             — seed data + in-memory CRUD for prototype mode
db/
  seed.ts                  — seeds statuses, the admin/staff accounts and sample partners
prisma/
  schema.prisma            — the database schema (source of truth)
  migrations/              — every schema change, applied with `prisma migrate deploy`
tests/                     — unit tests (`npm test`)
```

## Features (mapping back to your README)

- **Section 3 — Program Info:** all fields captured (program structure, who they work with, how kids connect, recruitment, schedule, desired program type, recommendations preference, timeline, firm dates).
- **Section 4 — Tech + Space:** 3D tech, structured hardware checklist with quantities, computer/internet/space context, on-site assistance, accessibility limitations, broader tech context.
- **Public intake form** (`/intake`): all the new fields per README so staff can assess feasibility upfront.
- **Status workflow:** 7-status canonical list (`Pending Intake` → `New` → `In Conversation` → `Pending — CreateAccess 🏀` → `Pending — Partner` → `Active Partner` → `Not a Fit / Closed`) with one-click status changes on the partner detail page.
- **Conversation log:** each partner has notes with author + timestamp; staff can append from the detail view.
- **Partnership readiness assessment:** the detail view surfaces program type, timeline, hardware, space, and limitations side-by-side for fast meeting prep.
- **Account login:** staff and admin accounts sign in before opening the internal workspace; the nav stays hidden until a session exists.
- **Admin permissions:** admin accounts can open the form configurator and delete partners; staff can manage partners and notes.
- **Admin form configurator:** add/remove sections and fields, rename labels, toggle visibility, mark required (changes persist to localStorage in this prototype — wire to the `form_config` table for production).

## Programs and activities

How it's organized: **Programs → partner (e.g. Launchpad) → their programs → sessions → debrief.**
`/programs` shows one card per partner; a partner's page (`/programs/partners/[id]`, or `own` for
programs with no partner) lists debriefs due, current programs, **Add program** (pick from the program
library or name a new one) and the **Past programs** archive. "Move to past programs" on a program
archives it (status Completed); "Reopen program" brings it back. Each session has a **debrief**
(attendance, engagement 1–5, what went well, what to improve, changes for next time, highlights,
follow-ups); a session on or before today without one shows as "Debrief due".

**Jira tasks (read-only):** on a program's Edit page, set its Jira **epic key** (e.g. `CA-12`) or
**label** (e.g. `geo-club-2026`). The program page lists those tasks (open first), and each session
shows the open ones; every task links to Jira, where they're still edited. Needs `JIRA_BASE_URL`,
`JIRA_EMAIL` and `JIRA_API_TOKEN` (see `.env.example`); without them the page links to the search in
Jira instead. Results are cached for a minute.

**Demo data** (test databases only): `npm run db:seed-programs-demo` adds Launchpad Philly with
three past summers (Game Dev and 3D Design CAD tracks), last year's 3D Design and 3D Geospatial
clubs, this year's clubs in progress, and the 4th summer planned. Re-running replaces it;
`npm run db:seed-programs-demo -- --remove` takes it out. It refuses to run on Vercel or production.

- **Program** (`/programs`): something offered again and again, with its goals, ages and a usual activity plan.
- **Run**: one stretch of a program, usually with a partner (e.g. Launchpad → 3D Geospatial Club →
  2026–2027, or a one-day event). `/programs` groups runs by partner under Current and Past; marking a
  run Completed or Cancelled moves it to Past. A partner's page lists its runs.
- **Session**: one dated entry in a run, with the fields of the team's program doc (time, team arrival,
  location, description, audience, development and facilitation team, equipment, document links, a
  task checklist, misc notes). A new session starts with the program's usual activities and is filled in
  from the run's latest session (date moved on a week, slides/notes/title left empty, tasks unticked);
  its activities then change on their own, with a note per activity on how it was adapted.
- **Activity library** (`/activities`): filter by age, goal, type or text. **Make a twist** copies an
  activity into a new one linked back to it, so the original stays as it was.
- **Suggestions**: when planning, activities are suggested from the audience's ages and the program's
  goals (plain rules in `lib/programs.ts`, `suggestActivities`).
- Anyone signed in can add and edit; only admins can delete. An activity a run used can't be deleted.

## Email notifications

Emails go out through [Resend](https://resend.com):

| Email | When | Code |
|---|---|---|
| New intake | Right after someone submits the public intake form | `app/api/intake/route.ts` → `lib/notifications.ts` `notifyNewIntake` |

**Recipients:** every admin whose email is verified (Settings → verify email) plus the
comma-separated `NOTIFICATION_EMAILS`. Admin *usernames* are never used as addresses.

**Required settings (Vercel → Project → Settings → Environment Variables):**

- `DATABASE_URL` — production refuses to run without it (no silent mock-data fallback).
- `AUTH_SECRET` — at least 32 random characters (`openssl rand -hex 32`); signs login
  cookies. Production refuses to run without it. Changing it signs everyone out.
- `RESEND_API_KEY` — from the Resend account that owns the sending domain.
- `EMAIL_FROM` — e.g. `CreateAccess <notifications@yourdomain.org>`, on a domain verified in
  Resend (SPF/DKIM DNS records added). Resend's test sender `onboarding@resend.dev` only
  delivers to the Resend account owner, so until `EMAIL_FROM` is set, emails only reach that one address.
- `NOTIFICATION_EMAILS` — a shared inbox, so notifications survive staff changes.

The app uses no AI services.

**Checking it works:** `GET /api/health` shows which of these are set (true/false only).
`npm run test:email -- you@example.org` sends one test email with the current settings.
Failed sends are logged as `email send failed` in Vercel → Logs, and the Email Admins button
reports who it reached and who it didn't. `npm test` runs the unit tests.

## Next steps

- Wire admin configurator changes to the `form_config` table (schema is already there).
- Upgrade authentication hardening for production (the current app already uses a lightweight custom login/session flow).
- Add file uploads for partner documents (Neon doesn't store files; pair with S3 or Vercel Blob).
- Export to CSV.

## Form configuration & public intake (current)

- Admin-managed form rows persist to the `form_config` table as flat rows (`section_key`, `field_key`, `options` JSON). This allows adding/removing fields without DB schema changes.
- Fields may include `options.meta.public` to mark them public. Public fields cause the API to upsert an `intake:`-prefixed copy so the public intake can be rendered independently.
- The intake `GET` handler deduplicates by normalized `section:field_key` to ensure a single canonical row per field and avoid duplicate rendering.

See `docs/documentation.md` for details on challenges and fixes related to the form system.
