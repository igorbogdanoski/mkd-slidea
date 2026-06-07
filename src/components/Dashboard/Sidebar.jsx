import React, { useState, useEffect } from 'react';
import {
  Home, Presentation, LayoutGrid, Users,
  CreditCard, Share2, Trash2, LogOut, BarChart2, Lock, Shield, Gift, KeyRound, User, Sparkles, Building2, Receipt,
  CheckCircle2, Circle, ChevronDown, ChevronUp, X, Zap,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PLANS, isPro } from '../../lib/plans';

const DISMISS_KEY = 'mkd_checklist_dismissed_until';

const useOnboardingProgress = (userId) => {
  const [steps, setSteps] = useState({ created_event: false, added_question: false, shared: false, viewed_results: false });

  useEffect(() => {
    if (!userId) return;
    const shared = !!localStorage.getItem('mkd_shared_session');
    const viewed = !!localStorage.getItem('mkd_viewed_results');
    (async () => {
      const { data: evs } = await supabase.from('events').select('id').eq('user_id', userId).limit(10);
      const hasEvent = (evs?.length || 0) > 0;
      let hasQuestion = false;
      if (hasEvent) {
        const { count } = await supabase.from('polls').select('id', { count: 'exact', head: true }).in('event_id', evs.map(e => e.id));
        hasQuestion = (count || 0) > 0;
      }
      setSteps({ created_event: hasEvent, added_question: hasQuestion, shared, viewed_results: viewed });
    })();
  }, [userId]);

  return steps;
};

