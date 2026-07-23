import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Hash, Zap, Star, Activity, BarChart2, PieChart, Award, Hash as HashIcon, PartyPopper, Users, Pause, Play, Timer, TimerOff } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import confetti from 'canvas-confetti';
import WordCloud from '../components/WordCloud';
import AnimatedBackground from '../components/AnimatedBackground';
import SentimentHeatmap from '../components/SentimentHeatmap';
import LiveCaptions from '../components/LiveCaptions';
import CurriculumBenchmarkBadge from '../components/CurriculumBenchmarkBadge';
import DrawingCanvas from '../components/DrawingCanvas';
import { MODES, BarsView, DonutView, PodiumView, NumbersView } from '../components/Presenter/ChartViews';
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
  const [pendingAnsweredId, setPendingAnsweredId] = useState(null);
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

  // ── Reaction meta — stable random values per reaction id ─────────────
  const reactionMetaRef = useRef({});
  const getReactionMeta = (id) => {
    if (!reactionMetaRef.current[id]) {
      const keys = Object.keys(reactionMetaRef.current);
      if (keys.length > 500) delete reactionMetaRef.current[keys[0]];
      reactionMetaRef.current[id] = {
        xPct:    8  + Math.random() * 80,
        drift:   (Math.random() - 0.5) * 180,
        rot:     (Math.random() - 0.5) * 52,
        scale:   1.4 + Math.random() * 1.1,
        sizePx:  54 + Math.floor(Math.random() * 38),
      };
    }
    return reactionMetaRef.current[id];
  };

  // ── Cumulative reaction counter (persists while reactions auto-expire) ─
  const seenReactionIds = useRef(new Set());
  const [totalReactions, setTotalReactions] = useState(0);
  useEffect(() => {
    let added = 0;
    for (const r of reactions) {
      if (!seenReactionIds.current.has(r.id)) {
        seenReactionIds.current.add(r.id);
        added++;
      }
    }
    if (added > 0) setTotalReactions(t => t + added);
  }, [reactions]);

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

  const renderResults = () => {
    if (currentPoll.type === 'survey') {
      const qs = currentPoll.survey_questions || [];
      const total = surveyResponses.length;
      return (
        <div className="space-y-6 py-2">
          <p className="text-slate-500 font-black text-sm uppercase tracking-widest text-right">
            {total} {total === 1 ? 'одговор' : 'одговори'}
          </p>
          {qs.map((sq) => {
            const vals = surveyResponses.map(r => (r.answers || []).find(a => a.qId === sq.id)?.value).filter(v => v !== undefined);
            return (
              <div key={sq.id} className="bg-slate-800/30 rounded-[2rem] p-6 border border-slate-700/40">
                <p className="font-black text-white mb-4 text-lg leading-tight">{sq.text}</p>
                {sq.type === 'scale' && vals.length > 0 && (() => {
                  const avg = (vals.reduce((s, v) => s + Number(v), 0) / vals.length).toFixed(1);
                  const dist = Array.from({ length: 10 }, (_, i) => vals.filter(v => Number(v) === i + 1).length);
                  const maxD = Math.max(...dist, 1);
                  return (
                    <div className="space-y-3">
                      <p className="text-teal-400 font-black text-5xl text-center">{avg}<span className="text-2xl text-slate-500">/10</span></p>
                      <div className="flex items-end gap-1 h-16">
                        {dist.map((c, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.round((c / maxD) * 48) || 2}px`, backgroundColor: `hsl(${i * 12},70%,55%)` }} />
                            <span className="text-[9px] font-black text-slate-500">{i + 1}</span>
                          </div>
                        ))}
                      </div>
                      {(sq.min || sq.max) && (
                        <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <span>{sq.min}</span><span>{sq.max}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
                {sq.type === 'open' && (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {vals.length === 0
                      ? <p className="text-slate-600 font-bold text-sm">Сé уште нема одговори</p>
                      : vals.map((v, i) => (
                        <div key={i} className="bg-slate-800/50 rounded-xl px-4 py-2 text-slate-300 font-bold text-sm">{v}</div>
                      ))
                    }
                  </div>
                )}
                {sq.type === 'choice' && (sq.options || []).map((opt, oi) => {
                  const count = vals.filter(v => v === opt).length;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={oi} className="space-y-1 mb-2">
                      <div className="flex justify-between text-sm font-black text-slate-300">
                        <span>{opt}</span><span>{count} ({pct}%)</span>
                      </div>
                      <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      );
    }

    if (currentPoll.type === 'wordcloud') return <WordCloud words={visibleOptions} />;

    if (currentPoll.type === 'scale') {
      const scaleOpts = visibleOptions;
      const weightedSum = scaleOpts.reduce((s, o, i) => s + (o.votes || 0) * (i + 1), 0);
      const avg = totalVotes > 0 ? (weightedSum / totalVotes).toFixed(1) : '—';
      const minLabel = scaleOpts[0]?.label;
      const maxLabel = scaleOpts[scaleOpts.length - 1]?.label;
      return (
        <div className="space-y-8 py-4">
          <div className="flex items-center justify-center gap-12 py-8 bg-slate-800/20 rounded-[3rem] border border-slate-700/50">
            <div className="text-center">
              <p className="text-slate-500 font-black text-sm uppercase tracking-widest mb-2">Просек</p>
              <h3 className="text-[9rem] font-black leading-none text-teal-400">{avg}</h3>
              <p aria-live="polite" aria-atomic="true" className="text-slate-400 font-bold text-xl mt-2">{totalVotes} гласови</p>
            </div>
          </div>
          <div className="space-y-3">
            {scaleOpts.map((opt, i) => {
              const pct = totalVotes > 0 ? Math.round((opt.votes || 0) / totalVotes * 100) : 0;
              const hue = Math.round(i * 12);
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-8 text-center font-black text-slate-400 text-sm">{opt.text}</span>
                  <div className="flex-1 h-6 bg-slate-800/40 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.04 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: `hsl(${hue},70%,55%)` }}
                    />
                  </div>
                  <span className="w-12 text-right font-black text-slate-400 text-sm">{opt.votes || 0}</span>
                </div>
              );
            })}
          </div>
          {(minLabel || maxLabel) && (
            <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-widest px-12">
              <span>1 — {minLabel}</span>
              <span>10 — {maxLabel}</span>
            </div>
          )}
        </div>
      );
    }

    if (currentPoll.type === 'rating') {
      return (
        <div className="flex flex-col items-center justify-center space-y-12 py-16 bg-slate-800/20 rounded-[4rem] border border-slate-700/50">
          <div className="text-center">
            <p className="text-slate-500 font-black text-xl uppercase tracking-widest mb-4">Просечна оцена</p>
            <h3 className="text-[12rem] font-black leading-none text-indigo-400">{averageRating}</h3>
          </div>
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map(star => (
              <Star key={star} className={`w-24 h-24 ${star <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
            ))}
          </div>
          <p aria-live="polite" aria-atomic="true" className="text-3xl font-bold text-slate-400">{totalVotes} гласови</p>
        </div>
      );
    }

    if (currentPoll.type === 'ranking') {
      const sorted = [...visibleOptions].sort((a, b) => (b.votes || 0) - (a.votes || 0));
      if (chartMode === 'donut') return <DonutView options={sorted} totalVotes={totalVotes} />;
      if (chartMode === 'podium') return <PodiumView options={sorted} totalVotes={totalVotes} />;
      if (chartMode === 'numbers') return <NumbersView options={sorted} totalVotes={totalVotes} />;
      // bars — ranking style with medals
      const medals = ['🥇', '🥈', '🥉'];
      const rankColors = ['border-amber-500/60 bg-amber-500/10', 'border-slate-400/60 bg-slate-400/10', 'border-orange-600/60 bg-orange-600/10'];
      const barC = ['bg-amber-400', 'bg-slate-400', 'bg-orange-500'];
      return (
        <div className="space-y-5">
          <AnimatePresence mode="popLayout">
            {sorted.map((opt, i) => {
              const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
              const isTop = i < 3;
              return (
                <motion.div key={opt.id || i} layout
                  initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
                  className={`flex items-center gap-8 p-7 rounded-[2rem] border shadow-lg ${isTop ? rankColors[i] : 'bg-slate-800/40 border-slate-700/50'}`}
                >
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 text-4xl ${isTop ? 'bg-slate-900/60' : 'bg-indigo-600/20 border border-indigo-500/30 text-2xl font-black text-indigo-300'}`}>
                    {isTop ? medals[i] : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-3xl font-black text-white mb-3 truncate">{opt.text}</h4>
                    <div className="h-3 bg-slate-700/60 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.2, ease: 'circOut', delay: i * 0.08 + 0.2 }}
                        className={`h-full rounded-full ${isTop ? barC[i] : 'bg-indigo-500'}`} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-4xl font-black text-white">{opt.votes}</p>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{pct}%</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      );
    }

    if (currentPoll.type === 'open') {
      const colors = ['bg-amber-100', 'bg-emerald-100', 'bg-rose-100', 'bg-sky-100', 'bg-violet-100'];
      return (
        <div className="grid grid-cols-3 gap-8 max-h-[600px] overflow-y-auto pr-4 scrollbar-hide p-4">
          {visibleOptions.length === 0 ? (
            <div className="col-span-3 py-20 text-center text-slate-500 font-bold text-2xl border-2 border-dashed border-slate-800 rounded-[3rem]">
              Сè уште нема одговори...
            </div>
          ) : visibleOptions.map((opt, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, scale: 0.8, rotate: Math.random() * 10 - 5 }}
              animate={{ opacity: 1, scale: 1, rotate: Math.random() * 6 - 3 }}
              whileHover={{ scale: 1.05, rotate: 0 }}
              className={`${colors[i % colors.length]} p-8 rounded-xl shadow-xl border-t-4 border-black/5 min-h-[200px] flex items-center justify-center relative`}
            >
              <div className="absolute top-4 left-4 w-4 h-4 bg-black/10 rounded-full" />
              <p className="text-slate-800 text-2xl font-black leading-tight text-center font-mono">{opt.text}</p>
            </motion.div>
          ))}
        </div>
      );
    }

    // poll / quiz — switchable
    if (chartMode === 'donut') return <DonutView options={visibleOptions} totalVotes={totalVotes} />;
    if (chartMode === 'podium') return <PodiumView options={visibleOptions} totalVotes={totalVotes} />;
    if (chartMode === 'numbers') return <NumbersView options={visibleOptions} totalVotes={totalVotes} />;
    return <BarsView options={visibleOptions} totalVotes={totalVotes} />;
  };

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

      {/* ── Floating Reactions — world-class ──────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {reactions.map(r => {
            const m = getReactionMeta(r.id);
            return (
              <motion.div
                key={r.id}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: `${m.xPct}%`,
                  fontSize: `${m.sizePx}px`,
                  filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.40)) drop-shadow(0 0 8px rgba(255,255,255,0.20))',
                  willChange: 'transform, opacity',
                  lineHeight: 1,
                }}
                initial={{ y: 0, x: 0, opacity: 0, scale: 0.15, rotate: 0 }}
                animate={{
                  y:       [0,   -90,  -280, -540, -920],
                  x:       [0,   m.drift * 0.25, m.drift, m.drift * 0.65, m.drift * 0.2],
                  opacity: [0,    1,    1,    0.85,  0],
                  scale:   [0.15, 1,    m.scale, m.scale * 0.9, 0.35],
                  rotate:  [0,    m.rot * 0.35, m.rot, m.rot * 0.55, 0],
                }}
                transition={{
                  duration: 5,
                  ease: 'easeOut',
                  times: [0, 0.10, 0.35, 0.70, 1],
                }}
              >
                {r.emoji}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Cumulative reaction counter badge ─────────────────────────── */}
      <AnimatePresence>
        {totalReactions > 0 && (
          <motion.div
            key="reaction-counter"
            initial={{ opacity: 0, scale: 0.7, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute bottom-8 right-8 z-[60] pointer-events-none
              flex items-center gap-2.5
              bg-black/40 backdrop-blur-2xl
              px-5 py-2.5 rounded-[2rem]
              border border-white/15
              shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
          >
            <span className="text-2xl leading-none">💬</span>
            <motion.span
              key={totalReactions}
              initial={{ scale: 1.6, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 700, damping: 22 }}
              className="text-white font-black text-xl tabular-nums"
            >
              {totalReactions}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="flex items-center justify-between mb-16">
        <div className="flex items-center gap-6">
          {logoUrl ? (
            <img src={logoUrl} alt="Лого" loading="lazy" className="h-16 w-auto max-w-[180px] object-contain" />
          ) : (
            <div className="p-4 rounded-3xl shadow-2xl" style={{ backgroundColor: brandColor }}>
              <Zap className="w-10 h-10 text-white fill-white" />
            </div>
          )}
          <div>
            {logoUrl ? (
              <h1 className="text-4xl font-black tracking-tight text-white">
                {event?.title || 'MKD Slidea'}
              </h1>
            ) : (
              <h1 className="text-4xl font-black tracking-tight">
                MKD <span style={{ color: brandColor }}>Slidea</span>
              </h1>
            )}
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">{getSubTitle()}</p>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-right">
            <p className="text-slate-500 font-black text-sm uppercase tracking-widest mb-1">Приклучи се на</p>
            <p className="text-3xl font-black" style={{ color: brandColor }}>{window.location.host}</p>
          </div>
          <div className="bg-white p-3 rounded-3xl shadow-2xl border-4 border-slate-800">
            <QRCodeSVG value={joinUrl} size={100} fgColor={brandColor} />
          </div>
          <div className="bg-slate-800 px-8 py-5 rounded-[2rem] border border-slate-700">
            <p className="text-slate-500 font-black text-xs uppercase tracking-widest mb-1 text-center">Код за влезот</p>
            <p className="text-5xl font-black tracking-widest text-white">{eventCode}</p>
          </div>
          {timerRemaining > 0 && (
            <div
              className={`px-8 py-5 rounded-[2rem] border flex flex-col items-center min-w-[120px] ${timerRemaining <= 10 ? 'bg-red-600 border-red-500 animate-pulse' : ''}`}
              style={timerRemaining > 10 ? { backgroundColor: brandColor + '33', borderColor: brandColor + '66' } : {}}
            >
              <p className="font-black text-xs uppercase tracking-widest mb-1 text-white/60">Тајмер</p>
              <p className="text-5xl font-black tabular-nums text-white">
                {String(Math.floor(timerRemaining / 60)).padStart(2,'0')}:{String(timerRemaining % 60).padStart(2,'0')}
              </p>
            </div>
          )}
        </div>
      </div>

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
              {renderResults()}
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
        <div className="col-span-4">
          <div className="bg-slate-800/50 backdrop-blur-xl p-10 rounded-[4rem] border border-slate-700/50 h-full flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: brandColor }} />
                {currentPoll.is_quiz ? 'Табела на лидери' : 'Топ прашања'}
              </h3>
              <div className="flex flex-col items-end gap-2">
                <div className="bg-slate-700/50 px-5 py-3 rounded-[1.5rem] border border-slate-600/50 flex items-center gap-3 text-indigo-400 font-black">
                  <div className="relative">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 bg-indigo-400 rounded-full scale-150 blur-sm opacity-20"
                    />
                  </div>
                  <span className="text-xl">{activeParticipants} во живо</span>
                  {activeNow > 0 && (
                    <span
                      className="ml-2 text-xs font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      title="Активни во последните 4 секунди"
                    >
                      🔥 {activeNow} активни сега
                    </span>
                  )}
                </div>
                {activeParticipants > 0 && ['poll','quiz','rating','ranking','scale','wordcloud','open'].includes(currentPoll.type) && (
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-black text-sm">
                      {Math.min(totalVotes, activeParticipants)}/{activeParticipants} одговориле
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5 flex-1 overflow-y-auto pr-4 scrollbar-hide">
              {currentPoll.is_quiz ? (
                [...leaderboard].sort((a, b) => b.points - a.points).map((user, i) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const topColors = [
                    'bg-amber-500/20 border-amber-500/40 text-amber-300',
                    'bg-slate-400/10 border-slate-400/30 text-slate-300',
                    'bg-orange-600/10 border-orange-600/30 text-orange-300',
                  ];
                  const isTop = i < 3;
                  return (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`flex items-center justify-between p-5 rounded-2xl border ${isTop ? topColors[i] : 'bg-slate-800 border-slate-700/30 text-slate-300'}`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{isTop ? medals[i] : `#${i + 1}`}</span>
                        <span className="text-xl font-black truncate max-w-[120px]">{user.username}</span>
                      </div>
                      <span className={`text-2xl font-black ${isTop ? '' : 'text-indigo-400'}`}>{user.points} pts</span>
                    </motion.div>
                  );
                })
              ) : (
                questions.map((q, i) => (
                  <motion.div key={q.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-8 bg-slate-800 rounded-[2.5rem] border border-slate-700/30 hover:border-indigo-500/50 transition-all"
                  >
                    <p className="text-2xl font-bold mb-4 text-slate-200">{q.text}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        {q.author}
                        {q.is_pinned && <span className="ml-2 text-amber-400">📌</span>}
                      </span>
                      <div className="flex items-center gap-2">
                        {typeof setQuestionPinned === 'function' && (
                          <button
                            onClick={() => setQuestionPinned(q.id, !q.is_pinned)}
                            className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg border transition-all ${q.is_pinned ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' : 'bg-slate-700/40 hover:bg-slate-700/70 text-slate-400 border-slate-700/40'}`}
                            title="Pin"
                          >
                            {q.is_pinned ? 'Откачи' : 'Pin'}
                          </button>
                        )}
                        {typeof setQuestionHidden === 'function' && (
                          <button
                            onClick={() => setQuestionHidden(q.id, true)}
                            className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase rounded-lg border border-rose-500/20 transition-all"
                            title="Сокриј"
                          >
                            Сокриј
                          </button>
                        )}
                        <button onClick={() => {
                          if (pendingAnsweredId === q.id) {
                            markQuestionAnswered(q.id);
                            setPendingAnsweredId(null);
                            return;
                          }
                          setPendingAnsweredId(q.id);
                          setTimeout(() => {
                            setPendingAnsweredId((prev) => (prev === q.id ? null : prev));
                          }, 2500);
                        }}
                          className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase rounded-lg border border-indigo-500/20 transition-all"
                        >
                          {pendingAnsweredId === q.id ? 'Потврди' : 'Одговорено'}
                        </button>
                        <div className="flex items-center gap-2 text-indigo-400 font-black">
                          <span className="text-2xl">{q.votes}</span>
                          <Hash className="w-4 h-4 text-slate-600" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
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
