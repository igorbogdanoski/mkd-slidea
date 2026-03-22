import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useEvent } from '../hooks/useEvent';
import Presenter from '../views/Presenter';
import Participant from '../views/Participant';
import { useEventStore } from '../lib/store';
import { supabase } from '../lib/supabase';

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
  const {
    event, polls, questions, reactions,
    loading, error, vote, submitQuestion,
    upvoteQuestion, markQuestionAnswered, sendReaction
  } = useEvent(id);

  const { setEvent, setPresence } = useEventStore();
  const [quizResult, setQuizResult] = useState(null);
  const [dbVotedPolls, setDbVotedPolls] = useState([]);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState(null);

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

  const rawIndex = event?.active_poll_id
    ? polls.findIndex(p => p.id === event.active_poll_id)
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
          Проверете го кодот <span className="bg-red-100 px-2 py-0.5 rounded text-red-700">#{id}</span>. Можно е настанот да е истечен или избришан.
        </p>
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
      handleVote={async (val) => {
        if (userVoted || isVoting || polls.length === 0) return;
        const currentPoll = polls[activePollIndex];
        if (!currentPoll) return;

        setIsVoting(true);
        setVoteError(null);

        try {
          if (typeof val === 'string') {
            await vote(null, currentPoll.id, val, !!currentPoll.needs_moderation);
          } else {
            const option = currentPoll.options[val];
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
          await supabase.from('votes').upsert(
            { poll_id: currentPoll.id, session_id: sid },
            { onConflict: 'poll_id,session_id', ignoreDuplicates: true }
          );
          markVoted(currentPoll.id);
        } catch (err) {
          console.error('Vote failed:', err);
          setVoteError('Гласањето не успеа. Обидете се повторно.');
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
