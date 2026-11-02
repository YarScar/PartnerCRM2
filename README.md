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

When `DATABASE_URL` is unset, the app transparently falls back to the in-memory mock store at `lib/mock-data.ts`.

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
  schema.sql               — PostgreSQL schema (partners, notes, statuses, form_config)
  init.ts                  — Prisma setup helper (status upserts)
  seed.ts                  — seeds default status labels/colors
prisma/
  schema.prisma            — Prisma models mapped to existing SQL tables
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

## Email notifications

Two emails go out through [Resend](https://resend.com):

| Email | When | Code |
|---|---|---|
| New intake | Right after someone submits the public intake form | `app/api/intake/route.ts` → `lib/notifications.ts` `notifyNewIntake` |
| Weekly digest | Mondays 09:00 UTC (Vercel Cron, `vercel.json`), or **Email Admins** on `/admin/digest` | `app/api/digest/send/route.ts` → `sendWeeklyDigest` |

**Recipients:** every admin whose email is verified (Settings → verify email) plus the
comma-separated `NOTIFICATION_EMAILS`. Admin *usernames* are never used as addresses.

**Required settings (Vercel → Project → Settings → Environment Variables):**

- `DATABASE_URL` — production refuses to run without it (no silent mock-data fallback).
- `AUTH_SECRET` — at least 32 random characters (`openssl rand -hex 32`); signs login
  cookies. Production refuses to run without it. Changing it signs everyone out.
- `RESEND_API_KEY` — from the Resend account that owns the sending domain.
- `EMAIL_FROM` — e.g. `CreateAccess <notifications@yourdomain.org>`, on a domain verified in
  Resend (SPF/DKIM DNS records added). Resend's test sender `onboarding@resend.dev` only
  delivers to the Resend account owner, so production refuses to send without `EMAIL_FROM`.
- `NOTIFICATION_EMAILS` — a shared inbox, so notifications survive staff changes.
- `CRON_SECRET` — any long random string; Vercel sends it to the cron route automatically.
  Without it the scheduled digest returns 401.

The digest is built straight from the database (`lib/digest.ts` `renderDigest`): new
inquiries, recently updated partners, timelines in the next 30 days, and active partners
with no note in 14 days. The app uses no AI services.

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
