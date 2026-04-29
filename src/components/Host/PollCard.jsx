import React, { useState, lazy, Suspense } from 'react';
import { GripVertical, Eye, EyeOff, RotateCcw, Pencil, Trash2, Copy, ShieldCheck, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AutoGradeModal = lazy(() => import('../AutoGradeModal'));

const PollCard = ({ poll, index, activePollIndex, setActivePoll, onEdit, onDelete, onDuplicate, onPollUpdated }) => {
  const isActive = activePollIndex === index;
  const resultsVisible = poll.results_visible !== false;
  const needsModeration = !!poll.needs_moderation;
  const isTextPoll = ['wordcloud', 'open'].includes(poll.type);
  const isOpen = poll.type === 'open';
  const hasAnswers = (poll.options || []).some((o) => o?.text && o.is_approved !== false);
  const [gradeOpen, setGradeOpen] = useState(false);

  const toggleResultsVisible = async (e) => {
    e.stopPropagation();
    const { error } = await supabase.from('polls').update({ results_visible: !resultsVisible }).eq('id', poll.id);
    if (!error && onPollUpdated) onPollUpdated();
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
      className={`p-8 rounded-[2rem] border-2 transition-all relative overflow-hidden ${isActive ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-50 bg-white hover:border-indigo-100'}`}
    >
      <div className="absolute top-0 right-0 p-4 flex gap-2 bg-white/50 backdrop-blur-md rounded-bl-[1.5rem] border-l border-b border-indigo-100 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(poll); }}
          title="Измени"
          className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
        >
          <Pencil size={18} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(poll); }}
          title="Дупликат"
          className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
        >
          <Copy size={18} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(poll.id); }}
          title="Избриши"
          className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-red-500 transition-all"
        >
          <Trash2 size={18} />
        </button>
        {isActive && (
          <>
            <button
              onClick={toggleResultsVisible}
              title={resultsVisible ? 'Скриј резултати од учесниците' : 'Прикажи резултати'}
              className={`p-2 hover:bg-white rounded-xl transition-all ${resultsVisible ? 'text-slate-400 hover:text-amber-500' : 'text-amber-500 bg-amber-50'}`}
            >
              {resultsVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {isTextPoll && (
              <button
                onClick={toggleModeration}
                title={needsModeration ? 'Модерација вклучена — клик за исклучување' : 'Вклучи модерација на одговори'}
                className={`p-2 hover:bg-white rounded-xl transition-all ${needsModeration ? 'text-violet-600 bg-violet-50' : 'text-slate-400 hover:text-violet-600'}`}
              >
                <ShieldCheck size={18} />
              </button>
            )}
            <button
              onClick={resetVotes}
              title="Ресетирај гласови"
              className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
            >
              <RotateCcw size={18} />
            </button>
          </>
        )}
        {isOpen && hasAnswers && (
          <button
            onClick={(e) => { e.stopPropagation(); setGradeOpen(true); }}
            title="AI авто-оценување на одговори"
            aria-label="AI авто-оценување"
            className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-violet-600 transition-all"
          >
            <Sparkles size={18} />
          </button>
        )}
      </div>

      {gradeOpen && (
        <Suspense fallback={null}>
          <AutoGradeModal isOpen={gradeOpen} onClose={() => setGradeOpen(false)} poll={poll} />
        </Suspense>
      )}

      <div className="absolute top-1/2 -translate-y-1/2 left-3 text-slate-200 cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5" />
      </div>
      <div onClick={() => setActivePoll(index)} className="cursor-pointer pl-4">
        <div className="flex justify-between items-center mb-4 pr-24">
          <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${poll.is_quiz ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
            {poll.is_quiz ? 'КВИЗ' : poll.type || 'АНКЕТА'}
          </span>
          <div className="flex items-center gap-3">
            {isActive && !resultsVisible && (
              <span className="text-amber-500 text-[10px] font-black tracking-widest flex items-center gap-1">
                <EyeOff size={12} /> СКРИЕНО
              </span>
            )}
            {isActive && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                <span className="text-indigo-600 text-[10px] font-black tracking-widest">АКТИВНА</span>
              </div>
            )}
          </div>
        </div>
        <p className="font-black text-xl text-slate-800 leading-tight mb-2">{poll.question}</p>
        <p className="text-slate-400 font-bold text-sm">
          {['wordcloud', 'open'].includes(poll.type) ? '' : `${poll.options?.length || 0} опции • `}
          {poll.options?.reduce((sum, o) => sum + (o.votes || 0), 0) || 0} одговори
        </p>
      </div>
    </div>
  );
};

export default PollCard;
