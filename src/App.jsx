import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Nav from './components/Nav';
import Landing from './views/Landing';
import Join from './views/Join';
import Host from './views/Host';
import Participant from './views/Participant';
import Presenter from './views/Presenter';
import Dashboard from './views/Dashboard';
import confetti from 'canvas-confetti';
import { supabase } from './lib/supabase';
import { useEvent } from './hooks/useEvent';

// Специјална компонента за настанот која користи реални податоци
const EventWrapper = ({ type, username, setUsername }) => {
  const { id } = useParams();
  const { 
    event, polls, questions, reactions, 
    loading, error, vote, submitQuestion, 
    upvoteQuestion, sendReaction 
  } = useEvent(id);
  const [activePollIndex, setActivePollIndex] = useState(0);
  const [userVoted, setUserVoted] = useState(false);

  useEffect(() => {
    // Reset voting state when poll changes
    setUserVoted(false);
  }, [activePollIndex]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error || !event) return (
    <div className="text-center pt-32">
      <div className="bg-red-50 text-red-600 p-8 rounded-[3rem] border border-red-100 inline-block max-w-md">
        <h2 className="text-3xl font-black mb-2">Настанот не постои!</h2>
        <p className="font-bold opacity-80 mb-6">Проверете го кодот #{id} и обидете се повторно.</p>
        <button onClick={() => window.location.href='/'} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black">Назад на почетна</button>
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
      />
    );
  }

  return (
    <Participant 
      polls={polls.length > 0 ? polls : [{ question: "Чекаме домаќинот да креира анкета...", options: [], is_quiz: false }]} 
      questions={questions} 
      activePollIndex={activePollIndex}
      userVoted={userVoted}
      handleVote={async (val) => {
        if (userVoted || polls.length === 0) return;
        const currentPoll = polls[activePollIndex];
        
        if (typeof val === 'string') {
          // Text response (wordcloud, open)
          await vote(null, currentPoll.id, val);
        } else {
          // Index response (poll, quiz)
          const option = currentPoll.options[val];
          await vote(option.id);
          if (option.is_correct) {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#F59E0B', '#FCD34D'] });
          }
        }
        setUserVoted(true);
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

const AppContent = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [username, setUsername] = useState(() => localStorage.getItem('mkd_slidea_user') || '');

  const updateUsername = (name) => {
    setUsername(name);
    localStorage.setItem('mkd_slidea_user', name);
  };

  const setView = (view) => {
    if (view === 'landing') navigate('/');
    if (view === 'join') navigate('/join');
    if (view === 'host') navigate('/host');
    if (view === 'dashboard') navigate('/dashboard');
  };

  const handleJoin = (e) => {
    if (e) e.preventDefault();
    if (code.length === 6) {
      navigate('/event/' + code);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      <Nav setView={setView} />
      
      <main className="pt-16">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Landing code={code} setCode={setCode} setView={setView} />} />
            <Route path="/join" element={<Join code={code} setCode={setCode} handleJoin={handleJoin} setView={setView} />} />
            <Route path="/host" element={<Host polls={[]} questions={[]} setView={setView} onAddPoll={() => {}} activePollIndex={0} setActivePollIndex={() => {}} />} />
            <Route path="/dashboard" element={<Dashboard setView={setView} />} />
            <Route path="/event/:id/present" element={<EventWrapper type="present" />} />
            <Route path="/event/:id" element={<EventWrapper type="participant" username={username} setUsername={updateUsername} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AnimatePresence>
      </main>
      
      <footer className="py-12 text-center text-slate-400 text-sm font-medium border-t border-slate-100 mt-20">
        <div className="flex items-center justify-center gap-6 mb-4">
          <a href="#" className="hover:text-indigo-600 transition-colors">Политика на приватност</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Услови за користење</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Контакт</a>
        </div>
        <p>© 2024 MKD Slidea. Со гордост направено во 🇲🇰</p>
      </footer>
    </div>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
