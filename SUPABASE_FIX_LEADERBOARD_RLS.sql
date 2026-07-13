-- ============================================================================
-- FIX — leaderboard RLS: FOR ALL USING(true) дозволуваше секој anon клиент
-- да пишува/брише произволни редови (туѓи резултати) за секој настан.
-- ----------------------------------------------------------------------------
-- add_points() станува единствениот пат за запис, како SECURITY DEFINER
-- функција (заобиколува RLS/grants безбедно, само за својата фиксна логика).
-- Директен INSERT/UPDATE/DELETE на leaderboard од anon/authenticated повеќе
-- не е дозволен — RLS без соодветна policy стандардно одбива.
-- ============================================================================

CREATE OR REPLACE FUNCTION add_points(p_event_id UUID, p_username TEXT, p_pts INTEGER)
RETURNS void AS $$
BEGIN
  INSERT INTO leaderboard (event_id, username, points)
  VALUES (p_event_id, p_username, p_pts)
  ON CONFLICT (event_id, username)
  DO UPDATE SET points = leaderboard.points + p_pts, last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION add_points(UUID, TEXT, INTEGER) TO anon, authenticated;

DROP POLICY IF EXISTS leaderboard_public_write ON public.leaderboard;

DROP POLICY IF EXISTS leaderboard_public_read ON public.leaderboard;
CREATE POLICY leaderboard_public_read ON public.leaderboard FOR SELECT USING (true);
