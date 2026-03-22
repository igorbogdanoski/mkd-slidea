import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Hash, Zap, Star, Activity, BarChart2, PieChart, Award, Hash as HashIcon } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import WordCloud from '../components/WordCloud';
import { useEventStore } from '../lib/store';

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
  const { activeParticipants } = useEventStore();
  const [chartMode, setChartMode] = useState('bars');

  const eventCode = event?.code || '982341';
  const joinUrl = `${window.location.origin}/event/${eventCode}`;
  const currentPoll = polls[activePollIndex] || {
    question: 'Чекаме да започне првата анкета...',
    options: [], is_quiz: false, type: 'poll',
  };

  // Reset chart mode when switching polls
  useEffect(() => { setChartMode('bars'); }, [activePollIndex]);

  const totalVotes = currentPoll.options?.reduce((a, b) => a + (b.votes || 0), 0) || 0;
  const averageRating = totalVotes > 0
    ? (currentPoll.options.reduce((acc, opt) => acc + (parseInt(opt.text) * (opt.votes || 0)), 0) / totalVotes).toFixed(1)
    : 0;

  // Types that support chart mode switching
  const supportsChartSwitch = ['poll', 'ranking'].includes(currentPoll.type) || currentPoll.is_quiz;

  const renderResults = () => {
    if (currentPoll.type === 'wordcloud') return <WordCloud words={currentPoll.options} />;

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
      const sorted = [...currentPoll.options].sort((a, b) => (b.votes || 0) - (a.votes || 0));
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
          {currentPoll.options.length === 0 ? (
            <div className="col-span-3 py-20 text-center text-slate-500 font-bold text-2xl border-2 border-dashed border-slate-800 rounded-[3rem]">
              Сè уште нема одговори...
            </div>
          ) : currentPoll.options.map((opt, i) => (
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
    if (chartMode === 'donut') return <DonutView options={currentPoll.options} totalVotes={totalVotes} />;
    if (chartMode === 'podium') return <PodiumView options={currentPoll.options} totalVotes={totalVotes} />;
    if (chartMode === 'numbers') return <NumbersView options={currentPoll.options} totalVotes={totalVotes} />;
    return <BarsView options={currentPoll.options} totalVotes={totalVotes} />;
  };

  const getSubTitle = () => {
    if (currentPoll.type === 'wordcloud') return '☁️ Облак со зборови';
    if (currentPoll.type === 'open')      return '💬 Отворени одговори';
    if (currentPoll.type === 'rating')    return '⭐ Оценување во живо';
    if (currentPoll.type === 'ranking')   return '🏅 Рангирање во живо';
    if (currentPoll.is_quiz)              return '🏆 Квиз во живо';
    return '📊 Анкета во живо';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col p-12 overflow-hidden relative">
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
          <div className="bg-indigo-600 p-4 rounded-3xl shadow-2xl shadow-indigo-500/20">
            <Zap className="w-10 h-10 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">MKD <span className="text-indigo-400">Slidea</span></h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">{getSubTitle()}</p>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-right">
            <p className="text-slate-500 font-black text-sm uppercase tracking-widest mb-1">Приклучи се на</p>
            <p className="text-3xl font-black text-indigo-400">{window.location.host}</p>
          </div>
          <div className="bg-white p-3 rounded-3xl shadow-2xl border-4 border-slate-800">
            <QRCodeSVG value={joinUrl} size={100} />
          </div>
          <div className="bg-slate-800 px-8 py-5 rounded-[2rem] border border-slate-700">
            <p className="text-slate-500 font-black text-xs uppercase tracking-widest mb-1 text-center">Код за влезот</p>
            <p className="text-5xl font-black tracking-widest text-white">{eventCode}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-14">
        {/* Left: Poll results */}
        <div className="col-span-8 space-y-10">
          <motion.h2
            key={currentPoll.question}
            initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}
            className="text-6xl font-black leading-tight max-w-4xl"
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
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
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
                <div className="w-1.5 h-10 bg-indigo-500 rounded-full" />
                {currentPoll.is_quiz ? 'Табела на лидери' : 'Топ прашања'}
              </h3>
              <div className="bg-slate-700/50 px-5 py-3 rounded-[1.5rem] border border-slate-600/50 flex items-center gap-3 text-indigo-400 font-black">
                <div className="relative">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-indigo-400 rounded-full scale-150 blur-sm opacity-20"
                  />
                </div>
                <span className="text-xl">{activeParticipants} во живо</span>
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
                        <button onClick={() => markQuestionAnswered(q.id)}
                          className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase rounded-lg border border-indigo-500/20 transition-all"
                        >
                          Одговорено
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
        <p>100% приватно и безбедно</p>
      </div>
    </div>
  );
};

export default Presenter;
