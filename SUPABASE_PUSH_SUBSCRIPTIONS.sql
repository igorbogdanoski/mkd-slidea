-- Web Push Subscriptions
-- Run in Supabase SQL Editor → New query → Execute
-- Table stores browser push subscriptions linked to event sessions.

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  event_code  text,                -- NULL = global; non-null = subscribed while in a specific event
  created_at  timestamptz not null default now()
);

-- Index for fast lookup by event code (used by push-send.js)
create index if not exists push_subscriptions_event_code_idx on push_subscriptions(event_code);

-- RLS: only service role can read/write (push-subscribe.js uses service key)
alter table push_subscriptions enable row level security;

-- No public access at all — all operations go through API with service key
create policy "service_only" on push_subscriptions
  as restrictive
  for all
  to authenticated, anon
  using (false);
