import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, Pause, Play, Timer, TimerOff } from 'lucide-react';
import confetti from 'canvas-confetti';
import AnimatedBackground from '../components/AnimatedBackground';
import SentimentHeatmap from '../components/SentimentHeatmap';
import LiveCaptions from '../components/LiveCaptions';
import CurriculumBenchmarkBadge from '../components/CurriculumBenchmarkBadge';
import DrawingCanvas from '../components/DrawingCanvas';
import { MODES } from '../components/Presenter/ChartViews';
import PollResultsRenderer from '../components/Presenter/PollResultsRenderer';
import PresenterHeader from '../components/Presenter/PresenterHeader';
import FloatingReactions from '../components/Presenter/FloatingReactions';
import PresenterSidebar from '../components/Presenter/PresenterSidebar';
import { useEventStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useLiveAnnouncer } from '../hooks/useLiveAnnouncer';

const toggleFullscreen = () => {
  try {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  } catch { /* unsupported */ }
};

// Confetti — bundled via npm so it works under strict CSP and offline.
const fireConfetti = () => {
  try {
    confetti({ particleCount: 180, spread: 100, origin: { y: 0.6 }, colors: ['#6366f1','#8b5cf6','#10b981','#f59e0b','#ef4444','#ffffff'] });
    setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 } }), 300);
    setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 } }), 500);
  } catch { /* canvas unavailable */ }
};

