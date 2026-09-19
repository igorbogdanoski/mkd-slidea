import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// The answer key for one activity, read through poll_answer_key() instead of off
// the poll row.
//
// It used to arrive with the poll: correct_answer, answer_explanation and blanks
// were ordinary columns on a table every participant has to read anyway, and the
// anon key that unlocks it ships inside the public bundle. So the key was on
// every phone in the room from the moment the activity loaded — before anyone
// answered, and before the host revealed anything.
//
// The function answers has_key whether or not the activity is revealed, because
// PresenterControls needs to know whether a "Покажи одговор" button belongs on
// screen at all, and it cannot be allowed to learn that by reading the key. The
// key itself is null until answer_revealed, which is the rule the UI already
// followed — now enforced where it cannot be stepped around.
//
// `revealed` is passed in rather than read from the result so the host flipping
// it mid-lesson triggers a refetch: polls.answer_revealed stays a readable
// column and already arrives on the realtime subscription every screen has.
export function useAnswerKey(pollId, revealed) {
  const [state, setState] = useState({ hasKey: false, key: null });

  useEffect(() => {
    if (!pollId) { setState({ hasKey: false, key: null }); return undefined; }
    let cancelled = false;
    supabase
      .rpc('poll_answer_key', { p_poll_id: pollId })
      .then(({ data, error }) => {
        if (cancelled || error) return;
        const row = Array.isArray(data) ? data[0] : data;
        setState({
          hasKey: !!row?.has_key,
          key: row?.revealed
            ? {
                correct_answer: row.correct_answer ?? null,
                answer_explanation: row.answer_explanation ?? null,
                blanks: Array.isArray(row.blanks) ? row.blanks : [],
              }
            : null,
        });
      });
    return () => { cancelled = true; };
  }, [pollId, revealed]);

  return state;
}

// The gaps of a fill-in-the-blanks activity, without the answers.
//
// FillBlanksInput needs the gap ids to know which field is which, and a width
// for each so the box does not spell out how long the answer is. Both come from
// participant_blanks(), which computes the width from the accepted answers
// inside the database and returns the same 6–16 character clamp the component
// used to apply itself. The accept[] arrays never leave.
export function useParticipantBlanks(pollId, enabled) {
  const [gaps, setGaps] = useState([]);

  useEffect(() => {
    if (!pollId || !enabled) { setGaps([]); return undefined; }
    let cancelled = false;
    supabase
      .rpc('participant_blanks', { p_poll_id: pollId })
      .then(({ data, error }) => {
        if (cancelled || error) return;
        setGaps(Array.isArray(data) ? data : []);
      });
    return () => { cancelled = true; };
  }, [pollId, enabled]);

  return gaps;
}
