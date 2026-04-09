import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useEvent } from '../hooks/useEvent';
import Presenter from '../views/Presenter';
import Participant from '../views/Participant';
import { useEventStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff } from 'lucide-react';

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
    upvoteQuestion, markQuestionAnswered, sendReaction
  } = useEvent(normalizedCode);

  const { setEvent, setPresence } = useEventStore();
  const [quizResult, setQuizResult] = useState(null);
  const [dbVotedPolls, setDbVotedPolls] = useState([]);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState(null);
  const [pwdInput, setPwdInput] = useState('');
  const [pwdError, setPwdError] = useState(false);
  const [pwdVisible, setPwdVisible] = useState(false);
  const [pwdAuth, setPwdAuth] = useState(() =>
    !!sessionStorage.getItem(`pwd_auth_${window.location.pathname}`)
  );

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
        leaderboard={[]}
        markQuestionAnswered={markQuestionAnswered}
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
          <p className="mt-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">#{event.code} · MKD Slidea</p>
        </div>
      </div>
    );
  }

  // Lock screen — host has locked voting
  if (event.is_locked) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-10 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Гласањето е заклучено</h2>
          <p className="text-slate-400 font-bold text-sm">Домаќинот привремено го оневозможи гласањето. Почекајте малку.</p>
          <p className="mt-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">#{event.code} · MKD Slidea</p>
        </div>
      </div>
    );
  }

  // Password gate — participant only
  if (event.password && !pwdAuth) {
    const handlePwdSubmit = (e) => {
      e.preventDefault();
      if (pwdInput.trim() === event.password) {
        sessionStorage.setItem(`pwd_auth_${window.location.pathname}`, '1');
        setPwdAuth(true);
        setPwdError(false);
      } else {
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

          <p className="mt-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">
            #{event.code} · MKD Slidea
          </p>
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
            await vote(null, currentPoll.id, val, !!currentPoll.needs_moderation);
          } else {
            const option = currentPoll.options[val];
            answerText = option.text;
            isCorrect = option.is_correct ?? null;
            await vote(option.id);
            if (currentPoll.is_quiz) {
              const correctIndex = currentPoll.options.findIndex(o => o.is_correct);
              setQuizResult({ isCorrect: !!option.is_correct, selectedIndex: val, correctIndex });
              if (option.is_correct) {
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#10B981', '#34D399', '#6EE7B7'] });
              }
            }
          }
          
          const sid = getSessionId();
          
          // Retry vote upsert on lock conflict
          let votesError;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              const { error } = await supabase.from('votes').upsert(
                {
                  poll_id: currentPoll.id,
                  session_id: sid,
                  username: username || 'Анонимен',
                  answer_text: answerText,
                  is_correct: isCorrect,
                },
                { onConflict: 'poll_id,session_id', ignoreDuplicates: false }
              );
              
              if (!error) {
                markVoted(currentPoll.id);
                return;
              }
              
              votesError = error;
              const isLockError = String(error.message || '').includes('lock:sb-');
              if (isLockError && attempt < 2) {
                await new Promise(r => setTimeout(r, 50 + attempt * 100));
                continue;
              }
              break;
            } catch (e) {
              votesError = e;
              if (attempt < 2) {
                await new Promise(r => setTimeout(r, 50 + attempt * 100));
                continue;
              }
              throw e;
            }
          }
          
          markVoted(currentPoll.id);
        } catch (err) {
          const msg = String(err?.message || err || '');
          const isLockError = msg.includes('lock:sb-');
          
          if (!isLockError) {
            console.error('Vote failed:', err);
            setVoteError('Гласањето не успеа. Обидете се повторно.');
          } else {
            markVoted(polls[activePollIndex]?.id);
          }
        } finally {
          setIsVoting(false);
        }
      }}
      handleUpvote={(qid) => upvoteQuestion(qid)}
      sendReaction={sendReaction}
      newQuestion=""
      setNewQuestion={() => {}}
      submitQuestion={(txt) => submitQuestion(txt, username)}
      username={username}
      setUsername={setUsername}
    />
  );
};

export default EventWrapper;
