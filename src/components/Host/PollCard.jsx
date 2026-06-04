import React, { useState, lazy, Suspense } from 'react';
import { GripVertical, Eye, EyeOff, RotateCcw, Pencil, Trash2, Copy, ShieldCheck, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AutoGradeModal = lazy(() => import('../AutoGradeModal'));

const PollCard = ({ poll, index, activePollIndex, setActivePoll, onEdit, onDelete, onDuplicate, onPollUpdated }) => {
  const isActive = activePollIndex === index;
  // Optimistic local override so the toggle feels instant
  const [localResultsVisible, setLocalResultsVisible] = useState(null);
  const resultsVisible = localResultsVisible !== null ? localResultsVisible : poll.results_visible !== false;
  const needsModeration = !!poll.needs_moderation;
  const isTextPoll = ['wordcloud', 'open'].includes(poll.type);
  const isOpen = poll.type === 'open';
  const hasAnswers = (poll.options || []).some((o) => o?.text && o.is_approved !== false);
  const [gradeOpen, setGradeOpen] = useState(false);

  // Keep local override in sync when parent poll prop changes
  React.useEffect(() => { setLocalResultsVisible(null); }, [poll.results_visible]);

  const toggleResultsVisible = async (e) => {
    e.stopPropagation();
    const next = !resultsVisible;
    setLocalResultsVisible(next); // optimistic
    const { error } = await supabase.from('polls').update({ results_visible: next }).eq('id', poll.id);
    if (error) {
      setLocalResultsVisible(!next); // revert
      console.error('Toggle results_visible failed:', error.message);
    } else if (onPollUpdated) {
      onPollUpdated();
    }
  };

  const toggleModeration = async (e) => {
    e.stopPropagation();
    const { error } = await supabase.from('polls').update({ needs_moderation: !needsModeration }).eq('id', poll.id);
    if (!error && onPollUpdated) onPollUpdated();
  };

  const resetVotes = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Ресетирај ги сите гласови за оваа активност?')) return;
    const { error } = await supabase.from('options').update({ votes: 0 }).eq('poll_id', poll.id);
    if (!error && onPollUpdated) onPollUpdated();
  };

  return (
    <div
      className={`px-5 py-4 rounded-xl border-2 transition-all relative overflow-hidden ${isActive ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-100 bg-white hover:border-indigo-200'}`}
    >
      {/* Action buttons */}
      <div className="absolute top-0 right-0 flex gap-1 bg-white/90 backdrop-blur-sm rounded-bl-xl border-l border-b border-slate-100 px-2 py-1.5 z-10">
        <button onClick={(e) => { e.stopPropagation(); onEdit(poll); }} title="Измени" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
          <Pencil size={14} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDuplicate(poll); }} title="Дупликат" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
          <Copy size={14} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(poll.id); }} title="Избриши" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-all">
          <Trash2 size={14} />
        </button>
        {isActive && (
          <>
            <div className="w-px bg-slate-200 mx-0.5" />
            <button onClick={toggleResultsVisible} title={resultsVisible ? 'Скриј резултати' : 'Прикажи резултати'} className={`p-1.5 rounded-lg transition-all ${resultsVisible ? 'text-slate-400 hover:text-amber-500 hover:bg-slate-100' : 'text-amber-500 bg-amber-50'}`}>
              {resultsVisible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            {isTextPoll && (
              <button onClick={toggleModeration} title={needsModeration ? 'Модерација вклучена' : 'Вклучи модерација'} className={`p-1.5 rounded-lg transition-all ${needsModeration ? 'text-violet-600 bg-violet-50' : 'text-slate-400 hover:text-violet-600 hover:bg-slate-100'}`}>
                <ShieldCheck size={14} />
              </button>
            )}
            <button onClick={resetVotes} title="Ресетирај гласови" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
              <RotateCcw size={14} />
            </button>
          </>
        )}
        {isOpen && hasAnswers && (
          <button onClick={(e) => { e.stopPropagation(); setGradeOpen(true); }} title="AI авто-оценување" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-violet-600 transition-all">
            <Sparkles size={14} />
          </button>
        )}
      </div>

      {gradeOpen && (
        <Suspense fallback={null}>
          <AutoGradeModal isOpen={gradeOpen} onClose={() => setGradeOpen(false)} poll={poll} />
        </Suspense>
      )}

      <div className="absolute top-1/2 -translate-y-1/2 left-2 text-slate-200 cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4" />
      </div>
      <div onClick={() => setActivePoll(index)} className="cursor-pointer pl-5 pr-28">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${poll.is_quiz ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
            {poll.is_quiz ? 'КВИЗ' : poll.type || 'АНКЕТА'}
          </span>
          {isActive && !resultsVisible && (
            <span className="text-amber-500 text-[9px] font-black tracking-widest flex items-center gap-1">
              <EyeOff size={10} /> СКРИЕНО
            </span>
          )}
          {isActive && (
            <div className="flex items-center gap-1 ml-auto">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
              <span className="text-indigo-600 text-[9px] font-black tracking-widest">АКТИВНА</span>
            </div>
          )}
        </div>
        <p className="font-bold text-sm text-slate-800 leading-snug mb-1 line-clamp-2">{poll.question}</p>
        <p className="text-slate-400 font-bold text-xs">
          {['wordcloud', 'open'].includes(poll.type) ? '' : `${poll.options?.length || 0} опции • `}
          {poll.options?.reduce((sum, o) => sum + (o.votes || 0), 0) || 0} одговори
        </p>

        {/* Live vote breakdown — compact, active poll only */}
        {isActive && poll.options && poll.options.length > 0 && (() => {
          const totalVotes = poll.options.reduce((s, o) => s + (o.votes || 0), 0);
          const isRating = poll.type === 'rating';
          const isText = ['wordcloud', 'open'].includes(poll.type);

          if (isText) {
            const approved = poll.options.filter(o => o.text && o.is_approved !== false);
            if (approved.length === 0) return <p className="text-[10px] text-slate-300 font-bold mt-1.5">Нема одговори уште</p>;
            return (
              <div className="mt-2 flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
                {approved.slice(0, 6).map((o, i) => (
                  <span key={i} className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {o.text.slice(0, 24)}
                  </span>
                ))}
                {approved.length > 6 && <span className="text-[10px] text-slate-400 font-bold self-center">+{approved.length - 6}</span>}
              </div>
            );
          }

          if (isRating) {
            const avg = totalVotes > 0
              ? (poll.options.reduce((s, o) => s + (parseInt(o.text || '0') * (o.votes || 0)), 0) / totalVotes).toFixed(1)
              : '—';
            return (
              <div className="mt-2 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <span className="text-lg font-black text-indigo-600">{avg}</span>
                <span className="text-[10px] text-slate-400 font-bold">просек · {totalVotes} гласови</span>
              </div>
            );
          }

          if (totalVotes === 0) return <p className="text-[10px] text-slate-300 font-bold mt-1.5">Нема гласови уште</p>;

          return (
            <div className="mt-2 space-y-1" onClick={e => e.stopPropagation()}>
              {poll.options.slice(0, 4).map((o, i) => {
                const pct = totalVotes > 0 ? Math.round((o.votes || 0) / totalVotes * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${poll.is_quiz && o.is_correct ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-600 w-7 text-right shrink-0">{pct}%</span>
                    <span className="text-[10px] text-slate-400 font-bold truncate max-w-[100px] shrink-0">{o.text}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default PollCard;
