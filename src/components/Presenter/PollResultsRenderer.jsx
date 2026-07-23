import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import WordCloud from '../WordCloud';
import { BarsView, DonutView, PodiumView, NumbersView } from './ChartViews';

// ─── Per-activity-type results renderer (pure derive-and-render) ──────────────
const PollResultsRenderer = ({ currentPoll, visibleOptions, totalVotes, surveyResponses, averageRating, chartMode }) => {
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

export default PollResultsRenderer;
