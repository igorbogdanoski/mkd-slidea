import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, ChevronDown, PieChart, MessageSquare, Cloud,
  ClipboardList, Trophy, LineChart, Presentation, Globe,
  Users, School, Briefcase, Calendar, LayoutGrid, LogIn,
  Sun, Moon, Menu, X
} from 'lucide-react';
import LoginModal from './LoginModal';
import LanguageSwitcher from './LanguageSwitcher';
import { warmUp } from '../lib/supabase';
import { useDarkMode } from '../hooks/useDarkMode';
import { useI18n } from '../i18n';

// Every item is a real control with a real destination.
//
// Before: each was a <div onClick> — invisible to keyboard and screen
// readers — and the whole menu only opened on mouseenter, so a keyboard user
// could not reach any of it. Worse, items in "Ресурси" carried no `type` at
// all, so their onClick just closed the menu: they looked like links and did
// nothing. Items that route into the app land anonymous visitors on /demo
// rather than bouncing them into a login modal from a public nav.
const MegaMenu = ({ id, isOpen, items, setView, setActiveMenu, navigate, user }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        id={id}
        className="absolute top-full -left-10 w-[700px] pt-4 z-50"
      >
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10 grid grid-cols-2 gap-10">
          {items.map((section, idx) => (
            <div key={idx}>
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8 border-b border-slate-100 pb-4">
                {section.title}
              </h4>
              <div className="space-y-8">
                {section.links.map((link, lIdx) => (
                  <button
                    key={lIdx}
                    type="button"
                    className="w-full text-left flex gap-6 group rounded-2xl"
                    onClick={() => {
                      setActiveMenu(null);
                      if (link.path) navigate(link.path);
                      else if (link.type) {
                        if (user) setView('host', link.type);
                        else navigate('/demo');
                      }
                    }}
                  >
                    <span className={`w-12 h-12 shrink-0 rounded-2xl ${link.bg} ${link.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-slate-50`}>
                      {link.icon}
                    </span>
                    <span className="block">
                      <span className="block font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                        {link.label}
                      </span>
                      <span className="block text-xs text-slate-500 font-bold leading-relaxed">
                        {link.desc}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Nav = ({ setView, onLogin, onGoogleLogin, user, onLogout, onRequestPasswordReset }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { t } = useI18n();

  useEffect(() => {
    warmUp().catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!user && params.get('login') === '1') {
      setIsLoginOpen(true);
    }
  }, [location.search, user]);

  const openLogin = () => {
    warmUp().catch(() => {});
    setIsLoginOpen(true);
  };

  const closeLogin = () => {
    setIsLoginOpen(false);
    const params = new URLSearchParams(location.search);
    if (params.has('login')) {
      params.delete('login');
      params.delete('next');
      const nextSearch = params.toString();
      navigate(`${location.pathname}${nextSearch ? `?${nextSearch}` : ''}`, { replace: true });
    }
  };

  // Escape closes an open mega-menu and hands focus back to its trigger, so a
  // keyboard user is never stranded inside a panel they cannot dismiss.
  const onMenuKeyDown = (e) => {
    if (e.key !== 'Escape' || !activeMenu) return;
    e.stopPropagation();
    setActiveMenu(null);
    const trigger = e.currentTarget.querySelector('button[aria-haspopup]');
    trigger?.focus();
  };

  const nextPath = (() => {
    const params = new URLSearchParams(location.search);
    const next = params.get('next');
    return next && next.startsWith('/') ? next : '/dashboard';
  })();

  const features = [
    {
      title: "Интеракција",
      links: [
        { label: "Анкети во живо", desc: "Добијте одговори веднаш", icon: <PieChart size={18} />, color: "text-indigo-600", bg: "bg-indigo-50", type: "poll" },
        { label: "Q&A во живо", desc: "Дајте им глас на сите", icon: <MessageSquare size={18} />, color: "text-violet-600", bg: "bg-violet-50", type: "open" },
        { label: "Word Cloud", desc: "Визуелизирајте идеи", icon: <Cloud size={18} />, color: "text-pink-600", bg: "bg-pink-50", type: "wordcloud" }
      ]
    },
    {
      title: "Оценување",
      links: [
        { label: "Квизови", desc: "Учење низ игра", icon: <Trophy size={18} />, color: "text-amber-600", bg: "bg-amber-50", type: "quiz" },
        { label: "Аналитика", desc: "Детални извештаи", icon: <LineChart size={18} />, color: "text-emerald-600", bg: "bg-emerald-50", type: "analytics" },
        { label: "Анкети", desc: "Длабоко истражување", icon: <ClipboardList size={18} />, color: "text-blue-600", bg: "bg-blue-50", type: "survey" }
      ]
    }
  ];

  const solutions = [
    {
      title: "Корпоративни",
      links: [
        { label: "Бизнис состаноци", desc: "Попродуктивни тимови", icon: <Briefcase size={18} />, color: "text-slate-600", bg: "bg-slate-50", path: "/#solutions" },
        { label: "Хибридна работа", desc: "Поврзете ги сите", icon: <Globe size={18} />, color: "text-slate-600", bg: "bg-slate-50", path: "/#solutions" },
        { label: "Обуки", desc: "Развој на вработени", icon: <Users size={18} />, color: "text-slate-600", bg: "bg-slate-50", path: "/#solutions" }
      ]
    },
    {
      title: "Едукација",
      links: [
        { label: "Предавања", desc: "Интерактивни часови", icon: <School size={18} />, color: "text-indigo-600", bg: "bg-indigo-50", path: "/#education" },
        { label: "Вебинари", desc: "Настани во живо", icon: <Presentation size={18} />, color: "text-indigo-600", bg: "bg-indigo-50", path: "/#education" },
        { label: "Училници", desc: "K-12 и Универзитети", icon: <Calendar size={18} />, color: "text-indigo-600", bg: "bg-indigo-50", path: "/schools" }
      ]
    }
  ];

  // "Студии на случај" is gone rather than given a destination: no case
  // studies exist, and a nav item leading to an empty page is the same broken
  // promise as one leading nowhere. Add it back when there is something to
  // link to.
  const resources = [
    {
      title: "Учи",
      links: [
        { label: "Блог", desc: "Најнови вести", icon: <Presentation size={18} />, color: "text-emerald-600", bg: "bg-emerald-50", path: "/blog" },
        { label: "Шаблони", desc: "Готови часови по предмет", icon: <ClipboardList size={18} />, color: "text-emerald-600", bg: "bg-emerald-50", path: "/templates" }
      ]
    },
    {
      title: "Академија",
      links: [
        { label: "Како работи", desc: "Три чекори до час", icon: <Globe size={18} />, color: "text-blue-600", bg: "bg-blue-50", path: "/#how-it-works" },
        { label: "Чести прашања", desc: "Помош и поддршка", icon: <MessageSquare size={18} />, color: "text-blue-600", bg: "bg-blue-50", path: "/#faq" }
      ]
    }
  ];

  return (
    <nav className="fixed top-0 w-full z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => { setView('landing'); setActiveMenu(null); }}
          >
            <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-200">
              <Zap className="text-white w-6 h-6 fill-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
              MKD <span className="text-indigo-600 dark:text-indigo-400">Slidea</span>
            </span>
          </div>
          
          {/* Collapses at xl, not lg. Six primary links plus a six-item utility
              cluster do not fit 1024–1279px: at 1440 the "Регистрирај се"
              button was clipped by the viewport edge and the login/join pair
              wrapped to two lines — the most expensive button on the site,
              unreachable at the most common desktop width. */}
          <div className="hidden nav:flex items-center gap-1">
            {/* Each disclosure opens on hover *and* on click, exposes
                aria-expanded/aria-haspopup, and closes on Escape — before, the
                only way in was a mouse hovering the trigger, which left the
                entire product and solutions navigation unreachable by
                keyboard and unannounced to screen readers. */}
            <div className="relative" onMouseEnter={() => setActiveMenu('features')} onMouseLeave={() => setActiveMenu(null)} onKeyDown={onMenuKeyDown}>
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={activeMenu === 'features'}
                aria-controls="megamenu-features"
                onClick={() => setActiveMenu(activeMenu === 'features' ? null : 'features')}
                className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 transition-colors ${activeMenu === 'features' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}
              >
                {t('nav.product')} <ChevronDown size={14} aria-hidden="true" className={`transition-transform duration-300 ${activeMenu === 'features' ? 'rotate-180' : ''}`} />
              </button>
              <MegaMenu id="megamenu-features" isOpen={activeMenu === 'features'} items={features} setView={setView} setActiveMenu={setActiveMenu} navigate={navigate} user={user} />
            </div>

            <div className="relative" onMouseEnter={() => setActiveMenu('solutions')} onMouseLeave={() => setActiveMenu(null)} onKeyDown={onMenuKeyDown}>
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={activeMenu === 'solutions'}
                aria-controls="megamenu-solutions"
                onClick={() => setActiveMenu(activeMenu === 'solutions' ? null : 'solutions')}
                className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 transition-colors ${activeMenu === 'solutions' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}
              >
                {t('nav.solutions')} <ChevronDown size={14} aria-hidden="true" className={`transition-transform duration-300 ${activeMenu === 'solutions' ? 'rotate-180' : ''}`} />
              </button>
              <MegaMenu id="megamenu-solutions" isOpen={activeMenu === 'solutions'} items={solutions} setView={setView} setActiveMenu={setActiveMenu} navigate={navigate} user={user} />
            </div>

            <button 
              onClick={() => setView('pricing')}
              className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            >
              {t('nav.pricing')}
            </button>
            
            <div className="relative" onMouseEnter={() => setActiveMenu('resources')} onMouseLeave={() => setActiveMenu(null)} onKeyDown={onMenuKeyDown}>
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={activeMenu === 'resources'}
                aria-controls="megamenu-resources"
                onClick={() => setActiveMenu(activeMenu === 'resources' ? null : 'resources')}
                className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 transition-colors ${activeMenu === 'resources' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}
              >
                {t('nav.resources')} <ChevronDown size={14} aria-hidden="true" className={`transition-transform duration-300 ${activeMenu === 'resources' ? 'rotate-180' : ''}`} />
              </button>
              <MegaMenu id="megamenu-resources" isOpen={activeMenu === 'resources'} items={resources} setView={setView} setActiveMenu={setActiveMenu} navigate={navigate} user={user} />
            </div>

            <button
              onClick={() => navigate('/templates')}
              className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            >
              {t('nav.templates')}
            </button>
            <button
              onClick={() => navigate('/scoreboard')}
              className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            >
              {t('nav.scoreboard')}
            </button>
          </div>
        </div>

        {/* Three tiers rather than one switch. The header used to mount the
            language switcher, theme toggle, join link, login and register at
            every width, which ran a 390px phone header off screen and clipped
            the register button at 1440. Collapsing all of it at one breakpoint
            fixed the overflow but hid the primary CTA on 1280px laptops — a
            very common width — so the sign-up path now survives everywhere
            except phones, and only the secondary utilities drop out first. */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Utilities: widest screens only */}
          <div className="hidden nav:flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={toggleDark}
              aria-label={isDark ? t('nav.lightMode') : t('nav.darkMode')}
              title={isDark ? t('nav.lightMode') : t('nav.darkMode')}
              className="p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-indigo-300 dark:hover:bg-slate-800 transition-all"
            >
              {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            </button>
            <button
              onClick={() => setView('join')}
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              {t('nav.join')}
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
          </div>

          {/* Account / sign-up: everything but phones */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <button
                    onClick={() => setView('dashboard')}
                    className="hidden nav:flex bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all items-center gap-2 whitespace-nowrap"
                  >
                    <LayoutGrid size={14} aria-hidden="true" /> {t('nav.adminPanel')}
                  </button>
                )}
                <button
                  onClick={() => setView('dashboard')}
                  className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  {t('nav.myProfile')}
                </button>
                <button
                  onClick={onLogout}
                  className="hidden nav:block text-sm font-semibold text-red-600 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 whitespace-nowrap"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={openLogin}
                  className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition-all px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  {t('nav.login')}
                </button>
                <button
                  onClick={openLogin}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 whitespace-nowrap"
                >
                  {t('nav.register')}
                </button>
              </>
            )}
          </div>

          <button
            className="nav:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
            onClick={() => setMobileOpen(v => !v)}
            aria-label={t('nav.menu', 'Мени')}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            id="mobile-menu"
            className="nav:hidden overflow-hidden border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md max-h-[calc(100vh-5rem)] overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto px-6 py-5 space-y-1">
              {/* "Производ" used to call setView('host') — a protected route, so
                  a visitor with no account was bounced into a login modal by a
                  menu item that promised a product tour. */}
              {[
                { label: t('nav.product'),    action: () => navigate('/demo') },
                { label: t('nav.solutions'),  action: () => { document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' }); } },
                { label: t('nav.pricing'),    action: () => setView('pricing') },
                { label: t('nav.templates'),  action: () => navigate('/templates') },
                { label: t('nav.resources'),  action: () => navigate('/blog') },
                { label: t('nav.scoreboard'), action: () => navigate('/scoreboard') },
                { label: t('nav.join'),       action: () => setView('join') },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => { item.action(); setMobileOpen(false); }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
                >
                  {item.label}
                </button>
              ))}

              {/* The language switcher and theme toggle used to sit in the
                  header at every width, which is what pushed it off-screen on
                  a phone. They belong here. */}
              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 px-1">
                <LanguageSwitcher />
                <button
                  onClick={toggleDark}
                  aria-label={isDark ? t('nav.lightMode') : t('nav.darkMode')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
                  {isDark ? t('nav.lightMode') : t('nav.darkMode')}
                </button>
              </div>

              {user ? (
                <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                  <button
                    onClick={() => { setView('dashboard'); setMobileOpen(false); }}
                    className="flex-1 py-3 text-center text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all"
                  >
                    {t('nav.myProfile')}
                  </button>
                  <button
                    onClick={() => { onLogout(); setMobileOpen(false); }}
                    className="flex-1 py-3 text-center text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-all"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                  <button
                    onClick={() => { setIsLoginOpen(true); setMobileOpen(false); }}
                    className="flex-1 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-400 transition-all"
                  >
                    {t('nav.login')}
                  </button>
                  <button
                    onClick={() => { setIsLoginOpen(true); setMobileOpen(false); }}
                    className="flex-1 py-3 text-center text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    {t('nav.register')}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={closeLogin}
        onLogin={onLogin}
        onGoogleLogin={() => onGoogleLogin(nextPath)}
        onRequestPasswordReset={onRequestPasswordReset}
      />
    </nav>
  );
};

export default Nav;
