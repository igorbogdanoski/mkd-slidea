-- ============================================================================
-- Realtime publication — the tables postgres_changes actually needs.
--
-- This had never been applied on the self-hosted instance: the
-- `supabase_realtime` publication existed but contained zero tables, so every
-- `.on('postgres_changes', …)` subscription in the app was silently dead.
--
-- Nothing looked broken because useEvent.js re-polls over REST every three
-- seconds as a fallback. That fallback was carrying the whole product. With
-- 416 participants it means roughly 139 queries a second, continuously, which
-- is exactly why load testing found supabase-db at 72% CPU while the realtime
-- container idled at 1%.
--
-- `votes` is deliberately absent. Nothing subscribes to it, so publishing it
-- is WAL decoding for no benefit.
--
-- After applying, restart realtime — it reads the publication at startup:
--   docker restart realtime-dev.supabase-realtime
--
-- Safe to run more than once.
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'polls'
  ) then
    alter publication supabase_realtime add table public.polls;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'options'
  ) then
    alter publication supabase_realtime add table public.options;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'events'
  ) then
    alter publication supabase_realtime add table public.events;
  end if;
end $$;

-- postgres_changes delivers a row only if the subscriber could SELECT it, and
-- filters on UPDATE need the full old row. Already set on this instance, but
-- asserted here so a rebuilt database does not lose it quietly.
alter table public.polls   replica identity full;
alter table public.options replica identity full;
alter table public.events  replica identity full;

select tablename as published_for_realtime
from pg_publication_tables
where pubname = 'supabase_realtime' and schemaname = 'public'
order by tablename;
