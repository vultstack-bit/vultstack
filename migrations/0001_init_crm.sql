-- ─────────────────────────────────────────────────────────────────────────────
-- Vultstack CRM — initial schema
-- Run this once against a fresh Supabase project (SQL Editor or
--   psql "$DATABASE_URL" -f migrations/0001_init_crm.sql).
--
-- Creates the CRM, social, email, and lead tables (all empty) plus their RLS
-- policies, helper functions, and the crm_activity compatibility view.
--
-- NOT created here (managed elsewhere):
--   • users, media, leads   → created automatically by Payload (push: true) on build
--   • auth.users            → provided by Supabase Auth
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

-- ── Tables ───────────────────────────────────────────────────────────────────

-- Agent/user profiles (1:1 with auth.users)
create table public.crm_profiles (
  id uuid not null primary key,
  email text not null,
  first_name text not null,
  last_name text not null,
  phone text,
  license text,
  role text not null default 'agent'::text,
  created_at timestamptz default now(),
  last_sign_in_at timestamptz,
  business_unit text not null default 'vultstack'::text,
  email_signature text
);

create table public.crm_clients (
  id uuid not null default gen_random_uuid() primary key,
  agent_id uuid,
  first_name text not null,
  last_name text not null default ''::text,
  email text,
  phone text,
  type text not null default 'Buyer'::text,
  notes text,
  created_at timestamptz default now(),
  assigned_agent_ids uuid[] default '{}'::uuid[],
  business_name text not null default ''::text,
  brokerage text not null default ''::text,
  license text not null default ''::text,
  cell_phone text not null default ''::text,
  address text not null default ''::text,
  city text not null default ''::text,
  state text not null default ''::text,
  zip text not null default ''::text,
  budget text default ''::text,
  asset_types text[] default '{}'::text[],
  size_range text default ''::text,
  last_touched_at timestamptz,
  extra_emails text[] default '{}'::text[],
  unsubscribed_at timestamptz,
  unsubscribe_token text default encode(gen_random_bytes(20), 'hex'::text) unique,
  tags text[] default '{}'::text[],
  lead_source text,
  business_unit text not null default 'vultstack'::text,
  lease_expiration_date date,
  review_requested_at timestamptz,
  birthday date,
  lxp_follow_up_days smallint,
  prospect_status text default 'new'::text,
  is_shared boolean not null default false
);

create table public.crm_client_activities (
  id uuid not null default gen_random_uuid() primary key,
  client_id uuid not null,
  agent_id uuid,
  type text not null,
  note text default ''::text,
  created_at timestamptz default now()
);

create table public.crm_deals (
  id uuid not null default gen_random_uuid() primary key,
  client text not null,
  client_email text,
  client_phone text,
  type text not null,
  property text,
  value numeric default 0,
  agent_id uuid,
  stage text not null default 'Prospect'::text,
  notes text,
  created_at timestamptz default now(),
  last_touch timestamptz default now(),
  client_id uuid,
  assigned_agent_ids uuid[] not null default '{}'::uuid[],
  business_unit text not null default 'vultstack'::text,
  lost_reason text
);

create table public.crm_deal_docs (
  id uuid not null default gen_random_uuid() primary key,
  deal_id uuid not null,
  name text not null,
  storage_path text not null,
  file_size bigint,
  file_type text,
  uploaded_by uuid,
  created_at timestamptz default now()
);

create table public.crm_deal_emails (
  id uuid not null default gen_random_uuid() primary key,
  deal_id uuid,
  direction text not null,
  from_email text,
  to_email text,
  subject text not null,
  body text,
  email_date date default current_date,
  created_at timestamptz default now(),
  gmail_message_id text,
  tracking_id uuid default gen_random_uuid(),
  opened_at timestamptz,
  open_count integer default 0,
  cc_emails text,
  gmail_thread_id text,
  rfc_message_id text,
  client_id uuid
);

