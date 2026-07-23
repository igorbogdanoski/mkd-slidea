import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, PieChart, Award, Hash as HashIcon } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Color palette shared across all chart modes ─────────────────────────────
export const PALETTE = [
  { hex: '#6366f1', bar: 'bg-indigo-500',  glow: 'rgba(99,102,241,0.4)',  text: 'text-indigo-400'  },
  { hex: '#8b5cf6', bar: 'bg-violet-500',  glow: 'rgba(139,92,246,0.4)',  text: 'text-violet-400'  },
  { hex: '#10b981', bar: 'bg-emerald-500', glow: 'rgba(16,185,129,0.4)',  text: 'text-emerald-400' },
  { hex: '#f59e0b', bar: 'bg-amber-500',   glow: 'rgba(245,158,11,0.4)',  text: 'text-amber-400'   },
  { hex: '#ef4444', bar: 'bg-rose-500',    glow: 'rgba(239,68,68,0.4)',   text: 'text-rose-400'    },
  { hex: '#06b6d4', bar: 'bg-cyan-500',    glow: 'rgba(6,182,212,0.4)',   text: 'text-cyan-400'    },
];

// ─── Chart mode switcher ──────────────────────────────────────────────────────
export const MODES = [
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
export const BarsView = ({ options, totalVotes }) => {
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
export const DonutView = ({ options, totalVotes }) => {
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
export const PodiumView = ({ options, totalVotes }) => {
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
export const NumbersView = ({ options, totalVotes }) => {
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
        <p aria-live="polite" aria-atomic="true" className="text-right text-slate-600 font-black text-sm uppercase tracking-widest pr-4">
          Вкупно гласови: {totalVotes}
        </p>
      )}
    </div>
  );
};
