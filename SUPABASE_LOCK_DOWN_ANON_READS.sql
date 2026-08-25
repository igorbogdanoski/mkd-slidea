-- ============================================================================
-- Closing unbounded anonymous reads.  APPLIED to production 2026-08-06.
-- ============================================================================
-- Measured before, with the anon key that ships inside the public JavaScript
-- bundle — no login, no event code, no filter:
--
--   votes             296 rows   username + answer_text, every event
--   events            232 rows   including password and cohost_code
--   survey_responses    3 rows
--   search_logs         all      a user id beside the phrases they searched
--
-- So any visitor could read every student's name beside the answers they gave,
-- across every school that has used the app, and enumerate the join code of
-- every session.
--
-- The client already tried to prevent it: useEvent.js selects an explicit
-- column list with the comment "SECURITY: password & cohost_code are
-- excluded". A column list in the client is not access control — the same key
-- can ask for those columns directly, which is how the numbers above were
-- obtained.
--
-- ── The two holes, and why one of them was easy to miss ────────────────────
-- Permissive policies are OR-ed, so the loosest one decides.
--
--   votes_owner_read      … OR (auth.role() = 'anon')   ← everyone
--   votes_select_auth     auth.uid() IS NOT NULL        ← every signed-in
--                                                          account, i.e. any
--                                                          teacher reading any
--                                                          other school
--
-- survey_responses carried the same pair. The `auth.role() = 'anon'` clause is
-- the one worth remembering, because the obvious way to test for it does not
-- find it: `SET ROLE anon` in psql does not populate request.jwt.claims, so
-- auth.role() returns nothing and the policy looks closed. It only shows
-- itself through a real request carrying a real anon token.
--
-- ── What the application actually needs anonymously ────────────────────────
--   1. read an event by its code                     (to join)
--   2. read polls + options for that event           (to answer, to project)
--   3. insert a vote                                 (to answer)
--   4. read back its own votes                       (to know what it answered)
--   5. read answers for the activity being projected (word cloud, blanks,
--                                                     survey, scoreboard)
--
-- Only 4 and 5 touch votes, and neither needs another event or a name. Both
-- are served by SECURITY DEFINER functions scoped to one session or one
-- activity, so the tables stop being readable.
-- ============================================================================

BEGIN;

-- ── 1. The scoped reads the participant and the projector need ─────────────

-- Which activities this browser has answered, in this event only. session_id
-- is client-generated and proves nothing, so this is scoping rather than
-- authorisation — but a caller must now know both a session id and an event
-- code, and still learns only poll ids, never a name or an answer.
CREATE OR REPLACE FUNCTION public.my_voted_polls(p_event_code TEXT, p_session_id TEXT)
RETURNS TABLE (poll_id UUID)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  SELECT v.poll_id
  FROM public.votes v
  JOIN public.polls p  ON p.id = v.poll_id
  JOIN public.events e ON e.id = p.event_id
  WHERE e.code = UPPER(p_event_code)
    AND v.session_id = p_session_id;
$fn$;
GRANT EXECUTE ON FUNCTION public.my_voted_polls(TEXT, TEXT) TO anon, authenticated;