// ─── Main Presenter ───────────────────────────────────────────────────────────
const Presenter = ({ event, polls, questions, activePollIndex, leaderboard, reactions = [], markQuestionAnswered, setQuestionPinned, setQuestionHidden, onToggleLock, onStartTimer, onStopTimer }) => {
  const { activeParticipants, activeNow } = useEventStore();
  const [chartMode, setChartMode] = useState('bars');
  const [timerPickerOpen, setTimerPickerOpen] = useState(false);
  const [lockPending, setLockPending] = useState(false);
  const timerPickerRef = useRef(null);

  useKeyboardShortcuts({
    'F': toggleFullscreen,
    'f': toggleFullscreen,
    'N': () => setShowNotes((v) => !v),
    'n': () => setShowNotes((v) => !v),
    'D': () => setShowDraw((v) => !v),
    'd': () => setShowDraw((v) => !v),
    'L': () => handleToggleLock(),
    'l': () => handleToggleLock(),
  });

  // Close timer picker on outside click
  useEffect(() => {
    if (!timerPickerOpen) return;
    const close = (e) => {
      if (timerPickerRef.current && !timerPickerRef.current.contains(e.target)) {
        setTimerPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [timerPickerOpen]);

  const [timerRemaining, setTimerRemaining] = useState(null);
  const [surveyResponses, setSurveyResponses] = useState([]);
  const [confettiFired, setConfettiFired] = useState(false);
  // Sprint 8.3.6 — speaker notes overlay (host-only). Toggle: 'N' key.
  const [showNotes, setShowNotes] = useState(false);
  // Г.1 — Drawing annotations overlay. Toggle: 'D' key.
  const [showDraw, setShowDraw] = useState(false);

  const eventCode = event?.code || '982341';
  const joinUrl = `${window.location.origin}/event/${eventCode}`;
  const brandColor = event?.brand_color || '#6366f1';
  const logoUrl = event?.logo_url || null;
  const brandFont = event?.brand_font || null;
  const currentPoll = polls[activePollIndex] || {
    question: 'Чекаме да започне првата анкета...',
    options: [], is_quiz: false, type: 'poll',
  };

  // If moderation is on but nothing approved yet, fallback to all options to keep live view responsive
  const approvedOptions = (currentPoll.options || []).filter(o => o.is_approved !== false);
  const visibleOptions = currentPoll.needs_moderation
    ? (approvedOptions.length > 0 ? approvedOptions : (currentPoll.options || []))
    : (currentPoll.options || []);

  const totalVotes = visibleOptions.reduce((a, b) => a + (b.votes || 0), 0) || 0;
  const averageRating = totalVotes > 0
    ? (visibleOptions.reduce((acc, opt) => acc + (parseInt(opt.text) * (opt.votes || 0)), 0) / totalVotes).toFixed(1)
    : 0;

  // Reset chart mode when switching polls
  useEffect(() => { setChartMode('bars'); setConfettiFired(false); }, [activePollIndex]);

  // Sprint 4.1 WCAG — announce poll changes & key state to screen readers.
  const { announce } = useLiveAnnouncer();
  useEffect(() => {
    if (currentPoll && currentPoll.question) {
      announce(`Активност ${activePollIndex + 1} од ${polls.length || 1}: ${currentPoll.question}`);
    }
  }, [activePollIndex, currentPoll?.id]);
  useEffect(() => {
    if (event?.is_locked) {
      announce('Гласањето е заклучено.', { assertive: true });
    }
  }, [event?.is_locked]);

  // Auto-confetti: when a quiz has responses from all (or most) participants
  useEffect(() => {
    if (!currentPoll.is_quiz || confettiFired) return;
    if (activeParticipants > 0 && totalVotes >= activeParticipants) {
      setConfettiFired(true);
      fireConfetti();
    }
  }, [totalVotes, activeParticipants, currentPoll.is_quiz, confettiFired]);

  // Timer countdown from per-poll timer_ends_at
  useEffect(() => {
    if (!currentPoll?.timer_ends_at) { setTimerRemaining(null); return; }
    const calc = () => {
      const rem = Math.max(0, Math.round((new Date(currentPoll.timer_ends_at) - Date.now()) / 1000));
      setTimerRemaining(rem);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [currentPoll?.timer_ends_at]);

  // Fetch survey responses for current poll (type=survey only)
  useEffect(() => {
    if (currentPoll.type !== 'survey') { setSurveyResponses([]); return; }
    const fetchResponses = async () => {
      const { data } = await supabase.from('survey_responses').select('answers').eq('poll_id', currentPoll.id);
      setSurveyResponses(data || []);
    };
    fetchResponses();
    const ch = supabase.channel(`survey-${currentPoll.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'survey_responses', filter: `poll_id=eq.${currentPoll.id}` }, fetchResponses)
      .subscribe();
    return () => ch.unsubscribe();
  }, [currentPoll.id, currentPoll.type]);

  // Pause / Resume helper
  const handleToggleLock = useCallback(async () => {
    if (!onToggleLock || lockPending) return;
    setLockPending(true);
    try { await onToggleLock(); } finally { setLockPending(false); }
  }, [onToggleLock, lockPending]);

  const handleStartTimer = useCallback(async (seconds) => {
    if (!onStartTimer || !currentPoll?.id) return;
    setTimerPickerOpen(false);
    await onStartTimer(seconds, currentPoll.id);
  }, [onStartTimer, currentPoll?.id]);

  const handleStopTimer = useCallback(async () => {
    if (!onStopTimer || !currentPoll?.id) return;
    await onStopTimer(currentPoll.id);
  }, [onStopTimer, currentPoll?.id]);

  // Types that support chart mode switching
  const supportsChartSwitch = ['poll', 'ranking'].includes(currentPoll.type) || currentPoll.is_quiz;

  const getSubTitle = () => {
    if (currentPoll.type === 'wordcloud') return '☁️ Облак со зборови';
    if (currentPoll.type === 'open')      return '💬 Отворени одговори';
    if (currentPoll.type === 'rating')    return '⭐ Оценување во живо';
    if (currentPoll.type === 'ranking')   return '🏅 Рангирање во живо';
    if (currentPoll.type === 'scale')     return '📊 Скала во живо';
    if (currentPoll.type === 'survey')    return '📋 Формулар во живо';
    if (currentPoll.is_quiz)              return '🏆 Квиз во живо';
    return '📊 Анкета во живо';
  };

  return (
    <div
      className="min-h-screen bg-slate-900 text-white flex flex-col p-12 overflow-hidden relative isolate"
      style={brandFont ? { fontFamily: brandFont } : undefined}
    >
      <AnimatedBackground color={brandColor} variant={event?.bg_variant || 'aurora'} />
      <SentimentHeatmap reactions={reactions} />
      <LiveCaptions lang="mk-MK" broadcastChannel={eventCode} />

      {/* ── Floating Reactions + cumulative counter ───────────────────── */}
      <FloatingReactions reactions={reactions} />

      {/* Top Header */}
      <PresenterHeader
        event={event}
        eventCode={eventCode}
        joinUrl={joinUrl}
        brandColor={brandColor}
        logoUrl={logoUrl}
        subtitle={getSubTitle()}
        timerRemaining={timerRemaining}
      />

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-14">
        {/* Left: Poll results */}
        <div className="col-span-8 space-y-10">
          {currentPoll.cover_url && (
            <motion.img
              key={currentPoll.cover_url}
              src={currentPoll.cover_url}
              alt=""
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl shadow-2xl shadow-slate-900/10 max-h-[280px] object-cover w-auto border border-slate-100"
              loading="lazy"
            />
          )}
          <motion.h2
            key={currentPoll.question}
            initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}
            className="text-6xl font-black leading-tight max-w-4xl whitespace-pre-line"
          >
            {currentPoll.question}
          </motion.h2>

          <CurriculumBenchmarkBadge poll={currentPoll} />

          <AnimatePresence mode="wait">
            <motion.div key={chartMode + activePollIndex}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
            >
              <PollResultsRenderer
                currentPoll={currentPoll}
                visibleOptions={visibleOptions}
                totalVotes={totalVotes}
                surveyResponses={surveyResponses}
                averageRating={averageRating}
                chartMode={chartMode}
              />
            </motion.div>
          </AnimatePresence>

          {/* Chart mode switcher — only for switchable types */}
          {supportsChartSwitch && (
            <div className="flex items-center gap-3 pt-2">
              <span className="text-slate-600 font-black text-xs uppercase tracking-widest mr-2">Приказ:</span>
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => setChartMode(m.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm transition-all ${
                    chartMode === m.id
                      ? 'text-white shadow-lg'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
                  style={chartMode === m.id ? { backgroundColor: brandColor } : {}}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Q&A / Leaderboard */}
        <PresenterSidebar
          currentPoll={currentPoll}
          leaderboard={leaderboard}
          questions={questions}
          activeParticipants={activeParticipants}
          activeNow={activeNow}
          totalVotes={totalVotes}
          brandColor={brandColor}
          markQuestionAnswered={markQuestionAnswered}
          setQuestionPinned={setQuestionPinned}
          setQuestionHidden={setQuestionHidden}
        />
      </div>

      {/* Г.1 — Drawing annotations overlay (host-only, toggle 'D') */}
      <DrawingCanvas active={showDraw} onClose={() => setShowDraw(false)} />

      {/* Sprint 8.3.6 — Presenter notes overlay (host-only, toggle 'N') */}
      <AnimatePresence>
        {showNotes && currentPoll?.presenter_notes && (
          <motion.div
            key="presenter-notes"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 right-6 z-[60] max-w-md bg-amber-50 border-2 border-amber-300 rounded-3xl shadow-2xl p-5 text-slate-800"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
                Белешки за презентер
              </div>
              <button
                type="button"
                onClick={() => setShowNotes(false)}
                className="text-amber-600 hover:text-amber-800 text-xs font-black uppercase tracking-widest"
              >
                N · скриј
              </button>
            </div>
            <p className="text-sm font-bold whitespace-pre-wrap leading-relaxed">
              {currentPoll.presenter_notes}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Countdown overlay — last 5 seconds */}
      <AnimatePresence>
        {timerRemaining !== null && timerRemaining > 0 && timerRemaining <= 5 && (
          <motion.div
            key={timerRemaining}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'backOut' }}
            className="fixed inset-0 z-[80] flex items-center justify-center pointer-events-none"
          >
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-3xl opacity-40"
                style={{ backgroundColor: timerRemaining <= 3 ? '#ef4444' : '#f59e0b', transform: 'scale(2)' }}
              />
              <p
                className="relative text-[22rem] font-black tabular-nums leading-none select-none"
                style={{ color: timerRemaining <= 3 ? '#ef4444' : '#f59e0b', textShadow: '0 0 80px currentColor' }}
              >
                {timerRemaining}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause overlay banner */}
      <AnimatePresence>
        {event?.is_locked && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[70] flex items-center justify-center gap-4 py-3 bg-red-600 text-white font-black text-sm uppercase tracking-widest"
          >
            <Pause className="w-4 h-4" />
            Гласањето е паузирано — учесниците не можат да гласаат
            {onToggleLock && (
              <button
                onClick={handleToggleLock}
                className="ml-4 px-4 py-1 bg-white text-red-600 rounded-xl text-xs font-black hover:bg-red-50 transition-all"
              >
                <Play className="w-3 h-3 inline mr-1" /> Продолжи
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="mt-auto pt-8 flex items-center justify-between border-t border-slate-800/50 text-slate-600 font-black text-xs uppercase tracking-[0.2em]">
        <p>© 2026 MKD Slidea • Автор: Игор Богданоски • Направено во 🇲🇰</p>

        {/* Presenter controls */}
        <div className="flex items-center gap-3">
          {/* Pause / Resume */}
          {onToggleLock && (
            <button
              onClick={handleToggleLock}
              disabled={lockPending}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all border ${
                event?.is_locked
                  ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-white'
                  : 'bg-slate-800 hover:bg-red-500/20 border-slate-700/50 text-slate-400 hover:text-red-400 hover:border-red-500/40'
              }`}
              title={event?.is_locked ? 'Продолжи со гласање (L)' : 'Паузирај гласање (L)'}
            >
              {event?.is_locked
                ? <><Play className="w-3.5 h-3.5" /> Продолжи</>
                : <><Pause className="w-3.5 h-3.5" /> Паузирај</>
              }
            </button>
          )}

          {/* Timer picker */}
          {onStartTimer && currentPoll?.id && (
            <div className="relative" ref={timerPickerRef}>
              <button
                onClick={() => {
                  if (timerRemaining && timerRemaining > 0) {
                    handleStopTimer();
                  } else {
                    setTimerPickerOpen((v) => !v);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all border ${
                  timerRemaining && timerRemaining > 0
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400'
                    : 'bg-slate-800 hover:bg-indigo-600/20 border-slate-700/50 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/40'
                }`}
                title={timerRemaining && timerRemaining > 0 ? 'Стопирај тајмер' : 'Стартувај тајмер'}
              >
                {timerRemaining && timerRemaining > 0
                  ? <><TimerOff className="w-3.5 h-3.5" /> Стопирај</>
                  : <><Timer className="w-3.5 h-3.5" /> Тајмер</>
                }
              </button>

              <AnimatePresence>
                {timerPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute bottom-full mb-2 right-0 bg-slate-800 border border-slate-700/60 rounded-2xl p-3 shadow-2xl flex flex-col gap-1.5 min-w-[130px]"
                  >
                    {[
                      { label: '30 сек', sec: 30 },
                      { label: '60 сек', sec: 60 },
                      { label: '90 сек', sec: 90 },
                      { label: '2 мин', sec: 120 },
                      { label: '5 мин', sec: 300 },
                    ].map(({ label, sec }) => (
                      <button
                        key={sec}
                        onClick={() => handleStartTimer(sec)}
                        className="px-4 py-2 text-slate-300 font-black text-sm hover:bg-indigo-600 hover:text-white rounded-xl transition-all text-left"
                      >
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button
            onClick={fireConfetti}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 border border-slate-700/50 hover:border-indigo-500 transition-all text-slate-400 hover:text-white"
            title="Преслави со конфети!"
          >
            <PartyPopper className="w-4 h-4" /> Конфети 🎉
          </button>
        </div>
      </div>
    </div>
  );
};

export default Presenter;
