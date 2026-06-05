# Vultstack CRM

A standalone CRM + campaign-management app for Vultstack, built with Next.js 15,
Payload CMS 3, and Supabase. The root route redirects to `/crm`.

## What's inside

- **Contacts** — manage clients/leads with tags, notes, lead source, and pipeline
- **Deals / pipeline** — track opportunities by stage
- **Tasks** — assignable to-dos tied to contacts and deals
- **Campaigns** — scheduled email/SMS campaigns with merge fields and tracking
- **Action plans** — automated multi-step drip sequences (new-contact, stage-change)
- **Commissions** — per-deal commission tracking and reporting
- **Social** — schedule/publish to Facebook, Instagram, LinkedIn, X, YouTube + AI captions
- **Email lead sync** — auto-import leads from a connected Gmail inbox

All CRM data is scoped to a single `business_unit = 'vultstack'`.

## Quick start

### Prerequisites
- Node.js 18+
- A Supabase project (Postgres + Auth)
- A Vercel account (deployment, cron, Blob storage)

### 1. Install
```bash
npm install
```

### 2. Environment variables
```bash
cp .env.example .env.local
```
Fill in the values — see `.env.example` for the full list. At minimum you need
Supabase keys, `DATABASE_URL`, `PAYLOAD_SECRET`, and `TOKEN_ENCRYPTION_KEY`.

### 3. Database
Run the migration in `migrations/0001_init_crm.sql` against your Supabase project
(SQL Editor, or `psql $DATABASE_URL -f migrations/0001_init_crm.sql`). Then:
```bash
npm run build
```
Payload (`push: true`) will create its own tables (`users`, `media`, `leads`) on build/start.

### 4. Dev server
```bash
npm run dev
```
Visit http://localhost:3000 → redirects to **/crm**.

### 5. First login
The CRM sign-in is at `/crm`. Create the admin user in Supabase Auth
(Dashboard → Authentication → Users) using the email set in `NEXT_PUBLIC_ADMIN_EMAIL`;
that account is granted the admin role on first login.

## Project structure
```
src/
├── app/
│   ├── page.tsx        # redirects to /crm
│   ├── crm/            # CRM app shell
│   └── api/            # CRM, campaigns, action-plans, social, cron, webhooks
├── collections/        # Payload collections (Users, Media, Leads)
├── components/crm/      # CRMApp + SocialMediaSection (main UI)
├── globals/            # Payload globals (SiteSettings)
└── lib/                # supabase, auth, email, social-publish, ratelimit, csrf
```

## Deployment
1. Push to GitHub and import in Vercel
2. Add all `.env.example` variables in the Vercel project settings
3. Cron jobs are defined in `vercel.json` (campaigns + action plans) — they require `CRON_SECRET`
4. Deploy

## Notes
- Replace `public/logo.png` with the Vultstack logo (used in the social preview mockup).
- Social posting and Gmail/Calendar sync require the matching OAuth app credentials.
- SMS sending is stubbed until Twilio is wired up.