const OnboardingChecklist = ({ user, setActiveTab }) => {
  const steps = useOnboardingProgress(user?.id);
  const [open, setOpen] = useState(true);

  const isDismissed = () => {
    try {
      const until = localStorage.getItem(DISMISS_KEY);
      return until && Date.now() < Number(until);
    } catch { return false; }
  };
  const dismiss = (e) => {
    e.stopPropagation();
    try { localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000)); } catch { /* ignore */ }
    setOpen(false);
  };

  const items = [
    { key: 'created_event',   label: 'Создај прв настан',       action: () => setActiveTab('presentations') },
    { key: 'added_question',  label: 'Додај прашање',            action: () => setActiveTab('home') },
    { key: 'shared',          label: 'Сподели со учесници',      action: null },
    { key: 'viewed_results',  label: 'Прегледај резултати',      action: () => setActiveTab('analytics') },
  ];
  const done = items.filter(i => steps[i.key]).length;
  const allDone = done === items.length;

  if (isDismissed() || (allDone && !open)) return null;

  return (
    <div className="mx-4 mb-3 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl border border-indigo-100 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex gap-0.5">
            {items.map((_, i) => (
              <div key={i} className={`w-5 h-1.5 rounded-full transition-all ${i < done ? 'bg-indigo-600' : 'bg-indigo-200'}`} />
            ))}
          </div>
          <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">
            {allDone ? '🎉 Подготвен!' : `${done}/4 чекори`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={dismiss} className="p-1 hover:bg-indigo-100 rounded-lg transition-colors text-indigo-400">
            <X size={12} />
          </button>
          {open ? <ChevronUp size={14} className="text-indigo-400" /> : <ChevronDown size={14} className="text-indigo-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-4 space-y-2">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={item.action || undefined}
              disabled={!item.action || steps[item.key]}
              className="w-full flex items-center gap-2.5 text-left group"
            >
              {steps[item.key]
                ? <CheckCircle2 size={15} className="text-indigo-600 shrink-0" />
                : <Circle size={15} className="text-indigo-300 shrink-0 group-hover:text-indigo-500 transition-colors" />
              }
              <span className={`text-xs font-bold transition-colors ${steps[item.key] ? 'text-slate-400 line-through' : 'text-slate-700 group-hover:text-indigo-600'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Usage Meter ────────────────────────────────────────────────────────────

const useEventCount = (userId) => {
  const [count, setCount] = useState(null);
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .then(({ count: c }) => setCount(c ?? 0));
  }, [userId]);
  return count;
};

const UsageMeter = ({ user, setActiveTab }) => {
  const eventCount = useEventCount(user?.id);
  const plan = PLANS[user?.plan] || PLANS.free;
  const limit = plan.maxActiveEvents;

  // Hidden for paid plans (unlimited events)
  if (isPro(user) || limit === Infinity || eventCount === null) return null;

  const pct = Math.min((eventCount / limit) * 100, 100);
  const isWarn = pct >= 60 && pct < 90;
  const isCrit = pct >= 90;

  const barColor = isCrit
    ? 'bg-red-500'
    : isWarn
    ? 'bg-amber-400'
    : 'bg-indigo-500';

  const textColor = isCrit
    ? 'text-red-600'
    : isWarn
    ? 'text-amber-600'
    : 'text-indigo-600';

  return (
    <div className="mx-4 mb-3 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-100 dark:border-slate-700 px-5 py-4">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Настани
        </span>
        <span className={`text-xs font-black tabular-nums ${textColor}`}>
          {eventCount}/{limit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {isCrit ? (
        <div className="mt-3">
          <p className="text-[10px] font-bold text-red-500 mb-2">
            {eventCount >= limit ? 'Го достигнавте лимитот!' : 'Скоро го достигнувате лимитот'}
          </p>
          <button
            onClick={() => setActiveTab('plan')}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-colors"
          >
            <Zap size={10} /> Надгради → Pro
          </button>
        </div>
      ) : isWarn ? (
        <p className="mt-2 text-[10px] font-bold text-amber-500">
          Уште {limit - eventCount} настан{limit - eventCount === 1 ? '' : 'и'} на бесплатниот план.{' '}
          <button
            onClick={() => setActiveTab('plan')}
            className="text-indigo-500 hover:text-indigo-700 underline underline-offset-2 transition-colors"
          >
            Надгради
          </button>
        </p>
      ) : (
        <p className="mt-2 text-[10px] font-medium text-slate-400 dark:text-slate-500">
          Бесплатен план · {limit - eventCount} достапни
        </p>
      )}
    </div>
  );
};

// ── Sidebar ────────────────────────────────────────────────────────────────

const Sidebar = ({ activeTab, setActiveTab, user, onLogout }) => {
  const userPlan = user?.plan || 'basic';

  const menuItems = [
    { id: 'home', label: 'Почетна', icon: <Home size={20} /> },
    { id: 'presentations', label: 'Мои презентации', icon: <Presentation size={20} /> },
    { id: 'analytics', label: 'Аналитика', icon: <BarChart2 size={20} />, locked: userPlan === 'basic' },
    { id: 'semantic', label: 'AI пребарување', icon: <Sparkles size={20} /> },
    { id: 'templates', label: 'Сите шаблони', icon: <LayoutGrid size={20} /> },
    { id: 'team', label: 'Креирај тим', icon: <Users size={20} />, locked: userPlan === 'basic' },
    { id: 'organizations', label: 'Организации', icon: <Building2 size={20} /> },
    { id: 'plan', label: 'Мој план', icon: <CreditCard size={20} /> },
    { id: 'profile', label: 'Профил', icon: <User size={20} /> },
    { id: 'referrals', label: 'Препорачај', icon: <Gift size={20} /> },
    ...(user?.role === 'admin' ? [
      { id: 'admin', label: 'Админ панел', icon: <Shield size={20} /> },
      { id: 'orders', label: 'Нарачки/Уплати', icon: <Receipt size={20} /> },
    ] : []),
    { id: 'integrations', label: 'Интеграции', icon: <Share2 size={20} /> },
    { id: 'api', label: 'API клучеви', icon: <KeyRound size={20} /> },
    { id: 'trash', label: 'Корпа', icon: <Trash2 size={20} /> },
  ];

  return (
    <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-700 flex flex-col h-screen sticky top-0 overflow-hidden">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
          <Presentation size={20} />
        </div>
        <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">MKD Slidea</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-2 pt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            data-tour={`sidebar-${item.id}`}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all relative ${
              activeTab === item.id
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 shadow-sm'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {item.icon}
            {item.label}
            {item.locked && (
              <Lock size={14} className="ml-auto text-slate-300" />
            )}
            {activeTab === item.id && !item.locked && (
              <div className="ml-auto w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            )}
          </button>
        ))}
      </nav>

      <OnboardingChecklist user={user} setActiveTab={setActiveTab} />
      <UsageMeter user={user} setActiveTab={setActiveTab} />

      <div className="p-4 mt-auto">
        {userPlan === 'basic' && (
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100 mb-4 overflow-hidden relative group cursor-pointer">
            <div className="relative z-10">
              <h4 className="font-black mb-1">Upgrade to PRO</h4>
              <p className="text-[10px] font-bold text-indigo-100 mb-4 opacity-80 uppercase tracking-widest">Неограничени учесници</p>
              <button onClick={() => setActiveTab('plan')} className="w-full py-2.5 bg-white text-indigo-600 rounded-xl font-black text-xs hover:bg-indigo-50 transition-colors">
                Види планови →
              </button>
            </div>
            <CreditCard className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 rotate-12 group-hover:scale-110 transition-transform" />
          </div>
        )}
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm text-red-400 hover:bg-red-50 transition-all mb-4"
        >
          <LogOut size={20} />
          Одјави се
        </button>

        <div className="px-6 py-4 border-t border-slate-50 dark:border-slate-700 text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-center leading-relaxed">
          © 2026 MKD Slidea <br />
          Автор: Игор Богданоски
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
