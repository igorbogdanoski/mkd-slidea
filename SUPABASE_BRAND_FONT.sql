-- 3.7 Custom branding (Pro): adds brand_font column to events.
-- Safe to re-run; uses IF NOT EXISTS.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS brand_font TEXT;

COMMENT ON COLUMN public.events.brand_font IS
  'Brand font family stack used in Presenter (system fonts only, no external requests).';
