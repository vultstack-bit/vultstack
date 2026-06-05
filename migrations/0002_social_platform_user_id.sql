-- Store the app-scoped Facebook/Instagram user id on each social connection so
-- the Meta Deauthorize and Data Deletion callbacks can map a `signed_request`
-- (which only carries the FB user id) back to the rows that must be removed.
alter table public.social_connections
  add column if not exists platform_user_id text;

create index if not exists social_connections_platform_user_id_idx
  on public.social_connections (platform_user_id);
