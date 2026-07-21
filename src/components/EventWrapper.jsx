import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import confetti from 'canvas-confetti';
import { useEvent } from '../hooks/useEvent';
import Presenter from '../views/Presenter';
import Participant from '../views/Participant';
import { useEventStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { queueVote, flushQueue } from '../lib/offlineQueue';
import { Lock, Eye, EyeOff } from 'lucide-react';
import PoweredByBadge from './PoweredByBadge';

const isLockErrorMsg = (msg) => String(msg || '').includes('lock:sb-');

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
    toggleLock, startTimer, stopTimer,
  } = useEvent(normalizedCode);

  const { setEvent, setPresence } = useEventStore();
  const [quizResult, setQuizResult] = useState(null);
  const [dbVotedPolls, setDbVotedPolls] = useState([]);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState(null);
  const [newQuestion, setNewQuestion] = useState('');
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

  useEffect(() => {
    if (event) {
      setEvent(event);
      
      // Setup Real-time Presence — unique key per browser session to avoid collisions
      const channel = supabase.channel(`presence:${event.id}`, {
        config: { presence: { key: getSessionId() } }
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          setPresence(Object.keys(state).length);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ online_at: new Date().toISOString(), username: username || 'Анонимен' });
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [event, username, setEvent, setPresence]);

  const activePollId = event?.active_poll_id ? String(event.active_poll_id) : null;
  const rawIndex = activePollId
    ? polls.findIndex((p) => String(p.id) === activePollId)
    : 0;
  // Guard: findIndex returns -1 if poll was deleted after being set active
  const activePollIndex = rawIndex >= 0 ? rawIndex : 0;

  // Fetch which polls this session already voted on from DB
  useEffect(() => {
    if (!event?.id) return;
    const sid = getSessionId();
    supabase
      .from('votes')
      .select('poll_id')
      .eq('session_id', sid)
      .then(({ data }) => {
        if (data) setDbVotedPolls(data.map(r => r.poll_id));
      });
  }, [event?.id]);

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
    supabase
      .from('votes')
      .select('session_id, username, is_correct')
      .in('poll_id', quizPollIds)
      .then(({ data }) => {
        const map = new Map();
        for (const v of data || []) {
          const sid = v.session_id || v.username || 'anon';
          if (!map.has(sid)) map.set(sid, { username: v.username || 'Анонимен', points: 0 });
          if (v.is_correct) map.get(sid).points++;
        }
        setLeaderboard([...map.values()]);
      });
  }, [type, event?.id, polls]);

  // Reset quiz result when active poll changes
  const currentPollId = polls[activePollIndex >= 0 ? activePollIndex : 0]?.id;
  useEffect(() => { setQuizResult(null); }, [currentPollId]);

  // userVoted = DB vote (primary) OR localStorage (fallback/cache)
  const votedKey = `voted_${event?.id || id}`;
  const getLocalVoted = () => { try { return JSON.parse(localStorage.getItem(votedKey) || '[]'); } catch { return []; } };
  const userVoted = currentPollId
    ? dbVotedPolls.includes(currentPollId) || getLocalVoted().includes(currentPollId)
    : false;
  const markVoted = (pollId) => {
    setDbVotedPolls(prev => prev.includes(pollId) ? prev : [...prev, pollId]);
    const v = getLocalVoted();
    if (!v.includes(pollId)) localStorage.setItem(votedKey, JSON.stringify([...v, pollId]));
  };

  // Lock state polling — MUST be before any early returns (Rules of Hooks)
  useEffect(() => {
    if (!event?.is_locked) return;
    const timer = setInterval(refetchLockState, 8000);
    return () => clearInterval(timer);
  }, [event?.is_locked, refetchLockState]);

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

  // Lock screen — differentiate between "paused" and "ended" (ended = locked + no active poll)
  if (event.is_locked) {
    const isEnded = !event.active_poll_id;
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
              <p className="text-red-500 font-black text-sm">Погрешна лозинка. Обидете се повторно.</p>
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

  // Timer per active poll
  const activePollTimerEndsAt = polls[activePollIndex >= 0 ? activePollIndex : 0]?.timer_ends_at;
  const timerRemaining = activePollTimerEndsAt
    ? Math.max(0, Math.round((new Date(activePollTimerEndsAt) - Date.now()) / 1000))
    : null;
  const timerExpired = activePollTimerEndsAt && timerRemaining === 0;
  const currentPollForWrapper = polls[activePollIndex];
  const resultsVisible = currentPollForWrapper?.results_visible !== false;

  const handleSubmitQuestion = async () => {
    const clean = String(newQuestion || '').replace(/<[^>]+>/g, '').trim();
    if (clean.length < 3) return;
    try {
      await submitQuestion(clean, username || 'Анонимен');
      setNewQuestion('');
    } catch (err) {
      console.error('Question submit failed:', err);
    }
  };

  return (
    <Participant
      polls={polls.length > 0 ? polls : [{ question: "Чекаме домаќинот да активира анкета...", options: [], is_quiz: false }]}
      questions={questions}
      activePollIndex={activePollIndex}
      userVoted={userVoted || isVoting || timerExpired}
      quizResult={quizResult}
      voteError={voteError}
      resultsVisible={resultsVisible}
      timerRemaining={timerRemaining}
      eventCode={event.code}
      asyncMode={!!event.async_mode}
      asyncDeadline={event.async_deadline || null}
      handleSurvey={async (answers) => {
        const currentPoll = polls[activePollIndex];
        if (!currentPoll || userVoted) return;
        const sid = getSessionId();
        try {
          await submitSurvey(currentPoll.id, answers, sid);
          markVoted(currentPoll.id);
        } catch (err) {
          console.error('Survey submit failed:', err);
        }
      }}
      handleVote={async (val) => {
        if (userVoted || isVoting || polls.length === 0) return;
        const currentPoll = polls[activePollIndex];
        if (!currentPoll) return;

        setIsVoting(true);
        setVoteError(null);

        try {
          let answerText = null;
          let isCorrect = null;

          if (typeof val === 'string') {
            answerText = val;
            const textVoteRes = await withLockRetry(() => vote(null, currentPoll.id, val, false));
            if (textVoteRes?.error) throw textVoteRes.error;
          } else if (Array.isArray(val)) {
            // Ranking: val is the full option-index order, most preferred first.
            // Borda count — top pick gets N points, last gets 1 — so the whole
            // ordering (not just #1) contributes to the aggregate result.
            const n = val.length;
            answerText = val.map((optIdx) => currentPoll.options[optIdx]?.text).filter(Boolean).join(' > ');
            for (let rank = 0; rank < n; rank++) {
              const option = currentPoll.options[val[rank]];
              if (!option) continue;
              const weight = n - rank;
              const rankVoteRes = await withLockRetry(() => vote(option.id, currentPoll.id, null, weight));
              if (rankVoteRes?.error) throw rankVoteRes.error;
            }
          } else {
            const option = currentPoll.options[val];
            if (!option) throw new Error('Invalid option selected');
            answerText = option.text;
            isCorrect = option.is_correct ?? null;
            const optionVoteRes = await withLockRetry(() => vote(option.id));
            if (optionVoteRes?.error) throw optionVoteRes.error;
            if (currentPoll.is_quiz) {
              const correctIndex = currentPoll.options.findIndex(o => o.is_correct);
              setQuizResult({ isCorrect: !!option.is_correct, selectedIndex: val, correctIndex });
              if (option.is_correct) {
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#10B981', '#34D399', '#6EE7B7'] });
              }
            }
          }
          
          const sid = getSessionId();
          
          // Record vote in votes table. Use ignoreDuplicates:true (DO NOTHING on conflict)
          // so anon users don't need UPDATE permission — INSERT is enough.
          const { error: votesError } = await supabase.from('votes').upsert(
            {
              poll_id: currentPoll.id,
              session_id: sid,
              username: username || 'Анонимен',
              answer_text: answerText,
              is_correct: isCorrect,
            },
            { onConflict: 'poll_id,session_id', ignoreDuplicates: true }
          );

          if (votesError) {
            // Non-fatal: vote already counted in options.votes via RPC; just log
            console.warn('votes record failed (non-fatal):', votesError.message);
          }

          markVoted(currentPoll.id);
        } catch (err) {
          const msg = String(err?.message || err || '');
          const isOffline = (typeof navigator !== 'undefined' && navigator.onLine === false)
            || /Failed to fetch|NetworkError|TypeError/i.test(msg);

          if (isOffline) {
            // Persist locally and replay when back online.
            const currentPoll = polls[activePollIndex];
            if (currentPoll) {
              queueVote({
                row: {
                  poll_id: currentPoll.id,
                  session_id: getSessionId(),
                  username: username || 'Анонимен',
                  answer_text: typeof val === 'string'
                    ? val
                    : Array.isArray(val)
                      ? val.map((optIdx) => currentPoll.options?.[optIdx]?.text).filter(Boolean).join(' > ')
                      : currentPoll.options?.[val]?.text ?? null,
                  is_correct: (typeof val === 'string' || Array.isArray(val)) ? null : (currentPoll.options?.[val]?.is_correct ?? null),
                },
              });
              markVoted(currentPoll.id);
              setVoteError('Офлајн сте — гласот е зачуван и ќе се испрати кога ќе се поврзете.');
              if (typeof window !== 'undefined') window.addEventListener('online', flushQueue, { once: true });
            }
          } else {
            console.error('Vote failed:', err);
            setVoteError('Гласањето не успеа. Обидете се повторно.');
          }
        } finally {
          setIsVoting(false);
        }
      }}
      handleUpvote={(qid) => upvoteQuestion(qid)}
      sendReaction={sendReaction}
      newQuestion={newQuestion}
      setNewQuestion={setNewQuestion}
      submitQuestion={handleSubmitQuestion}
      username={username}
      setUsername={setUsername}
    />
  );
};

export default EventWrapper;
