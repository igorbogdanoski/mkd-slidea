import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Hash, Zap, Star, Activity, BarChart2, PieChart, Award, Hash as HashIcon, PartyPopper, Users } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import confetti from 'canvas-confetti';
import WordCloud from '../components/WordCloud';
import AnimatedBackground from '../components/AnimatedBackground';
import SentimentHeatmap from '../components/SentimentHeatmap';
import { useEventStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

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

// ─── Color palette shared across all chart modes ─────────────────────────────
const PALETTE = [
  { hex: '#6366f1', bar: 'bg-indigo-500',  glow: 'rgba(99,102,241,0.4)',  text: 'text-indigo-400'  },
  { hex: '#8b5cf6', bar: 'bg-violet-500',  glow: 'rgba(139,92,246,0.4)',  text: 'text-violet-400'  },
  { hex: '#10b981', bar: 'bg-emerald-500', glow: 'rgba(16,185,129,0.4)',  text: 'text-emerald-400' },
  { hex: '#f59e0b', bar: 'bg-amber-500',   glow: 'rgba(245,158,11,0.4)',  text: 'text-amber-400'   },
  { hex: '#ef4444', bar: 'bg-rose-500',    glow: 'rgba(239,68,68,0.4)',   text: 'text-rose-400'    },
  { hex: '#06b6d4', bar: 'bg-cyan-500',    glow: 'rgba(6,182,212,0.4)',   text: 'text-cyan-400'    },
];

// ─── Chart mode switcher ──────────────────────────────────────────────────────
const MODES = [
  { id: 'bars',    icon: <BarChart2 size={18} />,  label: 'Барови'   },
  { id: 'donut',   icon: <PieChart  size={18} />,  label: 'Донат'    },
  { id: 'podium',  icon: <Award     size={18} />,  label: 'Подиум'   },
  { id: 'numbers', icon: <HashIcon  size={18} />,  label: 'Бројки'   },
];

// ─── Custom donut label ───────────────────────────────────────────────────────
const DonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontWeight: 900, fontSize: 18 }}>
      {`${Math.round(percent * 100)}%`}
    </text>
  );
};

