import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import confetti from 'canvas-confetti';
import { useEvent } from '../hooks/useEvent';
import Presenter from '../views/Presenter';
import Participant from '../views/Participant';
import { useEventStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { queueVote, flushQueue, scheduleFlush } from '../lib/offlineQueue';
import { answerLimit } from '../lib/answerLimits';
import { Lock, Eye, EyeOff } from 'lucide-react';
import PoweredByBadge from './PoweredByBadge';

const isLockErrorMsg = (msg) => String(msg || '').includes('lock:sb-');

// What will be written to the votes row, derived from the submitted value
// alone. Pure and network-free on purpose: the row has to be claimed before
// any tally moves, so this cannot depend on a call that has already counted
// something. The branches in handleVote produce the same strings — this stays
// in step with them, and voteAnswer.test.js holds the two together.
//
// It returns the id of the chosen option, NOT whether that option is right.
// Grading is claim_vote_graded's job, done against the key in the database:
// options.is_correct is readable by anyone holding the public anon key, so a
// verdict computed here was a verdict the caller supplied — and the scoreboard
// counted it either way.
export function deriveAnswer(val, poll) {
  // Fill-in-the-blanks arrives as { blankId: answer, … } and must be matched
  // before the numeric branch, which would read the object as an option index.
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    return { answerText: JSON.stringify(val).slice(0, 2000), optionId: null };
  }
  if (typeof val === 'string') {
    return { answerText: val, optionId: null };
  }
  if (Array.isArray(val)) {
    // Ranking: the whole ordering, most preferred first. Not graded — a Borda
    // ordering has no single right answer to check against.
    return {
      answerText: val.map((i) => poll?.options?.[i]?.text).filter(Boolean).join(' > '),
      optionId: null,
    };
  }
  const option = poll?.options?.[val];
  // Thrown before anything is counted, so a bad index costs nothing.
  if (!option) throw new Error('Invalid option selected');
  return { answerText: option.text, optionId: option.id };
}

// The aggregate increments one answer needs — the same four branches
// handleVote walks, but pure and network-free.
//
// handleVote cannot build this list itself in time: it claims the vote first,
// and when the claim is what fails (the phone has no signal) nothing has been
// pushed yet, so the queued item carried an empty `ops` and the replay wrote
// the votes row while options.votes never moved. The answer was recorded and
// counted nowhere — invisible on the projector, missing from the CSV.
//
// The text branch trims with answerLimit(type), matching what vote() sends to
// /api/vote-text. It used to be a flat 300 here, which cut an open answer
// queued offline to a third of the length the same answer submitted online.
export function voteOpsFor(val, poll) {
  // Fill-in-the-blanks: the responses are read, nothing is counted.
  if (val && typeof val === 'object' && !Array.isArray(val)) return [];
  if (typeof val === 'string') {
    const clean = val.replace(/<[^>]+>/g, '').trim().slice(0, answerLimit(poll?.type));
    return clean ? [{ kind: 'text', pollId: poll?.id, text: clean }] : [];
  }
  if (Array.isArray(val)) {
    // Ranking, Borda: the top pick gets N points, the last gets 1.
    const n = val.length;
    const ops = [];
    for (let rank = 0; rank < n; rank++) {
      const option = poll?.options?.[val[rank]];
      if (option) ops.push({ kind: 'weighted', optionId: option.id, weight: n - rank });
    }
    return ops;
  }
  const option = poll?.options?.[val];
  return option ? [{ kind: 'option', optionId: option.id }] : [];
}

