# CreateAccess — Partnership Management

A full-stack Next.js (App Router) application for managing youth-organization partnerships. Built for the workflow described in the README updates: intake form → dashboard → partner detail → status workflow → admin form configurator.

## Stack

- **Next.js 15** (App Router) with React 19
- **TypeScript**
- **PostgreSQL** via [Neon](https://neon.tech) serverless driver
- **Tailwind CSS** with a custom editorial theme (cream + ink + basketball-orange)
- **lucide-react** icons 

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs out of the box with rich mock data — no database required.

## Connecting Neon

1. Create a database at [console.neon.tech](https://console.neon.tech)
2. Copy your connection string into `.env.local`:
   ```
   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
   ```
3. Initialize the schema:
   ```bash
   npm run db:init
   ```
4. Restart `npm run dev`. The dashboard now shows a "Connected to Neon Postgres" indicator and writes to your database.

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
  db.ts                    — Neon client (returns null when unconfigured)
  partners.ts              — data-access layer; switches DB ↔ mock automatically
  types.ts                 — Partner, PartnerStatus, HARDWARE_CHECKLIST, etc.
  mock-data.ts             — seed data + in-memory CRUD for prototype mode
db/
  schema.sql               — PostgreSQL schema (partners, notes, statuses, form_config)
  init.ts                  — runs the schema against your Neon DB
```

## Features (mapping back to your README)

- **Section 3 — Program Info:** all fields captured (program structure, who they work with, how kids connect, recruitment, schedule, desired program type, recommendations preference, timeline, firm dates).
- **Section 4 — Tech + Space:** 3D tech, structured hardware checklist with quantities, computer/internet/space context, on-site assistance, accessibility limitations, broader tech context.
- **Public intake form** (`/intake`): all the new fields per README so staff can assess feasibility upfront.
- **Status workflow:** 6-state canonical list (`New` → `In Conversation` → `Pending — CreateAccess 🏀` → `Pending — Partner` → `Active Partner` → `Not a Fit / Closed`) with one-click status changes on the partner detail page.
- **Conversation log:** each partner has notes with author + timestamp; staff can append from the detail view.
- **Partnership readiness assessment:** the detail view surfaces program type, timeline, hardware, space, and limitations side-by-side for fast meeting prep.
- **Account login:** staff and admin accounts sign in before opening the internal workspace; the nav stays hidden until a session exists.
- **Admin permissions:** admin accounts can open the form configurator and delete partners; staff can manage partners and notes.
- **Admin form configurator:** add/remove sections and fields, rename labels, toggle visibility, mark required (changes persist to localStorage in this prototype — wire to the `form_config` table for production).

## Next steps

- Wire admin configurator changes to the `form_config` table (schema is already there).
- Add authentication (NextAuth or Clerk) — currently anyone can edit anything.
- Add file uploads for partner documents (Neon doesn't store files; pair with S3 or Vercel Blob).
- Email notifications when intake forms come in.
- Export to CSV.
