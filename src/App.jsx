import React, { useState, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Nav from './components/Nav';
import Join from './views/Join';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useDarkMode } from './hooks/useDarkMode';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import { I18nProvider, useI18n } from './i18n';

const Landing = lazy(() => import('./views/Landing'));
const Host = lazy(() => import('./views/Host'));
const Dashboard = lazy(() => import('./views/Dashboard'));
const Pricing = lazy(() => import('./views/Pricing'));
const EventWrapper = lazy(() => import('./components/EventWrapper'));
const Embed = lazy(() => import('./views/Embed'));
const Demo = lazy(() => import('./views/Demo'));
const PublicTemplates = lazy(() =>
  import('./views/PublicTemplates').then((m) => ({ default: m.default }))
);
const PublicTemplateDetail = lazy(() =>
  import('./views/PublicTemplates').then((m) => ({ default: m.PublicTemplateDetail }))
);
const PublicScoreboard = lazy(() => import('./views/PublicScoreboard'));

// Suppress Supabase auth lock violations and permissions policy violations
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = function(...args) {
    const msg = String(args[0] || '');
    const isLockViolation = msg.includes('lock:sb-') && msg.includes('was released');
    const isPermissionsPolicyViolation = msg.includes('Permissions policy violation');
    
    if (isLockViolation || isPermissionsPolicyViolation) {
      return;
    }
    originalError.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const msg = String(event.reason?.message || event.reason || '');
    const isLockViolation = msg.includes('lock:sb-') && msg.includes('was released');
    
    if (isLockViolation) {
      event.preventDefault();
      return;
    }
  }, false);
}

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [username, setUsername] = useState(() => localStorage.getItem('mkd_slidea_user') || '');
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useKeyboardShortcuts({
    '?': () => setShortcutsOpen((v) => !v),
  });

  // Apply persisted theme on every route (Nav only mounts on public routes).
  useDarkMode();

  // Capture ?ref=USERID for Sprint 5.4 referral attribution (persists 90 days).
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const ref = params.get('ref');
      if (ref && /^[0-9a-f-]{8,40}$/i.test(ref)) {
        const existing = localStorage.getItem('mkd_referrer');
        if (!existing) {
          localStorage.setItem('mkd_referrer', ref);
          localStorage.setItem('mkd_referrer_ts', String(Date.now()));
        }
      }
    } catch { /* ignore */ }
  }, [location.search]);

  const isEventRoute = location.pathname.startsWith('/event/');

  const { user, loading, loadingMessage, signIn, signUp, signInWithGoogle, signInWithMagicLink, signOut } = useAuth({ enabled: !isEventRoute });

  const getSafeNextPath = () => {
    const params = new URLSearchParams(location.search);
    const next = params.get('next');
    if (!next || !next.startsWith('/')) return '/dashboard';
    return next;
  };

  const updateUsername = (val) => {
    setUsername(val);
    localStorage.setItem('mkd_slidea_user', val);
  };

  const handleLogin = async (email, password, mode = 'password', name = '') => {
    const nextPath = getSafeNextPath();
    if (mode === 'magic') {
      await signInWithMagicLink(email);
    } else if (mode === 'register') {
      await signUp(email, password, name);
      navigate(nextPath);
    } else {
      await signIn(email, password);
      navigate(nextPath);
    }
  };

  const handleGoogleLogin = async (nextPath = '/dashboard') => {
    await signInWithGoogle(nextPath);
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
      demo: '/demo',
    };
    if (routes[view]) {
      navigate(routes[view], view === 'host' ? { state: { initialType: type } } : {});
    }
  };

  const handleJoin = (e) => {
    if (e) e.preventDefault();
    const cleanCode = (code || '').replace(/^#/, '').trim().toUpperCase();
    if (cleanCode.length === 6) navigate('/event/' + cleanCode);
  };

  const isPublicRoute =
    ['/', '/join', '/pricing', '/scoreboard'].includes(location.pathname) ||
    location.pathname === '/templates' ||
    location.pathname.startsWith('/templates/');
  const showPublicShellWhileLoading = loading && isPublicRoute && !user;

  // Protected route — redirects to / with login modal open if not authenticated
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      const nextPath = `${location.pathname}${location.search}`;
      return <Navigate to={`/?login=1&next=${encodeURIComponent(nextPath)}`} replace />;
    }
    return children;
  };

  if (loading && !showPublicShellWhileLoading && !isEventRoute) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 font-bold text-sm animate-pulse">{loadingMessage}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 selection:text-indigo-700 transition-colors">
      {/* Skip-to-content link for keyboard / screen-reader users (WCAG 2.4.1). */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[1000] focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-xl focus:font-black focus:shadow-2xl"
      >
        {t('common.skipToContent')}
      </a>

      {isPublicRoute && (
        <Nav setView={setView} onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} user={user} onLogout={handleLogout} />
      )}

      <main id="main-content" className={isPublicRoute ? 'pt-16' : ''}>
        <AnimatePresence mode="wait">
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="min-h-[50vh] bg-[#F8FAFC] flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-400 font-bold text-sm">Се вчитува...</p>
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Landing code={code} setCode={setCode} setView={setView} />} />
                <Route path="/join" element={<Join code={code} setCode={setCode} handleJoin={handleJoin} setView={setView} />} />
                <Route path="/host" element={<ProtectedRoute><Host setView={setView} user={user} /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard setView={setView} user={user} onLogout={handleLogout} /></ProtectedRoute>} />
                <Route path="/pricing" element={<Pricing setView={setView} />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/templates" element={<PublicTemplates />} />
                <Route path="/templates/:slug" element={<PublicTemplateDetail />} />
                <Route path="/scoreboard" element={<PublicScoreboard />} />
                <Route path="/event/:id/present" element={<EventWrapper type="present" />} />
                <Route path="/event/:id/embed" element={<Embed />} />
                <Route
                  path="/event/:id"
                  element={<EventWrapper type="participant" username={username} setUsername={updateUsername} />}
                />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AnimatePresence>
      </main>

      {isPublicRoute && (
        <footer className="py-12 text-center text-slate-400 text-sm font-medium border-t border-slate-100 mt-20">
          <div className="flex items-center justify-center gap-6 mb-4">
            <a href="#" className="hover:text-indigo-600 transition-colors">{t('footer.privacy')}</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">{t('footer.terms')}</a>
            <a href="#" className="hover:text-indigo-600 transition-colors text-indigo-600">{t('footer.madeIn')}</a>
          </div>
          <p className="font-bold">{t('footer.copyright')}</p>
        </footer>
      )}

      <KeyboardShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
};

const App = () => (
  <Router>
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  </Router>
);

export default App;
