import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useEvent } from '../hooks/useEvent';
import Presenter from '../views/Presenter';
import Participant from '../views/Participant';
import { useEventStore } from '../lib/store';
import { supabase } from '../lib/supabase';

const EventWrapper = ({ type, username, setUsername }) => {
  const { id } = useParams();
  const { 
    event, polls, questions, reactions, 
    loading, error, vote, submitQuestion, 
    upvoteQuestion, markQuestionAnswered, sendReaction 
  } = useEvent(id);
  
  const { setEvent, setPresence } = useEventStore();
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    if (event) {
      setEvent(event);
      
      // Setup Real-time Presence (Pulse)
      const channel = supabase.channel(`presence:${event.id}`, {
        config: { presence: { key: username || 'anonymous' } }
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const count = Object.keys(state).length;
          setPresence(count);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('Join:', key, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('Leave:', key, leftPresences);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ online_at: new Date().toISOString() });
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [event, username, setEvent, setPresence]);

  const activePollIndex = event?.active_poll_id 
    ? polls.findIndex(p => p.id === event.active_poll_id) 
    : 0;

  // Reset quiz result when active poll changes
  const currentPollId = polls[activePollIndex >= 0 ? activePollIndex : 0]?.id;
  useEffect(() => { setQuizResult(null); }, [currentPollId]);

  // Persist voted polls in localStorage so refresh doesn't reset vote state
  const votedKey = `voted_${event?.id || id}`;
  const getVoted = () => { try { return JSON.parse(localStorage.getItem(votedKey) || '[]'); } catch { return []; } };
  const userVoted = currentPollId ? getVoted().includes(currentPollId) : false;
  const markVoted = (pollId) => {
    const v = getVoted();
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

  // Timer from event
  const timerRemaining = event?.timer_ends_at
    ? Math.max(0, Math.round((new Date(event.timer_ends_at) - Date.now()) / 1000))
    : null;
  const timerExpired = event?.timer_ends_at && timerRemaining === 0;
  const currentPollForWrapper = polls[activePollIndex];
  const resultsVisible = currentPollForWrapper?.results_visible !== false;

  return (
    <Participant
      polls={polls.length > 0 ? polls : [{ question: "Чекаме домаќинот да активира анкета...", options: [], is_quiz: false }]}
      questions={questions}
      activePollIndex={activePollIndex}
      userVoted={userVoted || timerExpired}
      quizResult={quizResult}
      resultsVisible={resultsVisible}
      timerRemaining={timerRemaining}
      handleVote={async (val) => {
        if (userVoted || polls.length === 0) return;
        const currentPoll = polls[activePollIndex];
        
        try {
          if (typeof val === 'string') {
            await vote(null, currentPoll.id, val);
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
          markVoted(currentPoll.id);
        } catch (err) {
          console.error("Vote failed:", err);
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