create table public.crm_commissions (
  id uuid not null default gen_random_uuid() primary key,
  deal_id uuid not null,
  agent_id uuid,
  business_unit text not null default 'vultstack'::text,
  sale_price numeric(14,2) not null default 0,
  deal_type text,
  commission_rate numeric(6,4) not null default 3.0,
  gross_commission numeric(14,2),
  agent_split numeric(6,4) not null default 70.0,
  agent_net numeric(14,2),
  brokerage_net numeric(14,2),
  referral_fee numeric(14,2) not null default 0,
  referral_to text,
  transaction_fee numeric(14,2) not null default 0,
  status text not null default 'pending'::text,
  close_date date,
  paid_date date,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crm_tasks (
  id uuid not null default gen_random_uuid() primary key,
  client_id uuid not null,
  agent_id uuid not null,
  type text not null,
  title text not null default ''::text,
  due_date date not null,
  notes text not null default ''::text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  assigned_to uuid,
  deal_id uuid,
  status text not null default 'open'::text,
  priority text not null default 'normal'::text,
  created_by uuid,
  business_unit text not null default 'vultstack'::text,
  description text,
  updated_at timestamptz default now()
);

create table public.crm_campaigns (
  id uuid not null default gen_random_uuid() primary key,
  created_by uuid,
  name text not null,
  description text,
  type text not null,
  frequency text not null,
  status text not null default 'draft'::text,
  email_subject text,
  email_body text,
  sms_body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  send_date date,
  send_time text,
  sender_agent_id uuid,
  business_unit text not null default 'vultstack'::text,
  send_day_of_month smallint
);

create table public.crm_campaign_enrollments (
  id uuid not null default gen_random_uuid() primary key,
  campaign_id uuid not null,
  client_id uuid not null,
  enrolled_by uuid,
  enrolled_at timestamptz not null default now(),
  next_send_at timestamptz,
  active boolean not null default true,
  unique (campaign_id, client_id)
);

create table public.crm_campaign_sends (
  id uuid not null default gen_random_uuid() primary key,
  campaign_id uuid not null,
  client_id uuid not null,
  enrollment_id uuid not null,
  type text not null,
  status text not null,
  provider_id text,
  error_message text,
  sent_at timestamptz not null default now(),
  subject text,
  body_preview text,
  tracking_id uuid default gen_random_uuid(),
  opened_at timestamptz,
  open_count integer default 0
);

create table public.crm_action_plans (
  id uuid not null default gen_random_uuid() primary key,
  created_by uuid,
  name text not null,
  description text,
  trigger_type text not null default 'manual'::text,
  trigger_value text,
  status text not null default 'active'::text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completion_campaign_id uuid,
  business_unit text not null default 'vultstack'::text
);

create table public.crm_action_plan_steps (
  id uuid not null default gen_random_uuid() primary key,
  plan_id uuid,
  step_order integer not null,
  type text not null,
  delay_days integer not null default 0,
  subject text,
  body text not null,
  created_at timestamptz default now()
);

create table public.crm_action_plan_enrollments (
  id uuid not null default gen_random_uuid() primary key,
  plan_id uuid,
  client_id uuid,
  agent_id uuid,
  current_step integer default 0,
  next_step_at timestamptz,
  started_at timestamptz default now(),
  completed_at timestamptz,
  active boolean default true,
  unique (plan_id, client_id)
);

create table public.crm_smart_lists (
  id uuid not null default gen_random_uuid() primary key,
  created_by uuid,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  is_shared boolean default true,
  created_at timestamptz default now(),
  business_unit text not null default 'vultstack'::text
);

-- ── Email / lead ingestion ───────────────────────────────────────────────────
create table public.email_lead_imports (
  id uuid not null default gen_random_uuid() primary key,
  gmail_message_id text not null unique,
  gmail_connection_id uuid,
  source text not null,
  business_unit text not null,
  client_id uuid,
  raw_subject text,
  parsed_name text,
  parsed_email text,
  parsed_phone text,
  parsed_property text,
  parsed_message text,
  created_at timestamptz default now()
);

create table public.email_tracking_events (
  id uuid not null default gen_random_uuid() primary key,
  tracking_id text not null unique,
  campaign_id uuid,
  client_id uuid,
  agent_id uuid,
  event_type text not null,
  url text,
  occurred_at timestamptz default now(),
  ip text,
  user_agent text
);

create table public.gmail_connections (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid,
  gmail_email text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  email text,
  unique (user_id, gmail_email)
);

create table public.lead_routing_rules (
  id uuid not null default gen_random_uuid() primary key,
  business_unit text not null,
  source text,
  property_keyword text,
  assign_to_agent_id uuid,
  priority integer not null default 0,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- ── Social ───────────────────────────────────────────────────────────────────
create table public.social_connections (
  id uuid not null default gen_random_uuid() primary key,
  agent_id uuid,
  platform text not null,
  platform_account_id text not null,
  account_name text not null,
  account_handle text,
  account_avatar text,
  account_type text default 'profile'::text,
  access_token text not null,
  refresh_token text,
  token_secret text,
  expires_at timestamptz,
  page_id text,
  scopes text[] default '{}'::text[],
  is_active boolean default true,
  followers_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (agent_id, platform, platform_account_id)
);

create table public.social_posts (
  id uuid not null default gen_random_uuid() primary key,
  agent_id uuid,
  business_unit text default 'vultstack'::text,
  content text not null,
  media_urls text[] default '{}'::text[],
  media_types text[] default '{}'::text[],
  platforms text[] not null,
  connection_ids uuid[] default '{}'::uuid[],
  scheduled_at timestamptz,
  published_at timestamptz,
  status text default 'draft'::text,
  platform_post_ids jsonb default '{}'::jsonb,
  engagement jsonb default '{}'::jsonb,
  link_url text,
  hashtags text[] default '{}'::text[],
  first_comment text,
  tags text[] default '{}'::text[],
  approval_status text default 'approved'::text,
  approved_by uuid,
  internal_notes text,
  is_recurring boolean default false,
  recurrence_rule text,
  parent_post_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.social_analytics (
  id uuid not null default gen_random_uuid() primary key,
  connection_id uuid,
  date date not null,
  followers integer default 0,
  following integer default 0,
  posts_count integer default 0,
  engagement_rate numeric(5,2) default 0,
  impressions integer default 0,
  reach integer default 0,
  profile_views integer default 0,
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  created_at timestamptz default now(),
  unique (connection_id, date)
);

create table public.social_inbox (
  id uuid not null default gen_random_uuid() primary key,
  connection_id uuid,
  agent_id uuid,
  platform text not null,
  type text not null,
  from_name text,
  from_handle text,
  from_avatar text,
  from_platform_id text,
  content text,
  post_id text,
  post_content_preview text,
  platform_item_id text,
  replied_at timestamptz,
  reply_content text,
  assigned_to uuid,
  status text default 'open'::text,
  sentiment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (platform, platform_item_id)
);

create table public.social_saved_replies (
  id uuid not null default gen_random_uuid() primary key,
  agent_id uuid,
  name text not null,
  content text not null,
  platforms text[] default '{}'::text[],
  use_count integer default 0,
  created_at timestamptz default now()
);

-- ── Audit ────────────────────────────────────────────────────────────────────
create table public.audit_logs (
  id uuid not null default gen_random_uuid() primary key,
  actor_id uuid not null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

-- ── Helper functions ─────────────────────────────────────────────────────────
-- Defined after the tables they reference (SQL functions validate their body).
create or replace function public.crm_is_admin()
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.crm_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path to 'public', 'pg_catalog'
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Foreign keys ─────────────────────────────────────────────────────────────
alter table public.crm_profiles
  add constraint crm_profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;

alter table public.crm_clients
  add constraint crm_clients_agent_id_fkey foreign key (agent_id) references public.crm_profiles(id) on delete set null;

-- agent_id FK lets PostgREST resolve the agent embed on the crm_activity view
alter table public.crm_client_activities
  add constraint crm_client_activities_client_id_fkey foreign key (client_id) references public.crm_clients(id) on delete cascade,
  add constraint crm_client_activities_agent_id_fkey foreign key (agent_id) references public.crm_profiles(id) on delete set null;

alter table public.crm_deals
  add constraint crm_deals_client_id_fkey foreign key (client_id) references public.crm_clients(id) on delete set null,
  add constraint crm_deals_agent_id_fkey foreign key (agent_id) references public.crm_profiles(id);

alter table public.crm_deal_docs
  add constraint crm_deal_docs_deal_id_fkey foreign key (deal_id) references public.crm_deals(id) on delete cascade;

alter table public.crm_deal_emails
  add constraint crm_deal_emails_deal_id_fkey foreign key (deal_id) references public.crm_deals(id) on delete cascade,
  add constraint crm_deal_emails_client_id_fkey foreign key (client_id) references public.crm_clients(id) on delete cascade;

alter table public.crm_commissions
  add constraint crm_commissions_deal_id_fkey foreign key (deal_id) references public.crm_deals(id) on delete cascade,
  add constraint crm_commissions_agent_id_fkey foreign key (agent_id) references public.crm_profiles(id) on delete set null,
  add constraint crm_commissions_created_by_fkey foreign key (created_by) references public.crm_profiles(id) on delete set null;

alter table public.crm_tasks
  add constraint crm_tasks_client_id_fkey foreign key (client_id) references public.crm_clients(id) on delete cascade,
  add constraint crm_tasks_agent_id_fkey foreign key (agent_id) references public.crm_profiles(id) on delete cascade,
  add constraint crm_tasks_assigned_to_fkey foreign key (assigned_to) references public.crm_profiles(id) on delete set null,
  add constraint crm_tasks_created_by_fkey foreign key (created_by) references public.crm_profiles(id) on delete set null,
  add constraint crm_tasks_deal_id_fkey foreign key (deal_id) references public.crm_deals(id) on delete set null;

alter table public.crm_campaigns
  add constraint crm_campaigns_created_by_fkey foreign key (created_by) references public.crm_profiles(id) on delete set null,
  add constraint crm_campaigns_sender_agent_id_fkey foreign key (sender_agent_id) references public.crm_profiles(id) on delete set null;

alter table public.crm_campaign_enrollments
  add constraint crm_campaign_enrollments_campaign_id_fkey foreign key (campaign_id) references public.crm_campaigns(id) on delete cascade,
  add constraint crm_campaign_enrollments_client_id_fkey foreign key (client_id) references public.crm_clients(id) on delete cascade,
  add constraint crm_campaign_enrollments_enrolled_by_fkey foreign key (enrolled_by) references public.crm_profiles(id) on delete set null;

alter table public.crm_campaign_sends
  add constraint crm_campaign_sends_campaign_id_fkey foreign key (campaign_id) references public.crm_campaigns(id) on delete cascade,
  add constraint crm_campaign_sends_client_id_fkey foreign key (client_id) references public.crm_clients(id) on delete cascade,
  add constraint crm_campaign_sends_enrollment_id_fkey foreign key (enrollment_id) references public.crm_campaign_enrollments(id) on delete cascade;

alter table public.crm_action_plans
  add constraint crm_action_plans_created_by_fkey foreign key (created_by) references public.crm_profiles(id) on delete set null,
  add constraint crm_action_plans_completion_campaign_id_fkey foreign key (completion_campaign_id) references public.crm_campaigns(id) on delete set null;

alter table public.crm_action_plan_steps
  add constraint crm_action_plan_steps_plan_id_fkey foreign key (plan_id) references public.crm_action_plans(id) on delete cascade;

alter table public.crm_action_plan_enrollments
  add constraint crm_action_plan_enrollments_plan_id_fkey foreign key (plan_id) references public.crm_action_plans(id) on delete cascade,
  add constraint crm_action_plan_enrollments_client_id_fkey foreign key (client_id) references public.crm_clients(id) on delete cascade,
  add constraint crm_action_plan_enrollments_agent_id_fkey foreign key (agent_id) references public.crm_profiles(id) on delete set null;

alter table public.crm_smart_lists
  add constraint crm_smart_lists_created_by_fkey foreign key (created_by) references public.crm_profiles(id) on delete cascade;

alter table public.email_lead_imports
  add constraint email_lead_imports_client_id_fkey foreign key (client_id) references public.crm_clients(id) on delete set null;

alter table public.email_tracking_events
  add constraint email_tracking_events_campaign_id_fkey foreign key (campaign_id) references public.crm_campaigns(id) on delete set null,
  add constraint email_tracking_events_client_id_fkey foreign key (client_id) references public.crm_clients(id) on delete cascade,
  add constraint email_tracking_events_agent_id_fkey foreign key (agent_id) references public.crm_profiles(id) on delete set null;

alter table public.gmail_connections
  add constraint gmail_connections_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.lead_routing_rules
  add constraint lead_routing_rules_assign_to_agent_id_fkey foreign key (assign_to_agent_id) references public.crm_profiles(id) on delete cascade;

alter table public.social_connections
  add constraint social_connections_agent_id_fkey foreign key (agent_id) references public.crm_profiles(id) on delete cascade;

alter table public.social_posts
  add constraint social_posts_agent_id_fkey foreign key (agent_id) references public.crm_profiles(id) on delete cascade,
  add constraint social_posts_approved_by_fkey foreign key (approved_by) references public.crm_profiles(id),
  add constraint social_posts_parent_post_id_fkey foreign key (parent_post_id) references public.social_posts(id);

alter table public.social_analytics
  add constraint social_analytics_connection_id_fkey foreign key (connection_id) references public.social_connections(id) on delete cascade;

alter table public.social_inbox
  add constraint social_inbox_connection_id_fkey foreign key (connection_id) references public.social_connections(id) on delete cascade,
  add constraint social_inbox_agent_id_fkey foreign key (agent_id) references public.crm_profiles(id),
  add constraint social_inbox_assigned_to_fkey foreign key (assigned_to) references public.crm_profiles(id);

alter table public.social_saved_replies
  add constraint social_saved_replies_agent_id_fkey foreign key (agent_id) references public.crm_profiles(id) on delete cascade;

alter table public.audit_logs
  add constraint audit_logs_actor_id_fkey foreign key (actor_id) references public.crm_profiles(id) on delete set null;

-- ── Triggers ─────────────────────────────────────────────────────────────────
create trigger crm_commissions_updated_at
  before update on public.crm_commissions
  for each row execute function public.handle_updated_at();

-- ── crm_activity compatibility view ──────────────────────────────────────────
-- App code reads/writes `notes` (plural); the base column is `note`. This
-- auto-updatable view maps between them. security_invoker keeps the base
-- table's RLS in force for the querying user.
create view public.crm_activity
  with (security_invoker = true) as
  select id, client_id, agent_id, type, note as notes, created_at
  from public.crm_client_activities;

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.crm_profiles                enable row level security;
alter table public.crm_clients                 enable row level security;
alter table public.crm_client_activities       enable row level security;
alter table public.crm_deals                   enable row level security;
alter table public.crm_deal_docs               enable row level security;
alter table public.crm_deal_emails             enable row level security;
alter table public.crm_commissions             enable row level security;
alter table public.crm_tasks                   enable row level security;
alter table public.crm_campaigns               enable row level security;
alter table public.crm_campaign_enrollments    enable row level security;
alter table public.crm_campaign_sends          enable row level security;
alter table public.crm_action_plans            enable row level security;
alter table public.crm_action_plan_steps       enable row level security;
alter table public.crm_action_plan_enrollments enable row level security;
alter table public.crm_smart_lists             enable row level security;
alter table public.email_lead_imports          enable row level security;
alter table public.email_tracking_events       enable row level security;
alter table public.gmail_connections           enable row level security;
alter table public.lead_routing_rules          enable row level security;
alter table public.social_connections          enable row level security;
alter table public.social_posts                enable row level security;
alter table public.social_analytics            enable row level security;
alter table public.social_inbox                enable row level security;
alter table public.social_saved_replies        enable row level security;
alter table public.audit_logs                  enable row level security;

-- crm_profiles
create policy "Authenticated users can read all profiles" on public.crm_profiles
  for select using ((select auth.uid()) is not null);
create policy "Users can read own profile" on public.crm_profiles
  for select using ((select auth.uid()) = id);
create policy "Users can update own profile" on public.crm_profiles
  for update using ((select auth.uid()) = id);
create policy "Service can insert profiles" on public.crm_profiles
  for insert with check (auth.uid() = id);

-- crm_clients
create policy crm_clients_select on public.crm_clients
  for select using (
    ((select auth.uid()) = agent_id)
    or ((select auth.uid()) = any (assigned_agent_ids))
    or (is_shared = true)
    or crm_is_admin()
  );
create policy crm_clients_insert on public.crm_clients
  for insert with check (auth.uid() = agent_id);
create policy crm_clients_update on public.crm_clients
  for update using (((select auth.uid()) = agent_id) or crm_is_admin());
create policy crm_clients_delete on public.crm_clients
  for delete using (crm_is_admin());

-- crm_client_activities
create policy crm_client_activities_select on public.crm_client_activities
  for select to authenticated using (
    (agent_id = auth.uid())
    or (exists (select 1 from public.crm_profiles p where p.id = auth.uid() and p.role = 'admin'))
    or (exists (select 1 from public.crm_clients c
                where c.id = crm_client_activities.client_id
                  and (c.agent_id = auth.uid() or auth.uid() = any (c.assigned_agent_ids))))
  );
create policy crm_client_activities_insert on public.crm_client_activities
  for insert to authenticated with check (agent_id = auth.uid());

-- crm_deals
create policy "Agents see own deals" on public.crm_deals
  for select using (
    (agent_id = (select auth.uid()))
    or (exists (select 1 from public.crm_profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  );
create policy "Agents insert own deals" on public.crm_deals
  for insert with check (
    (agent_id = auth.uid())
    or (exists (select 1 from public.crm_profiles p where p.id = auth.uid() and p.role = 'admin'))
  );
create policy "Agents update own deals" on public.crm_deals
  for update using (
    (agent_id = (select auth.uid()))
    or (exists (select 1 from public.crm_profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  );
create policy "Admins delete deals" on public.crm_deals
  for delete using (
    exists (select 1 from public.crm_profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

-- crm_deal_docs (service-role only)
create policy crm_deal_docs_service_only on public.crm_deal_docs
  for all to anon, authenticated using (false);

-- crm_deal_emails
create policy "See emails for accessible deals" on public.crm_deal_emails
  for select using (
    exists (select 1 from public.crm_deals d
            where d.id = crm_deal_emails.deal_id
              and (d.agent_id = (select auth.uid())
                   or exists (select 1 from public.crm_profiles p where p.id = (select auth.uid()) and p.role = 'admin')))
  );
create policy "Insert emails for accessible deals" on public.crm_deal_emails
  for insert with check (
    exists (select 1 from public.crm_deals d
            where d.id = crm_deal_emails.deal_id
              and (d.agent_id = auth.uid()
                   or exists (select 1 from public.crm_profiles p where p.id = auth.uid() and p.role = 'admin')))
  );

-- crm_commissions (service-role only)
create policy crm_commissions_service_only on public.crm_commissions
  for all to anon, authenticated using (false);

-- crm_tasks (service role bypasses RLS; this allows full access where used)
create policy "service role full access" on public.crm_tasks
  for all using (true);

-- crm_campaigns
create policy "agents read campaigns" on public.crm_campaigns
  for select using (exists (select 1 from public.crm_profiles where crm_profiles.id = (select auth.uid())));
create policy "admins manage campaigns" on public.crm_campaigns
  for all using (
    exists (select 1 from public.crm_profiles where crm_profiles.id = (select auth.uid()) and crm_profiles.role = 'admin')
  );

-- crm_campaign_enrollments
create policy "auth users manage enrollments" on public.crm_campaign_enrollments
  for all using (exists (select 1 from public.crm_profiles where crm_profiles.id = (select auth.uid())));

-- crm_campaign_sends
create policy "auth users read sends" on public.crm_campaign_sends
  for select using (exists (select 1 from public.crm_profiles where crm_profiles.id = (select auth.uid())));
create policy "service role insert sends" on public.crm_campaign_sends
  for insert with check (true);

-- crm_action_plans / steps / enrollments (service-role only)
create policy crm_action_plans_service_only on public.crm_action_plans
  for all to anon, authenticated using (false);
create policy crm_action_plan_steps_service_only on public.crm_action_plan_steps
  for all to anon, authenticated using (false);
create policy crm_action_plan_enrollments_service_only on public.crm_action_plan_enrollments
  for all to anon, authenticated using (false);

-- crm_smart_lists (service-role only)
create policy crm_smart_lists_service_only on public.crm_smart_lists
  for all to anon, authenticated using (false);

-- email_lead_imports (service-role only)
create policy email_lead_imports_service_only on public.email_lead_imports
  for all to anon, authenticated using (false);

-- email_tracking_events
create policy "service role full access" on public.email_tracking_events
  for all using (true);

-- gmail_connections
create policy "Users manage own gmail connection" on public.gmail_connections
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- lead_routing_rules
create policy "service role full access" on public.lead_routing_rules
  for all using (true);

-- social_connections
create policy agent_own_connections on public.social_connections
  for all using (agent_id = auth.uid());

-- social_posts
create policy agent_own_posts on public.social_posts
  for all using (agent_id = auth.uid());

-- social_analytics
create policy agent_own_analytics on public.social_analytics
  for all using (
    connection_id in (select social_connections.id from public.social_connections where social_connections.agent_id = auth.uid())
  );

-- social_inbox
create policy agent_own_inbox on public.social_inbox
  for all using (agent_id = auth.uid());

-- social_saved_replies
create policy agent_own_saved_replies on public.social_saved_replies
  for all using (agent_id = auth.uid());

-- audit_logs
create policy admins_read_audit_logs on public.audit_logs
  for select using (
    exists (select 1 from public.crm_profiles where crm_profiles.id = auth.uid() and crm_profiles.role = 'admin')
  );

-- ── Grants (Supabase roles) ──────────────────────────────────────────────────
grant all on all tables in schema public to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
