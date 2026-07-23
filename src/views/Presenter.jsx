import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import PresenterControls from '../components/Presenter/PresenterControls';
import PresenterOverlays from '../components/Presenter/PresenterOverlays';
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

      {/* Notes / countdown / pause banner overlays */}
      <PresenterOverlays
        showNotes={showNotes}
        setShowNotes={setShowNotes}
        currentPoll={currentPoll}
        timerRemaining={timerRemaining}
        event={event}
        onToggleLock={onToggleLock}
        handleToggleLock={handleToggleLock}
      />

      {/* Footer */}
      <div className="mt-auto pt-8 flex items-center justify-between border-t border-slate-800/50 text-slate-600 font-black text-xs uppercase tracking-[0.2em]">
        <p>© 2026 MKD Slidea • Автор: Игор Богданоски • Направено во 🇲🇰</p>

        {/* Presenter controls */}
        <PresenterControls
          event={event}
          onToggleLock={onToggleLock}
          lockPending={lockPending}
          handleToggleLock={handleToggleLock}
          timerRemaining={timerRemaining}
          timerPickerOpen={timerPickerOpen}
          setTimerPickerOpen={setTimerPickerOpen}
          handleStartTimer={handleStartTimer}
          handleStopTimer={handleStopTimer}
          fireConfetti={fireConfetti}
          onStartTimer={onStartTimer}
          currentPoll={currentPoll}
        />
      </div>
    </div>
  );
};

export default Presenter;
