import React from 'react';
import { PieChart, Cloud, MessageSquare, Star, ListOrdered, ClipboardList, Trophy, BarChart2 } from 'lucide-react';

const TYPE_ICON = {
  poll:      PieChart,
  wordcloud: Cloud,
  open:      MessageSquare,
  rating:    Star,
  ranking:   ListOrdered,
  survey:    ClipboardList,
  scale:     BarChart2,
};

const TYPE_COLOR = {
  poll:      'text-indigo-500',
  wordcloud: 'text-pink-500',
  open:      'text-violet-500',
  rating:    'text-amber-500',
  ranking:   'text-emerald-500',
  survey:    'text-blue-500',
  scale:     'text-cyan-500',
  quiz:      'text-amber-600',
};

const SlideThumbnailStrip = ({ polls, activePollIndex, onSelect }) => {
  if (!polls?.length) return null;

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-3 -mx-2 px-2 scrollbar-thin"
      role="tablist"
      aria-label="Преглед на слајдови"
    >
      {polls.map((poll, idx) => {
        const isActive = idx === activePollIndex;
        const Icon = poll.is_quiz ? Trophy : (TYPE_ICON[poll.type] || PieChart);
        const color = poll.is_quiz ? TYPE_COLOR.quiz : (TYPE_COLOR[poll.type] || 'text-slate-500');
        const totalVotes = (poll.options || []).reduce((a, o) => a + (o.votes || 0), 0);

        return (
          <button
            key={poll.id}
            role="tab"
            aria-selected={isActive}
            aria-label={`Слајд ${idx + 1}: ${poll.question || 'Без наслов'}`}
            onClick={() => onSelect(idx)}
            className={`shrink-0 w-40 text-left p-3 rounded-2xl border-2 transition-all ${
              isActive
                ? 'border-indigo-600 bg-indigo-50 shadow-md'
                : 'border-slate-100 bg-white hover:border-indigo-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                #{idx + 1}
              </span>
              <Icon className={`w-3.5 h-3.5 ${color}`} />
            </div>
            <p className="text-[11px] font-black text-slate-700 leading-tight line-clamp-2 min-h-[28px]">
              {poll.question || 'Без наслов'}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {poll.is_quiz ? 'Квиз' : (poll.type || 'анкета')}
              </span>
              <span className="text-[9px] font-black text-slate-400 tabular-nums">{totalVotes}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SlideThumbnailStrip;