// Retries a vote call a few times on Supabase's known auth-lock contention
// error before giving up — a transient "lock:sb-*" failure isn't a real vote
// failure, but it also isn't a guaranteed success; retrying resolves the
// ambiguity instead of silently assuming the vote landed.
async function withLockRetry(fn, attempts = 3, delayMs = 300) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fn();
      if (res?.error && isLockErrorMsg(res.error.message)) {
        lastErr = res.error;
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
        continue;
      }
      return res;
    } catch (err) {
      if (isLockErrorMsg(err?.message || err)) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// Get or create a persistent session ID — crypto.randomUUID polyfill for older browsers
const getSessionId = () => {
  let sid = localStorage.getItem('mkd_session_id');
  if (!sid) {
    sid = crypto.randomUUID?.()
      || 'uid-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    localStorage.setItem('mkd_session_id', sid);
  }
  return sid;
};

const EventWrapper = ({ type, username, setUsername }) => {
  const { id } = useParams();
  const normalizedCode = (id || '').replace(/^#/, '').trim().toUpperCase();
  const {
    event, polls, questions, reactions,
    loading, error, vote, submitSurvey, submitQuestion,
    upvoteQuestion, markQuestionAnswered,
    setQuestionPinned, setQuestionHidden,
    sendReaction, refetchLockState,
    toggleLock, startTimer, stopTimer, toggleAnswerRevealed,
  } = useEvent(normalizedCode, username);

  const { setEvent } = useEventStore();
  const [quizResult, setQuizResult] = useState(null);
  const [dbVotedPolls, setDbVotedPolls] = useState([]);
  const [isVoting, setIsVoting] = useState(false);
  // Synchronous companion to isVoting. A fast double-tap (common on phones)
  // fires both handlers before React re-renders, so the state flag is still
  // stale on the second one — the ref is set in the same tick, so it isn't.
  const isVotingRef = useRef(false);
  const [voteError, setVoteError] = useState(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [questionError, setQuestionError] = useState(null);
  const [pwdInput, setPwdInput] = useState('');
  const [pwdError, setPwdError] = useState(false);
  const [pwdVisible, setPwdVisible] = useState(false);
  const [pwdAuth, setPwdAuth] = useState(() =>
    !!sessionStorage.getItem(`pwd_auth_${window.location.pathname}`)
  );

  useSEO(event && type === 'participant' ? {
    title: `${event.title || 'Сесија во живо'} | MKD Slidea`,
    description: `Приклучи се на интерактивната сесија "${event.title || ''}" — одговарај на квизови и анкети во живо.`,
    path: `/event/${normalizedCode}`,
    image: `https://slidea.mismath.net/api/og-png?type=event&title=${encodeURIComponent(event.title || 'Сесија во живо')}&code=${encodeURIComponent(normalizedCode)}`,
    noindex: true,
  } : { noindex: true });

  // Presence tracking (participant count) lives in useEvent.js now — a
  // second `presence:${event.id}` channel created here collided with it
  // (supabase-js returns the same channel object for a repeat `.channel()`
  // call on the same topic; calling `.on()` on it after it's already
  // subscribed throws). This effect just mirrors the fetched event into the
  // shared store.
  useEffect(() => {
    if (event) setEvent(event);
  }, [event, setEvent]);

  const activePollId = event?.active_poll_id ? String(event.active_poll_id) : null;
  const rawIndex = activePollId
    ? polls.findIndex((p) => String(p.id) === activePollId)
    : 0;
  // Guard: findIndex returns -1 if poll was deleted after being set active
  const activePollIndex = rawIndex >= 0 ? rawIndex : 0;


  // Quiz leaderboard for the projector view — gated to type==='present' since
  // it's only ever rendered there, so the hundreds of regular participants
  // never trigger this extra query. Same aggregation EventScoreboard.jsx
  // uses (points = correct-answer count per session), recomputed whenever
  // polls/options change so it stays roughly live during the session.
  const [leaderboard, setLeaderboard] = useState([]);
  useEffect(() => {
    if (type !== 'present' || !event?.id) return;
    const quizPollIds = polls.filter((p) => p.is_quiz).map((p) => p.id);
    if (!quizPollIds.length) { setLeaderboard([]); return; }
    // Aggregated in the database instead of pulling every vote row to the
    // projector and grouping in the browser. The old read asked for
    // session_id, username and is_correct across the event's quizzes — which,
    // with the table open to anon, was a full copy of who answered what.
    supabase
      .rpc('event_leaderboard', { p_event_code: normalizedCode })
      .then(({ data }) => {
        setLeaderboard((data || []).map((r) => ({ username: r.username, points: Number(r.points) || 0 })));
      });
  }, [type, event?.id, polls, normalizedCode]);

  // Reset quiz result when active poll changes
  const currentPollId = polls[activePollIndex >= 0 ? activePollIndex : 0]?.id;
  useEffect(() => { setQuizResult(null); }, [currentPollId]);

  // userVoted = DB vote (primary) OR localStorage (fallback/cache).
  // When the host enables "Повеќекратно гласање" (allow_multiple_votes),
  // never treat the poll as already answered — participants can vote again
  // after a refresh instead of being locked out after their first vote.
  const votedKey = `voted_${event?.id || id}`;
  const getLocalVoted = () => { try { return JSON.parse(localStorage.getItem(votedKey) || '[]'); } catch { return []; } };
  const userVoted = event?.allow_multiple_votes
    ? false
    : currentPollId
      ? dbVotedPolls.includes(currentPollId) || getLocalVoted().includes(currentPollId)
      : false;
  const markVoted = (pollId) => {
    setDbVotedPolls(prev => prev.includes(pollId) ? prev : [...prev, pollId]);
    const v = getLocalVoted();
    if (!v.includes(pollId)) localStorage.setItem(votedKey, JSON.stringify([...v, pollId]));
  };

  // Which polls this session has already answered.
  //
  // Re-read when the host moves to another activity, not only once per event.
  // A host who resets an activity deletes its votes rows precisely so the room
  // can answer again — but the local cache below still said "voted", so the
  // reset cleared the chart and left every phone locked out of it.
  //
  // The reconcile only runs on a successful read. localStorage stays the
  // authority when the query fails or the phone is offline: dropping the local
  // guard on a network error would hand out a second vote to anyone with a
  // flaky connection.
  //
  // Read through my_voted_polls() rather than the votes table. The table read
  // was `session_id = <mine>`, which looks scoped but is only a filter the
  // caller chose — with the anon key that ships in this bundle, dropping it
  // returned every vote in every event, names and answers included. The
  // function is SECURITY DEFINER and returns poll ids for one session in one
  // event, and nothing else.
  useEffect(() => {
    if (!event?.id) return;
    const sid = getSessionId();
    supabase
      .rpc('my_voted_polls', { p_event_code: normalizedCode, p_session_id: sid })
      .then(({ data, error }) => {
        if (error || !data) return;
        const fromDb = data.map((r) => r.poll_id);
        setDbVotedPolls(fromDb);
        try {
          const live = new Set(polls.map((p) => p.id));
          const known = new Set(fromDb);
          // Forget a local mark only for an activity that is still in this
          // event and that the database says has no vote from us any more.
          const kept = getLocalVoted().filter((id) => !live.has(id) || known.has(id));
          localStorage.setItem(votedKey, JSON.stringify(kept));
        } catch { /* private mode — the DB list is enough */ }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id, currentPollId]);

  // Timer per active poll — MUST be before any early returns (Rules of Hooks).
  // It sat below them at first, so on the loading render these hooks did not
  // run and on the next one they did: "Rendered more hooks than during the
  // previous render", and the participant page died into the error boundary.
  // The version this replaced was a plain computation, which is why it was
  // safe down there.
  //
  // This used to be computed during render and nothing else, so it only moved
  // when something unrelated happened to re-render the page — a vote landing,
  // a poll refresh. On the participant's phone the countdown sat frozen while
  // the host's and the projector's ran, which is what "не е синхронизиран со
  // хостот" describes. Both of those already tick on their own interval; this
  // one did not.
  //
  // It matters beyond the display: `timerExpired` below is what stops a late
  // answer, so without a tick the deadline passed unnoticed and voting stayed
  // open until the next incidental render.
  //
  // Driven off `timer_ends_at`, an absolute instant set by the host, so every
  // device counts down to the same moment regardless of when it last rendered.
  const activePollTimerEndsAt = polls[activePollIndex >= 0 ? activePollIndex : 0]?.timer_ends_at;
  const [timerRemaining, setTimerRemaining] = useState(null);
  useEffect(() => {
    if (!activePollTimerEndsAt) { setTimerRemaining(null); return undefined; }
    const tick = () => setTimerRemaining(
      Math.max(0, Math.round((new Date(activePollTimerEndsAt) - Date.now()) / 1000))
    );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activePollTimerEndsAt]);
  const timerExpired = !!activePollTimerEndsAt && timerRemaining === 0;

  // Lock state polling — MUST be before any early returns (Rules of Hooks)
  //
  // This used to run only while already locked, so it could notice an unlock
  // but never a lock. Realtime does deliver events updates — measured, not
  // assumed — so in normal conditions the lock lands immediately and this
  // never fires. It exists for the case where realtime has dropped for one
  // phone in the room, and that case needs both directions: a host who
  // presses Заклучи and sees the button turn red believes the room has
  // stopped answering. Polling only the locked direction left the one
  // participant who most needed telling as the only one never told.
  //
  // Deliberately not an interval while unlocked. Unlocked is the steady state
  // for the whole room, and a room-wide interval is how the database reached
  // 72% CPU the last time: 416 participants on a 3s poll is 139 queries a
  // second. Instead this catches the case that actually loses messages — a
  // phone that was asleep, backgrounded or off-network — by re-reading once
  // when it comes back. Zero cost while nothing happens.
  useEffect(() => {
    if (!event?.id) return undefined;
    const onWake = () => { if (!document.hidden) refetchLockState(); };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('online', onWake);
    window.addEventListener('focus', onWake);
    // Once locked, a short interval is worth it: the room is idle, the host is
    // waiting to unlock, and there are no votes competing for the database.
    const timer = event?.is_locked ? setInterval(refetchLockState, 8000) : null;
    return () => {
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('online', onWake);
      window.removeEventListener('focus', onWake);
      if (timer) clearInterval(timer);
    };
  }, [event?.id, event?.is_locked, refetchLockState]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error || !event) return (
    <div className="text-center pt-32 px-6">
      <div className="bg-red-50 text-red-600 p-12 rounded-[3rem] border border-red-100 inline-block max-w-md shadow-2xl shadow-red-100">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
           <span className="text-4xl">🔍</span>
        </div>
        <h2 className="text-3xl font-black mb-2">Настанот не е пронајден</h2>
        <p className="font-bold opacity-80 mb-8 leading-relaxed text-slate-500">
          Проверете го кодот <span className="bg-red-100 px-2 py-0.5 rounded text-red-700">#{normalizedCode || id}</span>. Можно е настанот да е истечен или избришан.
        </p>
        {error && (
          <p className="text-xs text-slate-400 font-mono break-words mb-4">
            Детали: {String(error)}
          </p>
        )}
        <button 
          onClick={() => window.location.href='/'} 
          className="w-full bg-red-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-200"
        >
          Назад на почетна
        </button>
      </div>
    </div>
  );

  if (type === 'present') {
    return (
      <Presenter
        event={event}
        polls={polls}
        questions={questions}
        reactions={reactions}
        activePollIndex={activePollIndex}
        leaderboard={leaderboard}
        markQuestionAnswered={markQuestionAnswered}
        setQuestionPinned={setQuestionPinned}
        setQuestionHidden={setQuestionHidden}
        onToggleLock={toggleLock}
        onStartTimer={startTimer}
        onToggleAnswer={toggleAnswerRevealed}
        onStopTimer={stopTimer}
      />
    );
  }

  const asyncDeadlineTs = event.async_deadline ? new Date(event.async_deadline).getTime() : null;
  const isAsyncExpired = !!(event.async_mode && asyncDeadlineTs && Date.now() > asyncDeadlineTs);

  if (isAsyncExpired) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Homework сесијата е затворена</h2>
          <p className="text-slate-400 font-bold text-sm">Рокот за овој настан е истечен. Контактирајте го наставникот за повторно отворање.</p>
          <div className="mt-6"><PoweredByBadge code={event.code} utm="homework" /></div>
        </div>
      </div>
    );
  }

  // Lock screen — differentiate between "paused" and "ended" via the explicit
  // ended_at marker, not active_poll_id (which is also null pre-session,
  // before any poll has ever been activated — that used to show "ended" too).
  if (event.is_locked) {
    const isEnded = !!event.ended_at;
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-10 max-w-sm w-full text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            {isEnded ? (
              <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center">
                <span className="text-4xl">🎉</span>
              </div>
            ) : (
              <>
                <span className="absolute inset-0 rounded-3xl bg-red-100 animate-ping opacity-30" />
                <div className="relative w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center">
                  <Lock className="w-10 h-10 text-red-500" />
                </div>
              </>
            )}
          </div>
          {isEnded ? (
            <>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Сесијата е завршена</h2>
              <p className="text-slate-400 font-bold text-sm">Ви благодариме за учеството! Наставникот ги обработува резултатите.</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Гласањето е паузирано</h2>
              <p className="text-slate-400 font-bold text-sm">Следи ги инструкциите на наставникот. Гласањето ќе продолжи наскоро.</p>
              <div className="mt-5 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </>
          )}
          <div className="mt-6"><PoweredByBadge code={event.code} utm={isEnded ? 'ended' : 'locked'} /></div>
        </div>
      </div>
    );
  }

  // Password gate — participant only.
  // SECURITY: event.password is no longer leaked client-side. We only know
  // a password is required when event.has_password === true (server-side flag)
  // and we validate via verify_event_password RPC.
  if (event.has_password && !pwdAuth) {
    const handlePwdSubmit = async (e) => {
      e.preventDefault();
      try {
        const { data, error } = await supabase.rpc('verify_event_password', {
          p_event_id: event.id,
          p_password: pwdInput.trim(),
        });
        if (error) throw error;
        if (data === true) {
          sessionStorage.setItem(`pwd_auth_${window.location.pathname}`, '1');
          setPwdAuth(true);
          setPwdError(false);
        } else {
          setPwdError(true);
          setPwdInput('');
        }
      } catch {
        setPwdError(true);
        setPwdInput('');
      }
    };
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-100 p-10 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-1">Заштитен настан</h2>
          <p className="text-slate-400 font-bold text-sm mb-8">Внесете ја лозинката за да влезете</p>

          <form onSubmit={handlePwdSubmit} className="space-y-4">
            <div className="relative">
              <input
                autoFocus
                type={pwdVisible ? 'text' : 'password'}
                value={pwdInput}
                onChange={e => { setPwdInput(e.target.value); setPwdError(false); }}
                placeholder="Лозинка..."
                className={`w-full border-2 rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none transition-all pr-12 ${pwdError ? 'border-red-400 bg-red-50' : 'border-slate-100 focus:border-indigo-500'}`}
              />
              <button
                type="button"
                onClick={() => setPwdVisible(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {pwdVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {pwdError && (
              <p className="text-red-500 font-bold text-sm">Погрешна лозинка. Обидете се повторно.</p>
            )}
            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg shadow-indigo-100"
            >
              Влези
            </button>
          </form>

          <div className="mt-6"><PoweredByBadge code={event.code} utm="password" /></div>
        </div>
      </div>
    );
  }

  const currentPollForWrapper = polls[activePollIndex];
  const resultsVisible = currentPollForWrapper?.results_visible !== false;

  const handleSubmitQuestion = async () => {
    const clean = String(newQuestion || '').replace(/<[^>]+>/g, '').trim();
    if (clean.length < 3) return;
    // submitQuestion resolves with { data, error } rather than throwing, so the
    // try/catch this used to sit in never fired: the input was cleared and the
    // student was left believing the question was on its way to the teacher.
    // For as long as questions.session_id did not exist in the database, every
    // question anyone ever asked this way was rejected with 42703 and vanished.
    // Keep the text when it fails, and say so.
    try {
      const { error } = (await submitQuestion(clean, username || 'Анонимен')) || {};
      if (error) throw error;
      setQuestionError(null);
      setNewQuestion('');
    } catch (err) {
      console.error('Question submit failed:', err);
      setQuestionError('Прашањето не се испрати. Обиди се повторно.');
    }
  };

  return (
    <Participant
      polls={polls.length > 0 ? polls : [{ question: "Чекаме домаќинот да активира анкета...", options: [], is_quiz: false }]}
      questions={questions}
      activePollIndex={activePollIndex}
      userVoted={userVoted || isVoting || timerExpired}
      // The line above locks the input when the timer runs out, which is right.
      // It also put every non-voter on the "Ви благодариме! … Вашиот одговор е
      // успешно испратен" screen — a student who never answered was told they
      // had, in the one moment they were most likely to believe it.
      answerNotSent={timerExpired && !userVoted}
      quizResult={quizResult}
      voteError={voteError}
      resultsVisible={resultsVisible}
      timerRemaining={timerRemaining}
      eventCode={event.code}
      asyncMode={!!event.async_mode}
      asyncDeadline={event.async_deadline || null}
      handleSurvey={async (answers) => {
        const currentPoll = polls[activePollIndex];
        if (isVotingRef.current || !currentPoll || userVoted) return;
        const sid = getSessionId();
        isVotingRef.current = true;
        try {
          // submitSurvey resolves with { data, error } — a refused policy or a
          // dropped connection arrives in `error`, not as a throw. Reading only
          // the throw let every failure fall through to markVoted: the
          // participant saw "Ви благодариме!", the form locked, and nothing had
          // been stored. The projector's panel stayed empty and nobody could
          // tell whose fault it was.
          const { error } = await submitSurvey(currentPoll.id, answers, sid);
          if (error) throw error;
          markVoted(currentPoll.id);
          setVoteError(null);
        } catch (err) {
          console.error('Survey submit failed:', err);
          setVoteError('Анкетата не се испрати. Обидете се повторно.');
        } finally {
          isVotingRef.current = false;
        }
      }}
      handleVote={async (val) => {
        if (isVotingRef.current || userVoted || polls.length === 0) return;
        const currentPoll = polls[activePollIndex];
        if (!currentPoll) return;

        isVotingRef.current = true;
        setIsVoting(true);
        setVoteError(null);

        // Aggregate increments not yet known to have landed. Each entry is
        // removed the moment its call succeeds, so if we drop offline midway
        // (ranking fires one call per option) only the missing ones get queued
        // for replay — see offlineQueue.js.
        const pendingOps = [];
        // Hoisted so the catch can queue exactly what the online path named,
        // instead of re-deriving it with a second copy of deriveAnswer's branch
        // order — the copy that used to be there is how an offline fill_blanks
        // answer nearly got queued as `null`. Grading belongs to the database
        // now, so this is an id and a string, not a verdict.
        let claimLanded = false;
        let claimOptionId = null;
        let claimText = null;
        const sid = getSessionId();
        // With multiple votes allowed each attempt needs its own row, or it
        // would no-op against the previous vote via that same constraint. The
        // queued row below has to carry the very same id: replaying under the
        // bare session id would collide with a vote already cast, the claim
        // would answer false, and the flush would read that as done.
        const voteRowSid = event?.allow_multiple_votes ? `${sid}-${Date.now()}` : sid;

        try {
          let answerText = null;
          let isCorrect = null;

          // ── Claim the vote before counting it ────────────────────────────
          // The tally lives in options.votes and moves through increment_vote,
          // which is a blind `votes = votes + 1` with no idea who is calling.
          // The one-vote-per-session rule lives somewhere else entirely: the
          // UNIQUE(poll_id, session_id) on the votes table.
          //
          // Those used to run in the wrong order — tally first, votes row
          // afterwards with ignoreDuplicates, which swallows the conflict
          // without an error. So a second submission moved the counter and
          // then quietly failed to record itself: the chart went up, the votes
          // table stayed at one row, and the only thing standing between a
          // participant and voting twice was the client-side `userVoted` flag.
          //
          // Now the row is claimed first and its conflict is the gate.
          //
          // Through claim_vote_graded() rather than an upsert whose result is
          // read back. The read-back version needed SELECT on the votes table,
          // and the moment that was closed to participants every vote returned
          // 401 — the insert was always fine, it was asking for the row
          // afterwards that failed. The function performs the same
          // INSERT … ON CONFLICT DO NOTHING and returns whether a row was
          // created, which is the only thing this code needs to know.
          //
          // _graded because the verdict is the database's now. The predecessor
          // took p_is_correct from this file, and options.is_correct is readable
          // by anyone holding the public anon key — so the caller decided whether
          // its own answer counted as correct, and event_scoreboard believed it.
          // This sends the option id and nothing else.
          const { answerText: derivedText, optionId: derivedOptionId } = deriveAnswer(val, currentPoll);
          claimText = derivedText;
          claimOptionId = derivedOptionId;

          const { data: claimed, error: claimError } = await supabase.rpc('claim_vote_graded', {
            p_poll_id: currentPoll.id,
            p_session_id: voteRowSid,
            p_username: username || 'Анонимен',
            p_answer_text: claimText,
            p_option_id: claimOptionId,
          });

          // A network failure must not be read as "already voted" — that would
          // drop the vote silently. Let it throw into the offline path below.
          if (claimError) throw claimError;

          if (claimed === false) {
            // The constraint refused it: this session already answered.
            markVoted(currentPoll.id);
            setVoteError('Веќе гласавте на оваа активност.');
            return;
          }
          // From here the votes row exists. Everything below only moves the
          // aggregate, so a failure past this point is a debt the queue can
          // repay — not a vote that has to be cast again. See the catch.
          claimLanded = true;

          // Fill-in-the-blanks arrives as { blankId: answer, … }. It has to be
          // matched before the numeric branch below, which would otherwise
          // treat the object as an option index and fail with "Invalid option
          // selected" — silently losing the answer.
          //
          // There is no aggregate to increment: nothing is being counted, the
          // responses are read. So it takes the votes-row path only, with the
          // answers serialised into answer_text, which keeps CSV export and
          // the results view working without a new table.
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            answerText = JSON.stringify(val).slice(0, 2000);
          } else if (typeof val === 'string') {
            answerText = val;
            // Mirrors the sanitising vote() applies before POSTing to /api/vote-text.
            const cleanText = val.replace(/<[^>]+>/g, '').trim().slice(0, answerLimit(currentPoll.type));
            if (cleanText) pendingOps.push({ kind: 'text', pollId: currentPoll.id, text: cleanText });
            const textVoteRes = await withLockRetry(() => vote(null, currentPoll.id, val, false));
            if (textVoteRes?.error) throw textVoteRes.error;
            pendingOps.length = 0;
          } else if (Array.isArray(val)) {
            // Ranking: val is the full option-index order, most preferred first.
            // Borda count — top pick gets N points, last gets 1 — so the whole
            // ordering (not just #1) contributes to the aggregate result.
            const n = val.length;
            answerText = val.map((optIdx) => currentPoll.options[optIdx]?.text).filter(Boolean).join(' > ');
            for (let rank = 0; rank < n; rank++) {
              const option = currentPoll.options[val[rank]];
              if (!option) continue;
              pendingOps.push({ kind: 'weighted', optionId: option.id, weight: n - rank });
            }
            for (let rank = 0; rank < n; rank++) {
              const option = currentPoll.options[val[rank]];
              if (!option) continue;
              const weight = n - rank;
              const rankVoteRes = await withLockRetry(() => vote(option.id, currentPoll.id, null, weight));
              if (rankVoteRes?.error) throw rankVoteRes.error;
              pendingOps.shift();
            }
          } else {
            const option = currentPoll.options[val];
            if (!option) throw new Error('Invalid option selected');
            answerText = option.text;
            isCorrect = option.is_correct ?? null;
            pendingOps.push({ kind: 'option', optionId: option.id });
            const optionVoteRes = await withLockRetry(() => vote(option.id));
            if (optionVoteRes?.error) throw optionVoteRes.error;
            pendingOps.length = 0;
            if (currentPoll.is_quiz) {
              const correctIndex = currentPoll.options.findIndex(o => o.is_correct);
              setQuizResult({ isCorrect: !!option.is_correct, selectedIndex: val, correctIndex });
              if (option.is_correct) {
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#10B981', '#34D399', '#6EE7B7'] });
              }
            }
          }
          
          // The votes row was already written by the claim above, with the
          // same answer_text and is_correct the branches derive. `answerText`
          // and `isCorrect` stay in place because the quiz branch reads them
          // for the on-screen result.
          void answerText; void isCorrect;

          markVoted(currentPoll.id);
        } catch (err) {
          const msg = String(err?.message || err || '');
          const isOffline = (typeof navigator !== 'undefined' && navigator.onLine === false)
            || /Failed to fetch|NetworkError|TypeError/i.test(msg);

          // The aggregate still owed. While the claim was in flight nothing has
          // been pushed yet, so a failure there — the ordinary offline case —
          // would queue an empty list: the replay wrote the votes row and
          // options.votes never moved, leaving an answer that was recorded and
          // counted nowhere. voteOpsFor derives the same increments purely.
          const owedOps = pendingOps.length
            ? pendingOps
            : (claimLanded ? [] : voteOpsFor(val, currentPoll));

          // Once the claim is in, the answer exists and this session cannot cast
          // it again — a retry only ever earns "Веќе гласавте на оваа
          // активност", and the aggregate is silently lost with it. So anything
          // still owed is queued whatever the reason, not only when offline.
          //
          // The reason that made this necessary is not exotic. /api/vote-text
          // rate limits per IP, and a whole class submits a word cloud from
          // behind one school NAT inside a few seconds; everyone past the limit
          // used to hit a dead end with their word missing from the wall.
          if (isOffline || owedOps.length) {
            queueVote({
              row: {
                poll_id: currentPoll.id,
                session_id: voteRowSid,
                username: username || 'Анонимен',
                // Exactly what the claim above named, not a second derivation of
                // it. The replay goes through claim_vote_graded too, so it needs
                // the option id to be graded from — never a verdict from here.
                answer_text: claimText,
                option_id: claimOptionId,
              },
              // Without these the queued vote would replay into `votes` but
              // never reach options.votes — counted nowhere, charted nowhere.
              ops: owedOps,
            });
            markVoted(currentPoll.id);
            setVoteError(isOffline
              ? 'Офлајн сте — гласот е зачуван и ќе се испрати кога ќе се поврзете.'
              : 'Одговорот е зачуван, а бројењето ќе се испрати за неколку секунди. Не ја освежувајте страницата.');
            if (typeof window !== 'undefined') window.addEventListener('online', flushQueue, { once: true });
            // Online and still owed — a rate limit or a transient RPC failure.
            // No `online` event will come, so ask the queue to try again.
            if (!isOffline) scheduleFlush();
          } else {
            console.error('Vote failed:', err);
            setVoteError('Гласањето не успеа. Обидете се повторно.');
          }
        } finally {
          isVotingRef.current = false;
          setIsVoting(false);
        }
      }}
      handleUpvote={(qid) => upvoteQuestion(qid)}
      sendReaction={sendReaction}
      newQuestion={newQuestion}
      setNewQuestion={setNewQuestion}
      questionError={questionError}
      submitQuestion={handleSubmitQuestion}
      username={username}
      setUsername={setUsername}
    />
  );
};

export default EventWrapper;
