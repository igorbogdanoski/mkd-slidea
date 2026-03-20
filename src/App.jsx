import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Nav from './components/Nav';
import Landing from './views/Landing';
import Join from './views/Join';
import Host from './views/Host';
import Participant from './views/Participant';
import Presenter from './views/Presenter';
import confetti from 'canvas-confetti';
import { supabase } from './lib/supabase';

const AppContent = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [activePollIndex, setActivePollIndex] = useState(0);
  const [userVoted, setUserVoted] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [username, setUsername] = useState(() => localStorage.getItem('mkd_slidea_user') || '');

  // State for data
  const [polls, setPolls] = useState([
    { id: 1, question: "Како се чувствувате во врска со новата технологија?", options: [
      { text: "Возбудено", votes: 15, is_correct: false },
      { text: "Загрижено", votes: 5, is_correct: false },
      { text: "Неутрално", votes: 10, is_correct: false }
    ], active: true, is_quiz: false }
  ]);

  const [questions, setQuestions] = useState([
    { id: 1, text: "Кога ќе биде достапна мобилната верзија?", votes: 12, author: "Ана" },
  ]);

  const [leaderboard, setLeaderboard] = useState([
    { username: 'Ана', points: 1200 },
    { username: 'Марко', points: 850 },
    { username: 'Петар', points: 400 }
  ]);

  // Set username helper
  const updateUsername = (name) => {
    setUsername(name);
    localStorage.setItem('mkd_slidea_user', name);
  };

  const handleVote = (optionIndex) => {
    if (userVoted) return;
    const updatedPolls = [...polls];
    updatedPolls[activePollIndex].options[optionIndex].votes += 1;
    setPolls(updatedPolls);
    setUserVoted(true);
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4F46E5', '#7C3AED', '#C026D3']
    });
  };

  const handleUpvote = (id) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, votes: q.votes + 1 } : q
    ).sort((a, b) => b.votes - a.votes));
  };

  const submitQuestion = () => {
    if (!newQuestion.trim()) return;
    const q = {
      id: questions.length + 1,
      text: newQuestion,
      votes: 0,
      author: "Гостин"
    };
    setQuestions([q, ...questions]);
    setNewQuestion("");
  };

  const handleJoin = (e) => {
    if (e) e.preventDefault();
    if (code.length === 6) {
      setIsJoined(true);
      navigate('/event/' + code);
    }
  };

  const setView = (view) => {
    if (view === 'landing') navigate('/');
    if (view === 'join') navigate('/join');
    if (view === 'host') navigate('/host');
    if (view === 'participant') navigate('/event/' + code);
  };

  const onAddPoll = (newPoll) => {
    setPolls([...polls, { ...newPoll, id: polls.length + 1 }]);
    setActivePollIndex(polls.length);
    setUserVoted(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      <Nav setView={setView} />
      
      <main className="pt-16">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Landing code={code} setCode={setCode} setView={setView} />} />
            <Route path="/join" element={<Join code={code} setCode={setCode} handleJoin={handleJoin} setView={setView} />} />
            <Route path="/host" element={
              <Host 
                polls={polls} 
                questions={questions} 
                setView={setView} 
                onAddPoll={onAddPoll} 
                activePollIndex={activePollIndex}
                setActivePollIndex={setActivePollIndex}
              />
            } />
            <Route path="/event/:id/present" element={
              <Presenter 
                polls={polls} 
                questions={questions} 
                activePollIndex={activePollIndex}
                leaderboard={leaderboard}
              />
            } />
            <Route path="/event/:id" element={
              <Participant 
                polls={polls} 
                questions={questions} 
                activePollIndex={activePollIndex}
                userVoted={userVoted}
                handleVote={handleVote}
                handleUpvote={handleUpvote}
                newQuestion={newQuestion}
                setNewQuestion={setNewQuestion}
                submitQuestion={submitQuestion}
                username={username}
                setUsername={updateUsername}
              />
            } />
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
