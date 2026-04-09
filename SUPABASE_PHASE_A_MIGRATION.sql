-- ============================================================
-- MKD Slidea — Phase A migration
-- Run after SUPABASE_SETUP.sql on an existing project.
-- Fixes missing columns/tables and enables RLS without breaking public participation.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_event_by_code(p_code TEXT)
RETURNS SETOF public.events AS $$
  SELECT *
  FROM public.events
  WHERE UPPER(code) = UPPER(TRIM(LEADING '#' FROM p_code))
  ORDER BY created_at DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_event_by_code(TEXT) TO anon, authenticated;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS password TEXT,
  ADD COLUMN IF NOT EXISTS async_mode BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS async_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cohost_code TEXT,
  ADD COLUMN IF NOT EXISTS questions_moderation BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timer_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS results_visible BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS needs_moderation BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS survey_questions JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.options
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS public.votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES public.options(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  username TEXT,
  answer_text TEXT,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, session_id)
);

CREATE TABLE IF NOT EXISTS public.survey_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, session_id)
);

CREATE TABLE IF NOT EXISTS public.community_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Community',
  description TEXT,
  image_url TEXT,
  polls JSONB NOT NULL DEFAULT '[]'::jsonb,
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_code ON public.events(code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_cohost_code_unique ON public.events(cohost_code) WHERE cohost_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_polls_event_id ON public.polls(event_id);
CREATE INDEX IF NOT EXISTS idx_polls_position ON public.polls(event_id, position);
CREATE INDEX IF NOT EXISTS idx_options_poll_id ON public.options(poll_id);
CREATE INDEX IF NOT EXISTS idx_questions_event_id ON public.questions(event_id);
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON public.votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_session_id ON public.votes(session_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_poll_id ON public.survey_responses(poll_id);
CREATE INDEX IF NOT EXISTS idx_community_templates_public_created ON public.community_templates(is_public, created_at DESC);

UPDATE public.profiles
SET plan = 'free'
WHERE plan = 'basic' OR plan IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'Корисник'),
    'user',
    'free'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_public_read ON public.events;
CREATE POLICY events_public_read ON public.events FOR SELECT USING (true);
DROP POLICY IF EXISTS events_owner_write ON public.events;
CREATE POLICY events_owner_write ON public.events FOR ALL USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS polls_public_read ON public.polls;
CREATE POLICY polls_public_read ON public.polls FOR SELECT USING (true);
DROP POLICY IF EXISTS polls_owner_write ON public.polls;
CREATE POLICY polls_owner_write ON public.polls FOR ALL USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND (e.user_id = auth.uid() OR public.is_admin()))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND (e.user_id = auth.uid() OR public.is_admin()))
);

DROP POLICY IF EXISTS options_public_read ON public.options;
CREATE POLICY options_public_read ON public.options FOR SELECT USING (true);
DROP POLICY IF EXISTS options_owner_write ON public.options;
CREATE POLICY options_owner_write ON public.options FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = poll_id AND (e.user_id = auth.uid() OR public.is_admin())
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = poll_id AND (e.user_id = auth.uid() OR public.is_admin())
  )
);

DROP POLICY IF EXISTS questions_public_read ON public.questions;
CREATE POLICY questions_public_read ON public.questions FOR SELECT USING (true);
DROP POLICY IF EXISTS questions_public_insert ON public.questions;
CREATE POLICY questions_public_insert ON public.questions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS questions_owner_update ON public.questions;
CREATE POLICY questions_owner_update ON public.questions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND (e.user_id = auth.uid() OR public.is_admin()))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND (e.user_id = auth.uid() OR public.is_admin()))
);
DROP POLICY IF EXISTS questions_owner_delete ON public.questions;
CREATE POLICY questions_owner_delete ON public.questions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND (e.user_id = auth.uid() OR public.is_admin()))
);

DROP POLICY IF EXISTS reactions_public_read ON public.reactions;
CREATE POLICY reactions_public_read ON public.reactions FOR SELECT USING (true);
DROP POLICY IF EXISTS reactions_public_insert ON public.reactions;
CREATE POLICY reactions_public_insert ON public.reactions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS leaderboard_public_read ON public.leaderboard;
CREATE POLICY leaderboard_public_read ON public.leaderboard FOR SELECT USING (true);
DROP POLICY IF EXISTS leaderboard_public_write ON public.leaderboard;
CREATE POLICY leaderboard_public_write ON public.leaderboard FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS votes_public_read ON public.votes;
CREATE POLICY votes_public_read ON public.votes FOR SELECT USING (true);
DROP POLICY IF EXISTS votes_public_write ON public.votes;
CREATE POLICY votes_public_write ON public.votes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS survey_responses_public_read ON public.survey_responses;
CREATE POLICY survey_responses_public_read ON public.survey_responses FOR SELECT USING (true);
DROP POLICY IF EXISTS survey_responses_public_write ON public.survey_responses;
CREATE POLICY survey_responses_public_write ON public.survey_responses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS profiles_self_read ON public.profiles;
CREATE POLICY profiles_self_read ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin()) WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS community_templates_public_read ON public.community_templates;
CREATE POLICY community_templates_public_read ON public.community_templates
FOR SELECT USING (is_public = true OR user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS community_templates_authenticated_insert ON public.community_templates;
CREATE POLICY community_templates_authenticated_insert ON public.community_templates
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS community_templates_owner_update ON public.community_templates;
CREATE POLICY community_templates_owner_update ON public.community_templates
FOR UPDATE USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS community_templates_owner_delete ON public.community_templates;
CREATE POLICY community_templates_owner_delete ON public.community_templates
FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- One-time admin grant after first Google sign-in.
-- Replace the email if needed and run once.
UPDATE public.profiles
SET role = 'admin', plan = 'admin'
WHERE email = 'bogdanoskiigor@gmail.com';