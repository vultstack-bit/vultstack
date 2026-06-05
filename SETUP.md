# Vultstack CRM — setup checklist

Step-by-step to stand up a brand-new, isolated instance for Vultstack. Items
marked **(you)** require your own accounts/credentials.

## 1. Supabase project **(you)**
1. Create a new Supabase project at https://supabase.com/dashboard (this is
   separate from the Fair Oaks project — Vultstack gets its own database + auth).
2. Grab these from **Project Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` / publishable key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. From **Project Settings → Database → Connection string → URI** copy the
   Postgres URL → `DATABASE_URL` (use the connection-pooler URI for Vercel).

## 2. Run the database migration
Open **SQL Editor** in the new Supabase project, paste the contents of
`migrations/0001_init_crm.sql`, and run it. (Or `psql "$DATABASE_URL" -f migrations/0001_init_crm.sql`.)

This creates all CRM/social/email tables (empty) with RLS. It does **not**
create `users`, `media`, or `leads` — Payload creates those automatically on the
first build (`push: true`).

## 3. Environment variables
1. `cp .env.example .env.local` and fill in values.
2. Required minimum: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `PAYLOAD_SECRET` (`openssl rand -base64 32`),
   `TOKEN_ENCRYPTION_KEY` (`openssl rand -hex 32`), `NEXT_PUBLIC_ADMIN_EMAIL`.
3. Set the cron/webhook secrets: `CRON_SECRET`, `INTERNAL_SYNC_SECRET`, `WEBHOOK_SECRET`.
4. Branding vars are already defaulted to Vultstack; adjust contact phone/email/address as needed.

## 4. Service API keys **(you)**
- **Resend** (email): create an account, verify the `vultstack.com` sending domain,
  create an API key → `RESEND_API_KEY`. Set `FROM_EMAIL` / `CRM_FROM_EMAIL` to a
  verified address.
- **Anthropic** (AI captions): API key → `ANTHROPIC_API_KEY`.
- Optional: Upstash Redis (rate limiting), Vercel Blob (`BLOB_READ_WRITE_TOKEN`,
  auto-set by Vercel), Google OAuth (Gmail/Calendar), social OAuth apps per platform.

## 5. First build + admin user
1. `npm install && npm run build` (Payload creates `users`/`media`/`leads`).
2. In Supabase **Authentication → Users**, create a user whose email matches
   `NEXT_PUBLIC_ADMIN_EMAIL`. That account is granted the admin role on first
   CRM login.
3. `npm run dev` → http://localhost:3000 redirects to **/crm** → sign in.

## 6. Branding asset
- Replace `public/logo.png` with the real Vultstack logo (currently a placeholder
  copied from the old brand). Used in the social-preview mockup.

## 7. Deploy to Vercel **(you)**
1. Push this repo to GitHub, import into a **new** Vercel project.
2. Add the Vercel domain (e.g. `vultstack.com`); update `NEXT_PUBLIC_SERVER_URL` /
   `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_BASE_URL` to match.
3. Add every `.env.example` variable in **Project Settings → Environment Variables**.
4. Cron jobs (campaigns + action plans) are defined in `vercel.json` and use
   `CRON_SECRET`.
5. If you connect social accounts, set each platform's OAuth redirect URL to
   `https://<your-domain>/api/auth/social/<platform>/callback`.

## Notes
- All CRM data is scoped to `business_unit = 'vultstack'` (set by default in the schema).
- SMS sending is stubbed until Twilio is wired up.
