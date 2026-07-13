-- ============================================================================
-- FIX — options realtime subscription беше без filter, па секој глас во СЕКОЈА
-- сесија на целата апликација будеше секој отворен клиент (Host/Presenter/
-- Participant), предизвикувајќи целосен refetch кај сите. Ова е веројатната
-- причина за практичниот таван од ~60-80 учесници (наместо декларираните 200).
-- ----------------------------------------------------------------------------
-- `options` нема директна `event_id` колона (само `poll_id`), а Supabase
-- Realtime filter-ите поддржуваат само еднаквост на директна колона — не join.
-- Решение: denormalized `event_id` на options, auto-populated преку trigger
-- (транспарентно за сите постоечки INSERT повици низ кодот).
-- ============================================================================

ALTER TABLE public.options ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- Backfill постоечки редови
UPDATE public.options o
SET event_id = p.event_id
FROM public.polls p
WHERE p.id = o.poll_id AND o.event_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_options_event_id ON public.options(event_id);

CREATE OR REPLACE FUNCTION public.set_option_event_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_id IS NULL THEN
    SELECT event_id INTO NEW.event_id FROM public.polls WHERE id = NEW.poll_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_set_option_event_id ON public.options;
CREATE TRIGGER trg_set_option_event_id
  BEFORE INSERT ON public.options
  FOR EACH ROW EXECUTE FUNCTION public.set_option_event_id();