// ─── Bars view ────────────────────────────────────────────────────────────────
const BarsView = ({ options, totalVotes }) => {
  const maxVotes = Math.max(...options.map(o => o.votes || 0), 1);
  return (
    <div className="space-y-7">
      <AnimatePresence mode="popLayout">
        {options.map((option, i) => {
          const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          const isLeading = option.votes === maxVotes && option.votes > 0;
          const p = PALETTE[i % PALETTE.length];
          return (
            <motion.div key={option.id || i} layout
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 200, damping: 22 }}
            >
              <div className="flex justify-between items-end mb-3 px-2">
                <span className={`text-3xl font-black ${isLeading ? 'text-white' : 'text-slate-300'}`}>
                  {isLeading && '👑 '}{option.text}
                </span>
                <span className={`text-4xl font-black ${p.text}`}>{pct}%</span>
              </div>
              <div className="h-20 w-full bg-slate-800 rounded-[1.5rem] overflow-hidden border border-slate-700/50 p-2">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.5, ease: 'circOut', delay: i * 0.06 }}
                  className={`h-full ${p.bar} rounded-xl relative`}
                  style={{ boxShadow: `0 0 30px ${p.glow}` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// ─── Donut view ───────────────────────────────────────────────────────────────
const DonutView = ({ options, totalVotes }) => {
  const data = options
    .filter(o => (o.votes || 0) > 0)
    .map((o, i) => ({ name: o.text, value: o.votes, color: PALETTE[i % PALETTE.length].hex }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-slate-600 font-black text-2xl">
        Чекаме гласови...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-12">
      <div className="flex-1 h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPie>
            <Pie data={data} cx="50%" cy="50%" innerRadius="38%" outerRadius="72%"
              dataKey="value" labelLine={false} label={DonutLabel}
              animationBegin={0} animationDuration={1200}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, color: '#fff', fontWeight: 900 }}
              formatter={(val) => [`${val} гласови`, '']}
            />
          </RechartsPie>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="space-y-5 min-w-[280px]">
        {options.map((o, i) => {
          const pct = totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0;
          const p = PALETTE[i % PALETTE.length];
          return (
            <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-4"
            >
              <div className={`w-5 h-5 rounded-full flex-shrink-0 ${p.bar}`} />
              <span className="text-slate-200 font-black text-xl flex-1 truncate">{o.text}</span>
              <span className={`font-black text-2xl ${p.text}`}>{pct}%</span>
            </motion.div>
          );
        })}
        <div className="pt-4 border-t border-slate-700">
          <p className="text-slate-500 font-black text-sm uppercase tracking-widest">
            Вкупно: {totalVotes} гласови
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Podium view ──────────────────────────────────────────────────────────────
const PodiumView = ({ options, totalVotes }) => {
  const sorted = [...options].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const podiumOrder = top3.length >= 2 ? [top3[1], top3[0], top3[2]].filter(Boolean) : top3;
  const podiumHeights = ['h-36', 'h-52', 'h-28'];
  const podiumColors = ['bg-slate-400', 'bg-amber-400', 'bg-orange-500'];
  const medals = ['🥈', '🥇', '🥉'];
  const podiumIdx = [1, 0, 2];

  return (
    <div className="space-y-8">
      {/* Podium */}
      <div className="flex items-end justify-center gap-6 h-72">
        {podiumOrder.map((opt, pos) => {
          if (!opt) return null;
          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          const origIdx = podiumIdx[pos];
          return (
            <motion.div key={opt.id || pos}
              initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pos * 0.15, type: 'spring', stiffness: 200, damping: 18 }}
              className="flex flex-col items-center gap-3 w-48"
            >
              <div className="text-center">
                <div className="text-5xl mb-2">{medals[pos]}</div>
                <p className="text-white font-black text-lg leading-tight text-center line-clamp-2">{opt.text}</p>
                <p className={`font-black text-3xl mt-1 ${PALETTE[origIdx % PALETTE.length].text}`}>{pct}%</p>
                <p className="text-slate-500 text-sm font-black">{opt.votes} гл.</p>
              </div>
              <div className={`w-full ${podiumHeights[pos]} ${podiumColors[pos]} rounded-t-2xl flex items-start justify-center pt-4`}>
                <span className="text-white font-black text-4xl opacity-40">{origIdx + 1}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rest */}
      {rest.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {rest.map((opt, i) => {
            const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            const idx = i + 3;
            return (
              <motion.div key={opt.id || i}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.06 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4"
              >
                <span className="text-slate-500 font-black text-2xl w-8">#{idx + 1}</span>
                <span className="text-slate-300 font-black flex-1 truncate">{opt.text}</span>
                <span className={`font-black text-xl ${PALETTE[idx % PALETTE.length].text}`}>{pct}%</span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Numbers view (clean/projector-friendly) ──────────────────────────────────
const NumbersView = ({ options, totalVotes }) => {
  const sorted = [...options].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  return (
    <div className="space-y-6">
      {sorted.map((opt, i) => {
        const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
        const origIdx = options.findIndex(o => o === opt);
        const p = PALETTE[origIdx % PALETTE.length];
        return (
          <motion.div key={opt.id || i}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            className="flex items-center justify-between bg-slate-800/40 border border-slate-700/40 rounded-[2rem] px-10 py-7"
          >
            <span className="text-3xl font-black text-slate-200 flex-1 pr-8">{opt.text}</span>
            <div className="flex items-center gap-8">
              <span className="text-slate-500 font-black text-2xl">{opt.votes} гл.</span>
              <span className={`font-black text-6xl w-36 text-right ${p.text}`}>{pct}%</span>
            </div>
          </motion.div>
        );
      })}
      {totalVotes > 0 && (
        <p className="text-right text-slate-600 font-black text-sm uppercase tracking-widest pr-4">
          Вкупно гласови: {totalVotes}
        </p>
      )}
    </div>
  );
};

// ─── Main Presenter ───────────────────────────────────────────────────────────
const Presenter = ({ event, polls, questions, activePollIndex, leaderboard, reactions = [], markQuestionAnswered }) => {
  const { activeParticipants, activeNow } = useEventStore();
  const [chartMode, setChartMode] = useState('bars');

  useKeyboardShortcuts({
    'F': toggleFullscreen,
    'f': toggleFullscreen,
  });

  const [timerRemaining, setTimerRemaining] = useState(null);
  const [surveyResponses, setSurveyResponses] = useState([]);
  const [confettiFired, setConfettiFired] = useState(false);
  const [pendingAnsweredId, setPendingAnsweredId] = useState(null);

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
              <p className="text-slate-400 font-bold text-xl mt-2">{totalVotes} гласови</p>
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
          <p className="text-3xl font-bold text-slate-400">{totalVotes} гласови</p>
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
      {/* Floating Reactions */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {reactions.map(r => (
            <motion.div key={r.id}
              initial={{ y: '100vh', x: `${20 + Math.random() * 60}vw`, opacity: 0, scale: 0.5 }}
              animate={{ y: '-10vh', opacity: [0, 1, 1, 0], scale: [1, 1.5, 1.2, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 4, ease: 'easeOut' }}
              className="absolute text-6xl"
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Top Header */}
      <div className="flex items-center justify-between mb-16">
        <div className="flex items-center gap-6">
          {logoUrl ? (
            <img src={logoUrl} alt="Лого" className="h-16 w-auto max-w-[180px] object-contain" />
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
          <motion.h2
            key={currentPoll.question}
            initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}
            className="text-6xl font-black leading-tight max-w-4xl whitespace-pre-line"
          >
            {currentPoll.question}
          </motion.h2>

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
                {activeParticipants > 0 && ['poll','quiz','rating','ranking','scale'].includes(currentPoll.type) && (
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
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{q.author}</span>
                      <div className="flex items-center gap-4">
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

      {/* Footer */}
      <div className="mt-auto pt-8 flex items-center justify-between border-t border-slate-800/50 text-slate-600 font-black text-xs uppercase tracking-[0.2em]">
        <p>© 2026 MKD Slidea • Автор: Игор Богданоски • Направено во 🇲🇰</p>
        <p>Најдобрата платформа за интеракција во живо</p>
        <button
          onClick={fireConfetti}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 border border-slate-700/50 hover:border-indigo-500 transition-all text-slate-400 hover:text-white"
          title="Преслави со конфети!"
        >
          <PartyPopper className="w-4 h-4" /> Конфети 🎉
        </button>
      </div>
    </div>
  );
};

export default Presenter;
