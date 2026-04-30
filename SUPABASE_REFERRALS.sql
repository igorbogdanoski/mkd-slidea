-- Sprint 12 (5.4) — Referral system: "Покани наставник, добиј 1 месец Pro"
-- Idempotent migration. Safe to re-run.

-- 1) Extend profiles with referral fields.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pro_until   TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- 2) Referrals ledger.
CREATE TABLE IF NOT EXISTS public.referrals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending', -- pending | rewarded
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rewarded_at  TIMESTAMPTZ,
  CONSTRAINT referrals_referred_unique UNIQUE (referred_id),
  CONSTRAINT referrals_no_self CHECK (referrer_id <> referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status   ON public.referrals(status);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Referrer reads own referrals" ON public.referrals;
CREATE POLICY "Referrer reads own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- INSERT/UPDATE handled exclusively via SECURITY DEFINER functions below.

-- 3) Claim referral after sign-up. Called by client once with referrer profile id.
CREATE OR REPLACE FUNCTION public.claim_referral(p_referrer UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL OR p_referrer IS NULL OR v_user = p_referrer THEN
    RETURN FALSE;
  END IF;

  -- Referrer must exist as a profile.
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_referrer) THEN
    RETURN FALSE;
  END IF;

  -- Only set referred_by once.
  UPDATE public.profiles
     SET referred_by = p_referrer
   WHERE id = v_user
     AND referred_by IS NULL;

  -- Insert pending referral (idempotent via UNIQUE on referred_id).
  INSERT INTO public.referrals (referrer_id, referred_id, status)
  VALUES (p_referrer, v_user, 'pending')
  ON CONFLICT (referred_id) DO NOTHING;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_referral(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_referral(UUID) TO authenticated;

-- 4) Reward trigger — when referred user creates their FIRST event,
--    grant referrer +30 days of Pro (extends existing pro_until if future).
CREATE OR REPLACE FUNCTION public.handle_referral_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_count INTEGER;
  v_ref RECORD;
  v_base TIMESTAMPTZ;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only act on the FIRST event by this user.
  SELECT COUNT(*) INTO v_event_count
    FROM public.events
   WHERE user_id = NEW.user_id;

  IF v_event_count <> 1 THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_ref
    FROM public.referrals
   WHERE referred_id = NEW.user_id
     AND status = 'pending'
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Extend pro_until from max(now, current pro_until) by 30 days.
  SELECT GREATEST(NOW(), COALESCE(pro_until, NOW()))
    INTO v_base
    FROM public.profiles
   WHERE id = v_ref.referrer_id;

  UPDATE public.profiles
     SET pro_until = v_base + INTERVAL '30 days'
   WHERE id = v_ref.referrer_id;

  UPDATE public.referrals
     SET status = 'rewarded',
         rewarded_at = NOW()
   WHERE id = v_ref.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_events_referral_reward ON public.events;
CREATE TRIGGER trg_events_referral_reward
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_referral_reward();

-- 5) Referral stats helper for the dashboard UI.
CREATE OR REPLACE FUNCTION public.my_referral_stats()
RETURNS TABLE (
  total      INTEGER,
  rewarded   INTEGER,
  pending    INTEGER,
  pro_until  TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE((SELECT COUNT(*)::INT FROM public.referrals WHERE referrer_id = auth.uid()), 0)                              AS total,
    COALESCE((SELECT COUNT(*)::INT FROM public.referrals WHERE referrer_id = auth.uid() AND status = 'rewarded'), 0)      AS rewarded,
    COALESCE((SELECT COUNT(*)::INT FROM public.referrals WHERE referrer_id = auth.uid() AND status = 'pending'),  0)      AS pending,
    (SELECT pro_until FROM public.profiles WHERE id = auth.uid())                                                          AS pro_until;
$$;

REVOKE ALL ON FUNCTION public.my_referral_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_referral_stats() TO authenticated;

COMMENT ON TABLE public.referrals IS
  'Sprint 5.4 — referral ledger. Reward = 30 days Pro to referrer on referred user''s first event.';
