import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Nav from './components/Nav';
import Landing from './views/Landing';
import Join from './views/Join';
import Host from './views/Host';
import Dashboard from './views/Dashboard';
import Pricing from './views/Pricing';
import EventWrapper from './components/EventWrapper';
import Embed from './views/Embed';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState('');
  const [username, setUsername] = useState(() => localStorage.getItem('mkd_slidea_user') || '');

  const { user, loading, loadingMessage, signIn, signUp, signInWithMagicLink, signOut } = useAuth();

  const updateUsername = (val) => {
    setUsername(val);
    localStorage.setItem('mkd_slidea_user', val);
  };

  const handleLogin = async (email, password, mode = 'password', name = '') => {
    if (mode === 'magic') {
      await signInWithMagicLink(email);
    } else if (mode === 'register') {
      await signUp(email, password, name);
      navigate('/dashboard');
    } else {
      await signIn(email, password);
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const setView = (view, type = 'poll') => {
    const routes = {
      landing: '/',
      join: '/join',
      host: '/host',
      dashboard: '/dashboard',
      pricing: '/pricing',
    };
    if (routes[view]) {
      navigate(routes[view], view === 'host' ? { state: { initialType: type } } : {});
    }
  };

  const handleJoin = (e) => {
    if (e) e.preventDefault();
    if (code.length === 6) navigate('/event/' + code);
  };

  const isPublicRoute = ['/', '/join', '/pricing'].includes(location.pathname);

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 font-bold text-sm animate-pulse">{loadingMessage}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {isPublicRoute && (
        <Nav setView={setView} onLogin={handleLogin} user={user} onLogout={handleLogout} />
      )}

      <main className={isPublicRoute ? 'pt-16' : ''}>
        <AnimatePresence mode="wait">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Landing code={code} setCode={setCode} setView={setView} />} />
              <Route path="/join" element={<Join code={code} setCode={setCode} handleJoin={handleJoin} setView={setView} />} />
              <Route path="/host" element={<Host setView={setView} user={user} />} />
              <Route path="/dashboard" element={<Dashboard setView={setView} user={user} onLogout={handleLogout} />} />
              <Route path="/pricing" element={<Pricing setView={setView} />} />
              <Route path="/event/:id/present" element={<EventWrapper type="present" />} />
              <Route path="/event/:id/embed" element={<Embed />} />
              <Route
                path="/event/:id"
                element={<EventWrapper type="participant" username={username} setUsername={updateUsername} />}
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </ErrorBoundary>
        </AnimatePresence>
      </main>

      {isPublicRoute && (
        <footer className="py-12 text-center text-slate-400 text-sm font-medium border-t border-slate-100 mt-20">
          <div className="flex items-center justify-center gap-6 mb-4">
            <a href="#" className="hover:text-indigo-600 transition-colors">Политика на приватност</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Услови за користење</a>
            <a href="#" className="hover:text-indigo-600 transition-colors text-indigo-600">Направено со ❤️ во МК</a>
          </div>
          <p className="font-bold">© 2026 MKD Slidea • Автор: Игор Богданоски</p>
        </footer>
      )}
    </div>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