-- Answers to one activity, for the wall. The words, never the names.
CREATE OR REPLACE FUNCTION public.poll_answer_texts(p_poll_id UUID)
RETURNS TABLE (answer_text TEXT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  SELECT v.answer_text
  FROM public.votes v
  JOIN public.polls p ON p.id = v.poll_id
  WHERE v.poll_id = p_poll_id
    AND p.results_visible IS NOT FALSE;
$fn$;
GRANT EXECUTE ON FUNCTION public.poll_answer_texts(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.poll_survey_answers(p_poll_id UUID)
RETURNS TABLE (answers JSONB)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  SELECT s.answers
  FROM public.survey_responses s
  JOIN public.polls p ON p.id = s.poll_id
  WHERE s.poll_id = p_poll_id
    AND p.results_visible IS NOT FALSE;
$fn$;
GRANT EXECUTE ON FUNCTION public.poll_survey_answers(UUID) TO anon, authenticated;

-- Quiz standings. A name and a score — which is what the board shows anyway —
-- aggregated in the database instead of shipping every vote row to a public
-- page and grouping it in the browser.
CREATE OR REPLACE FUNCTION public.event_leaderboard(p_event_code TEXT)
RETURNS TABLE (username TEXT, points BIGINT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  SELECT COALESCE(v.username, 'Анонимен') AS username,
         COUNT(*) FILTER (WHERE v.is_correct) AS points
  FROM public.votes v
  JOIN public.polls p  ON p.id = v.poll_id AND p.is_quiz
  JOIN public.events e ON e.id = p.event_id
  WHERE e.code = UPPER(p_event_code)
  GROUP BY COALESCE(v.session_id, v.username), COALESCE(v.username, 'Анонимен')
  ORDER BY points DESC;
$fn$;
GRANT EXECUTE ON FUNCTION public.event_leaderboard(TEXT) TO anon, authenticated;

-- The scoreboard's own ordering: most correct first, ties to whoever got there
-- first.
CREATE OR REPLACE FUNCTION public.event_scoreboard(p_event_code TEXT)
RETURNS TABLE (username TEXT, correct BIGINT, total BIGINT, first_at TIMESTAMPTZ)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  SELECT COALESCE(v.username, 'Анонимен') AS username,
         COUNT(*) FILTER (WHERE v.is_correct) AS correct,
         COUNT(*) AS total,
         MIN(v.created_at) AS first_at
  FROM public.votes v
  JOIN public.polls p  ON p.id = v.poll_id AND p.is_quiz
  JOIN public.events e ON e.id = p.event_id
  WHERE e.code = UPPER(p_event_code)
  GROUP BY COALESCE(v.session_id, v.username), COALESCE(v.username, 'Анонимен')
  ORDER BY correct DESC, first_at ASC;
$fn$;
GRANT EXECUTE ON FUNCTION public.event_scoreboard(TEXT) TO anon, authenticated;

-- For the embedded widget, which knows a poll id but not an event code.
CREATE OR REPLACE FUNCTION public.has_voted(p_poll_id UUID, p_session_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.votes v
    WHERE v.poll_id = p_poll_id AND v.session_id = p_session_id
  );
$fn$;
GRANT EXECUTE ON FUNCTION public.has_voted(UUID, TEXT) TO anon, authenticated;

-- The owner showing the co-host code they hand out. Joining with that code
-- already goes through find_event_by_cohost_code(); this is the other side, so
-- the column itself can be closed.
CREATE OR REPLACE FUNCTION public.my_event_cohost_code(p_event_id UUID)
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  SELECT e.cohost_code
  FROM public.events e
  WHERE e.id = p_event_id
    AND e.user_id IS NOT NULL
    AND e.user_id = auth.uid();
$fn$;
GRANT EXECUTE ON FUNCTION public.my_event_cohost_code(UUID) TO authenticated;

-- ── 2. votes and survey_responses: the owner only ──────────────────────────
DROP POLICY IF EXISTS votes_owner_read  ON public.votes;
DROP POLICY IF EXISTS votes_select_auth ON public.votes;
DROP POLICY IF EXISTS votes_public_read ON public.votes;

CREATE POLICY votes_owner_read ON public.votes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = votes.poll_id
      AND e.user_id IS NOT NULL
      AND e.user_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS survey_responses_select_auth ON public.survey_responses;
DROP POLICY IF EXISTS survey_responses_public_read ON public.survey_responses;
DROP POLICY IF EXISTS survey_responses_owner_read  ON public.survey_responses;
DROP POLICY IF EXISTS "host read"                  ON public.survey_responses;

CREATE POLICY survey_responses_owner_read ON public.survey_responses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.events e ON e.id = p.event_id
    WHERE p.id = survey_responses.poll_id
      AND e.user_id IS NOT NULL
      AND e.user_id = auth.uid()
  )
  OR public.is_admin()
);

-- Answering stays open — a participant has no account to check against. One
-- vote per session is the UNIQUE(poll_id, session_id) constraint, not a policy.
DROP POLICY IF EXISTS votes_public_insert ON public.votes;
CREATE POLICY votes_public_insert ON public.votes FOR INSERT WITH CHECK (true);

-- ── 3. search_logs ─────────────────────────────────────────────────────────
-- Named service_read_all but written USING (true), which is everyone. It links
-- a user id to the phrases that person searched for. Nothing reads it from a
-- browser; the service role bypasses row security anyway.
DROP POLICY IF EXISTS service_read_all ON public.search_logs;
CREATE POLICY search_logs_owner_read ON public.search_logs FOR SELECT USING (
  (user_id IS NOT NULL AND user_id = auth.uid()) OR public.is_admin()
);

-- ── 4. events: rows stay readable, two columns do not ──────────────────────
-- !! ROLLED BACK on 2026-08-06, pending a deploy. Run this section again once
-- !! the client that names its columns is live. See the note at the end.
-- Joining by code has to keep working, so the row policy stays `true`. The
-- password defeats its own feature if it can be read, and the co-host code
-- hands over host control of someone else's session.
--
-- REVOKE SELECT (col) does nothing while a table-wide SELECT grant stands —
-- the per-column entries are derived from the table grant, so revoking a
-- column alone is a silent no-op. That was the first attempt here and it
-- changed nothing. The table grant has to go first, then SELECT is granted
-- back column by column.
REVOKE SELECT ON public.events FROM anon;
REVOKE SELECT ON public.events FROM authenticated;

GRANT SELECT (
  id, code, title, user_id, org_id, created_at, starts_at, ended_at,
  active_poll_id, is_locked, has_password, allow_multiple_votes,
  async_mode, async_deadline, questions_moderation, is_public_scoreboard,
  brand_color, brand_font, logo_url, cover_image, reminded, timer_ends_at
) ON public.events TO anon, authenticated;

-- Consequence worth knowing: `select=*` on events now fails for both roles
-- with 42501 rather than quietly omitting the columns. Every client read of
-- events must name its columns. useHostSession.js was the only one using `*`.

-- anon held UPDATE, DELETE and TRUNCATE on events. Row security kept them from
-- doing damage, but a grant nobody needs only matters on the day row security
-- is misconfigured. Creating an event requires an account.
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, INSERT ON public.events FROM anon;

COMMIT;

-- ============================================================================
-- Verified after applying, with the anon key:
--
--   votes?select=username,answer_text        →  0 rows
--   survey_responses?select=answers          →  0 rows
--   search_logs?select=query,user_id         →  0 rows
--   events?select=password                   →  401 / 42501
--   events?select=cohost_code                →  401 / 42501
--   events?select=*                          →  401 / 42501
--   events?select=id,code,title&code=eq.…    →  1 row      (joining still works)
--   polls, options, reactions                →  readable   (answering still works)
--   all seven functions above                →  200
--
-- And with a simulated host token: the event's owner sees their own 5 votes;
-- an unrelated authenticated account sees 0.
--
-- ── Section 4 was rolled back the same day ─────────────────────────────────
-- The database was tightened ahead of the client that depends on it, which is
-- the wrong order. The deployed bundle still issues `select=*` on events, and
-- a revoked column makes that fail outright with 42501 instead of omitting the
-- column — so the host screen stopped loading its event at all, in production,
-- until the grant was restored:
--
--   GRANT SELECT ON public.events TO anon, authenticated;
--
-- It costs nothing measurable while it stands: password and cohost_code are
-- NULL on all 232 events, so there is nothing in either column to read. votes,
-- survey_responses and search_logs stayed closed throughout — the deployed
-- client only degrades on those (an empty scoreboard, a blank survey panel)
-- rather than failing.
--
-- Re-apply section 4 after deploying. The right order is: deploy the client
-- that names its columns, confirm the host screen loads, then revoke.
-- ============================================================================
