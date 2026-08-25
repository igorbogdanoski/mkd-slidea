-- ============================================================================
-- Anonymous read access is currently unbounded on votes, events and
-- survey_responses.
-- ============================================================================
-- Measured against production with the anon key that ships inside the public
-- JavaScript bundle — no login, no event code, no filter:
--
--   votes             296 rows   (username + answer_text, every event)
--   events            232 rows   (code, password, cohost_code, user_id)
--   survey_responses    3 rows
--   questions           0 rows   ← this table is correct already
--
-- So any visitor can dump every student's name beside the answers they gave,
-- in every school that has ever used the app, and can enumerate the join code
-- of every session. For a product used by minors that is a personal-data
-- problem, not a bug report.
--
-- The client already tries to avoid this: useEvent.js selects an explicit
-- column list with the comment "SECURITY: password & cohost_code are
-- excluded". A column list in the client is not access control — the same key
-- can be used to ask for the columns directly, which is how the numbers above
-- were obtained.
--
-- The policies say so outright. votes_owner_read begins `auth.role() = 'anon'
-- OR …`, which grants anon everything before the ownership test is reached,
-- and an older votes_public_read USING (true) may still sit alongside it —
-- permissive policies are OR-ed, so the loosest one wins.
--
-- ── What the application actually needs anonymously ────────────────────────
--   1. read an event by its code                    (to join)
--   2. read polls + options for that event          (to answer and to project)
--   3. insert a vote                                (to answer)
--   4. read back *its own* votes by session_id      (to know what it answered)
--   5. read answers for the activity being projected (word cloud, blanks)
--
-- Only 4 and 5 touch votes, and neither needs to see another event. Both are
-- served below by SECURITY DEFINER functions scoped to one session or one
-- poll, so the table itself can stop being readable.
--
-- Run this in one transaction. Verify with the checks at the bottom BEFORE
-- trusting it — a wrong policy here takes a live classroom down.
-- ============================================================================

BEGIN;

-- ── 1. votes: no direct anonymous reads ─────────────────────────────────────
DROP POLICY IF EXISTS votes_public_read  ON public.votes;
DROP POLICY IF EXISTS votes_public_write ON public.votes;
DROP POLICY IF EXISTS votes_owner_read   ON public.votes;

-- The host of the event owns its results, and so does an admin.
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

-- Answering stays open: a participant has no account to be checked against.
-- The one-vote-per-session rule is the UNIQUE(poll_id, session_id) constraint,
-- not a policy.
DROP POLICY IF EXISTS votes_public_insert ON public.votes;
CREATE POLICY votes_public_insert ON public.votes FOR INSERT WITH CHECK (true);

-- ── 2. survey_responses: the same shape ─────────────────────────────────────
DROP POLICY IF EXISTS survey_responses_public_read  ON public.survey_responses;
DROP POLICY IF EXISTS survey_responses_public_write ON public.survey_responses;

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
CREATE POLICY survey_responses_public_insert ON public.survey_responses FOR INSERT WITH CHECK (true);

-- ── 3. events: the row stays readable, two columns do not ───────────────────
-- Reading an event by code has to stay open — that is how a participant joins.
-- The password and the co-host code are a different matter: exposing the
-- password defeats the entire password feature, and exposing cohost_code hands
-- over presenter control.
--
-- Column privileges, not a policy, because this is about which columns a role
-- may ever see. Nothing in the app reads either column after the client change
-- that accompanies this file: the password is verified by
-- verify_event_password(), which runs SECURITY DEFINER and compares inside the
-- database, and the settings dialog stops pre-filling a stored password into
-- an input — a password that is never redisplayed cannot be read off a screen
-- either.
REVOKE SELECT (password, cohost_code) ON public.events FROM anon;
REVOKE SELECT (password, cohost_code) ON public.events FROM authenticated;

-- ── 4. The two narrow reads the participant still needs ─────────────────────

-- Which activities this browser has already answered, for this event only.
-- session_id is generated by the client and proves nothing, so this is not an
-- authorisation boundary — it is a scoping one. The value of closing the table
-- is that a caller must now guess a session id AND an event code to learn
-- anything, and still learns only which polls that session answered, never a
-- name or an answer.
CREATE OR REPLACE FUNCTION public.my_voted_polls(p_event_code TEXT, p_session_id TEXT)
RETURNS TABLE (poll_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.poll_id
  FROM public.votes v
  JOIN public.polls p  ON p.id = v.poll_id
  JOIN public.events e ON e.id = p.event_id
  WHERE e.code = UPPER(p_event_code)
    AND v.session_id = p_session_id;
$$;

GRANT EXECUTE ON FUNCTION public.my_voted_polls(TEXT, TEXT) TO anon, authenticated;

-- The answers to one activity, for the projector. Returns the answer text and
-- nothing that identifies who wrote it — a word cloud and a fill-in-the-blanks
-- panel need the words, never the names.
CREATE OR REPLACE FUNCTION public.poll_answer_texts(p_poll_id UUID)
RETURNS TABLE (answer_text TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.answer_text
  FROM public.votes v
  JOIN public.polls p ON p.id = v.poll_id
  WHERE v.poll_id = p_poll_id
    AND p.results_visible IS NOT FALSE;
$$;

GRANT EXECUTE ON FUNCTION public.poll_answer_texts(UUID) TO anon, authenticated;

-- Quiz standings for the projector: a display name and a score, no answers.
CREATE OR REPLACE FUNCTION public.event_leaderboard(p_event_code TEXT)
RETURNS TABLE (username TEXT, points BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(v.username, 'Анонимен') AS username,
         COUNT(*) FILTER (WHERE v.is_correct) AS points
  FROM public.votes v
  JOIN public.polls p  ON p.id = v.poll_id AND p.is_quiz
  JOIN public.events e ON e.id = p.event_id
  WHERE e.code = UPPER(p_event_code)
  GROUP BY COALESCE(v.session_id, v.username), COALESCE(v.username, 'Анонимен')
  ORDER BY points DESC;
$$;

GRANT EXECUTE ON FUNCTION public.event_leaderboard(TEXT) TO anon, authenticated;

COMMIT;

-- ============================================================================
-- Verify before trusting. With the ANON key, all three must now be refused or
-- empty, and the functions must still answer:
--
--   GET  /rest/v1/votes?select=username,answer_text&limit=1        → 0 rows
--   GET  /rest/v1/survey_responses?select=answers&limit=1          → 0 rows
--   GET  /rest/v1/events?select=password&limit=1                   → 42501
--   GET  /rest/v1/events?select=code,title&limit=1                 → 1 row
--   POST /rest/v1/rpc/my_voted_polls   {"p_event_code":"…","p_session_id":"…"}
--   POST /rest/v1/rpc/poll_answer_texts {"p_poll_id":"…"}
--
-- And with a HOST account: reading votes for an event they own must still work,
-- because that is what the CSV and PDF exports do.
-- ============================================================================
