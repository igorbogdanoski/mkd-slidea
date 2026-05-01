-- Sprint 18 (6.4) — Top teachers leaderboard (Data Moat).
-- Idempotent. Aggregates events + leaderboard rows per teacher and exposes them
-- via a SECURITY DEFINER RPC so anonymous visitors can see the public ranking
-- without ever touching auth.users or profiles directly.
--
-- Privacy first: a teacher only appears in the ranking if they have AT LEAST
-- ONE event with `is_public_scoreboard = TRUE`. Their displayed name is the
-- public profile `name` (falls back to "Anonymous Teacher").

-- 1) Opt-in / display preference column on profiles.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS public_teacher BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_public_teacher
  ON public.profiles (public_teacher)
  WHERE public_teacher = TRUE;

-- 2) RPC — top teachers (all-time, across opted-in events).
CREATE OR REPLACE FUNCTION public.public_top_teachers(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  rank             BIGINT,
  teacher_name     TEXT,
  teacher_id       UUID,
  events_held      BIGINT,
  total_players    BIGINT,
  total_points     BIGINT,
  avg_points       NUMERIC,
  last_event_at    TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH agg AS (
    SELECT
      e.user_id                                    AS teacher_id,
      COUNT(DISTINCT e.id)                         AS events_held,
      COUNT(DISTINCT l.username)                   AS total_players,
      COALESCE(SUM(l.points), 0)::BIGINT           AS total_points,
      MAX(e.created_at)                            AS last_event_at
    FROM public.events e
    LEFT JOIN public.leaderboard l ON l.event_id = e.id
    WHERE COALESCE(e.is_public_scoreboard, FALSE) = TRUE
    GROUP BY e.user_id
    HAVING COUNT(DISTINCT e.id) > 0
  ),
  joined AS (
    SELECT
      a.teacher_id,
      COALESCE(NULLIF(TRIM(p.name), ''), 'Анонимен наставник') AS teacher_name,
      a.events_held,
      a.total_players,
      a.total_points,
      CASE WHEN a.total_players > 0
           THEN ROUND(a.total_points::NUMERIC / a.total_players, 1)
           ELSE 0 END                                          AS avg_points,
      a.last_event_at
    FROM agg a
    JOIN public.profiles p ON p.id = a.teacher_id
    WHERE COALESCE(p.public_teacher, FALSE) = TRUE
  )
  SELECT
    ROW_NUMBER() OVER (
      ORDER BY events_held DESC, total_players DESC, total_points DESC
    )                              AS rank,
    teacher_name,
    teacher_id,
    events_held,
    total_players,
    total_points,
    avg_points,
    last_event_at
  FROM joined
  ORDER BY events_held DESC, total_players DESC, total_points DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200));
$$;

REVOKE ALL ON FUNCTION public.public_top_teachers(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_top_teachers(INTEGER) TO anon, authenticated;

COMMENT ON COLUMN public.profiles.public_teacher IS
  'Sprint 6.4 — opt-in flag to appear on the public /scoreboard top teachers list.';

COMMENT ON FUNCTION public.public_top_teachers(INTEGER) IS
  'Sprint 6.4 — top teachers ranking; only profiles with public_teacher = TRUE
   AND at least one event flagged is_public_scoreboard appear.';
