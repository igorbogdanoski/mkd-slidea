-- Sprint 13 (5.5) — Public scoreboard за квиз шампиони во МК
-- Idempotent. Aggregates leaderboard rows across PUBLIC quiz events
-- and exposes them via SECURITY DEFINER RPCs (no direct table access).

-- 1) Mark events as opt-in shareable to scoreboard (default OFF for privacy).
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_public_scoreboard BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_events_public_scoreboard
  ON public.events (is_public_scoreboard)
  WHERE is_public_scoreboard = TRUE;

-- 2) Top players (all-time across opted-in events).
CREATE OR REPLACE FUNCTION public.public_top_scorers(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  rank          BIGINT,
  username      TEXT,
  total_points  BIGINT,
  events_played BIGINT,
  best_score    INTEGER,
  last_played   TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH agg AS (
    SELECT
      l.username,
      SUM(l.points)::BIGINT       AS total_points,
      COUNT(DISTINCT l.event_id)  AS events_played,
      MAX(l.points)               AS best_score,
      MAX(l.last_updated)         AS last_played
    FROM public.leaderboard l
    JOIN public.events e ON e.id = l.event_id
    WHERE COALESCE(e.is_public_scoreboard, FALSE) = TRUE
      AND l.points > 0
      AND COALESCE(TRIM(l.username), '') <> ''
    GROUP BY l.username
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY total_points DESC, last_played DESC) AS rank,
    username,
    total_points,
    events_played,
    best_score,
    last_played
  FROM agg
  ORDER BY total_points DESC, last_played DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200));
$$;

REVOKE ALL ON FUNCTION public.public_top_scorers(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_top_scorers(INTEGER) TO anon, authenticated;

-- 3) Recent winning events (per-event MVP).
CREATE OR REPLACE FUNCTION public.public_recent_champions(p_limit INTEGER DEFAULT 30)
RETURNS TABLE (
  event_code    TEXT,
  event_title   TEXT,
  champion      TEXT,
  points        INTEGER,
  played_at     TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT
      e.code  AS event_code,
      e.title AS event_title,
      l.username,
      l.points,
      l.last_updated,
      ROW_NUMBER() OVER (PARTITION BY l.event_id ORDER BY l.points DESC, l.last_updated ASC) AS rn
    FROM public.leaderboard l
    JOIN public.events e ON e.id = l.event_id
    WHERE COALESCE(e.is_public_scoreboard, FALSE) = TRUE
      AND l.points > 0
      AND COALESCE(TRIM(l.username), '') <> ''
  )
  SELECT
    event_code,
    event_title,
    username AS champion,
    points,
    last_updated AS played_at
  FROM ranked
  WHERE rn = 1
  ORDER BY last_updated DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 30), 100));
$$;

REVOKE ALL ON FUNCTION public.public_recent_champions(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_recent_champions(INTEGER) TO anon, authenticated;

COMMENT ON COLUMN public.events.is_public_scoreboard IS
  'Sprint 5.5 — opt-in flag to expose this events leaderboard on the public /scoreboard page.';
