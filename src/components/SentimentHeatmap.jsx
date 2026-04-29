import React from 'react';
import { useSentimentBuffer } from '../hooks/useSentimentBuffer';

const ENERGY_LABEL = {
  idle: 'Тивко',
  low: 'Ниско',
  medium: 'Средно',
  high: 'Високо',
};

const MOOD_BADGE = {
  positive: { label: 'Позитивно', cls: 'bg-emerald-500/20 text-emerald-300' },
  neutral: { label: 'Неутрално', cls: 'bg-slate-500/20 text-slate-300' },
  negative: { label: 'Опаѓа', cls: 'bg-rose-500/20 text-rose-300' },
};

const SentimentHeatmap = ({ reactions }) => {
  const { bins, energy, mood, total } = useSentimentBuffer(reactions);

  if (total === 0) return null;

  const max = Math.max(1, ...bins.map((b) => b.count));
  const moodInfo = MOOD_BADGE[mood];
  const dotCls =
    energy === 'high'
      ? 'bg-emerald-400 animate-pulse'
      : energy === 'medium'
      ? 'bg-amber-400'
      : energy === 'low'
      ? 'bg-slate-400'
      : 'bg-slate-600';

  return (
    <div
      className="fixed bottom-4 left-4 z-40 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-2xl px-4 py-3 shadow-2xl text-white"
      role="status"
      aria-live="polite"
      aria-label={`Енергија на час: ${ENERGY_LABEL[energy]}, настроение: ${moodInfo.label}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className={`w-2.5 h-2.5 rounded-full ${dotCls}`} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Енергија · {ENERGY_LABEL[energy]}
        </p>
        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${moodInfo.cls}`}>
          {moodInfo.label}
        </span>
      </div>
      <div className="flex items-end gap-[2px] h-10">
        {bins.map((b, idx) => {
          const h = Math.round((b.count / max) * 100);
          const tone =
            b.score > 0 ? 'bg-emerald-400' : b.score < 0 ? 'bg-rose-400' : 'bg-indigo-400';
          return (
            <div
              key={idx}
              className={`w-1 rounded-sm ${tone} ${b.count === 0 ? 'opacity-15' : 'opacity-90'}`}
              style={{ height: `${Math.max(6, h)}%` }}
              title={`${new Date(b.start).toLocaleTimeString('mk-MK', { hour: '2-digit', minute: '2-digit' })} · ${b.count}`}
            />
          );
        })}
      </div>
      <p className="text-[9px] font-bold text-slate-500 mt-1.5 tracking-wider">5 мин · {total} реакции</p>
    </div>
  );
};

export default SentimentHeatmap;
