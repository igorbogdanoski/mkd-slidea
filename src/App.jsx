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
import { LiveAnnouncerProvider } from './hooks/useLiveAnnouncer';

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
const Checkout = lazy(() => import('./views/Checkout'));
const Blog = lazy(() => import('./views/Blog'));
const BlogPost = lazy(() => import('./views/BlogPost'));
const Schools = lazy(() => import('./views/Schools'));
const Integrations = lazy(() => import('./views/Integrations'));
const EventScoreboard = lazy(() => import('./views/EventScoreboard'));
const Onboarding = lazy(() => import('./views/Onboarding'));

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
      const autoConfirmed = await signUp(email, password, name);
      // Only navigate if Supabase auto-confirmed (no email verification step).
      // If email confirmation is required, the modal shows a "check your email" screen.
      if (autoConfirmed) navigate(nextPath);
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
    ['/', '/join', '/pricing', '/scoreboard', '/schools', '/integrations', '/demo'].includes(location.pathname) ||
    location.pathname === '/templates' ||
    location.pathname.startsWith('/templates/') ||
    location.pathname.startsWith('/blog') ||
    location.pathname.startsWith('/checkout');
  const showPublicShellWhileLoading = loading && isPublicRoute && !user;

  // Protected route — redirects to / with login modal open if not authenticated.
  // Never redirects while loading=true to avoid race condition on cold start.
  const ProtectedRoute = ({ children }) => {
    if (loading) return null;
    if (!user) {
      const nextPath = `${location.pathname}${location.search}`;
      return <Navigate to={`/?login=1&next=${encodeURIComponent(nextPath)}`} replace />;
    }
    return children;
  };

  if (loading && !showPublicShellWhileLoading && !isEventRoute) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 font-bold text-sm animate-pulse">{loadingMessage}</p>
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
                  <p className="text-slate-500 font-bold text-sm">Се вчитува...</p>
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Landing code={code} setCode={setCode} setView={setView} />} />
                <Route path="/join" element={<Join code={code} setCode={setCode} handleJoin={handleJoin} setView={setView} />} />
                <Route path="/host" element={<ProtectedRoute><Host setView={setView} user={user} /></ProtectedRoute>} />
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding user={user} /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard setView={setView} user={user} onLogout={handleLogout} /></ProtectedRoute>} />
                <Route path="/pricing" element={<Pricing setView={setView} />} />
                <Route path="/checkout" element={<Checkout user={user} />} />
                <Route path="/checkout/:planCode" element={<Checkout user={user} />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/templates" element={<PublicTemplates />} />
                <Route path="/templates/:slug" element={<PublicTemplateDetail />} />
                <Route path="/scoreboard" element={<PublicScoreboard />} />
                <Route path="/event/:id/scores" element={<EventScoreboard />} />
                <Route path="/event/:id/present" element={<EventWrapper type="present" />} />
                <Route path="/event/:id/embed" element={<Embed />} />
                <Route
                  path="/event/:id"
                  element={<EventWrapper type="participant" username={username} setUsername={updateUsername} />}
                />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/schools" element={<Schools />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AnimatePresence>
      </main>

      {isPublicRoute && (
        <footer className="bg-slate-900 text-slate-400 pt-16 pb-8 mt-0">
          <div className="max-w-7xl mx-auto px-6">
            {/* Top grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
              {/* Brand */}
              <div className="col-span-2 md:col-span-1 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  </div>
                  <span className="font-black text-white text-lg">MKD Slidea</span>
                </div>
                <p className="text-sm leading-relaxed">Интерактивни презентации, анкети и квизови во живо. Направено во Македонија 🇲🇰</p>
                {/* Social */}
                <div className="flex gap-3 pt-2">
                  {[
                    { label: 'LinkedIn', href: 'https://linkedin.com', icon: 'in' },
                    { label: 'Facebook', href: 'https://facebook.com', icon: 'f' },
                    { label: 'Instagram', href: 'https://instagram.com', icon: '✦' },
                  ].map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 bg-slate-800 hover:bg-indigo-600 rounded-xl flex items-center justify-center text-xs font-black text-slate-300 hover:text-white transition-all"
                      aria-label={s.label}
                    >{s.icon}</a>
                  ))}
                </div>
              </div>

              {/* Производ */}
              <div className="space-y-3">
                <h4 className="text-white font-black text-sm uppercase tracking-widest mb-4">Производ</h4>
                {[
                  { label: 'Функционалности', view: 'host' },
                  { label: 'Шаблони', path: '/templates' },
                  { label: 'Ценовник', view: 'pricing' },
                  { label: 'Скорборд', path: '/scoreboard' },
                ].map((l) => (
                  <div key={l.label}>
                    {l.path ? (
                      <a href={l.path} className="text-sm hover:text-white transition-colors block">{l.label}</a>
                    ) : (
                      <button onClick={() => setView(l.view)} className="text-sm hover:text-white transition-colors text-left">{l.label}</button>
                    )}
                  </div>
                ))}
              </div>

              {/* Решенија */}
              <div className="space-y-3">
                <h4 className="text-white font-black text-sm uppercase tracking-widest mb-4">Решенија</h4>
                {['За образование', 'За бизнис и HR', 'За вебинари', 'За обуки'].map((l) => (
                  <div key={l} className="text-sm hover:text-white transition-colors cursor-pointer">{l}</div>
                ))}
              </div>

              {/* Поддршка */}
              <div className="space-y-3">
                <h4 className="text-white font-black text-sm uppercase tracking-widest mb-4">Поддршка</h4>
                {[
                  { label: 'Брз старт', path: '/' },
                  { label: 'Блог', path: '/blog' },
                  { label: 'Интеграции', path: '/integrations' },
                  { label: 'Пријави проблем', href: 'mailto:support@slidea.mismath.net' },
                ].map((l) => (
                  <div key={l.label}>
                    {l.href ? (
                      <a href={l.href} className="text-sm hover:text-white transition-colors block">{l.label}</a>
                    ) : (
                      <a href={l.path} className="text-sm hover:text-white transition-colors block">{l.label}</a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
              <p className="font-bold">© {new Date().getFullYear()} MKD Slidea. Сите права задржани.</p>
              <div className="flex gap-6">
                <a href="/privacy" className="hover:text-white transition-colors">{t('footer.privacy')}</a>
                <a href="/terms" className="hover:text-white transition-colors">{t('footer.terms')}</a>
                <span className="text-indigo-400 font-bold">Направено со ❤️ во МК</span>
              </div>
            </div>
          </div>
        </footer>
      )}

      <KeyboardShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
};

const App = () => (
  <Router>
    <I18nProvider>
      <LiveAnnouncerProvider>
        <AppContent />
      </LiveAnnouncerProvider>
    </I18nProvider>
  </Router>
);

export default App;
