import React from 'react';
import { Lock, EyeOff, RotateCcw, Pencil, Trash2 } from 'lucide-react';

const PollCard = ({ poll, index, activePollIndex, setActivePoll, onEdit, onDelete }) => {
  const isActive = activePollIndex === index;
  
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
        {isActive && (
          <>
            <button title="Заклучи гласање" className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-red-500 transition-all">
              <Lock size={18} />
            </button>
            <button title="Скриј резултати" className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-amber-500 transition-all">
              <EyeOff size={18} />
            </button>
            <button title="Ресетирај" className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
              <RotateCcw size={18} />
            </button>
          </>
        )}
      </div>
      <div 
        onClick={() => setActivePoll(index)}
        className="cursor-pointer"
      >
        <div className="flex justify-between items-center mb-4 pr-24">
        <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${poll.is_quiz ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
          {poll.is_quiz ? 'КВИЗ' : poll.type || 'АНКЕТА'}
        </span>
        {isActive && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
            <span className="text-indigo-600 text-[10px] font-black tracking-widest">АКТИВНА</span>
          </div>
        )}
      </div>
      <p className="font-black text-xl text-slate-800 leading-tight mb-2">{poll.question}</p>
      <p className="text-slate-400 font-bold text-sm">{poll.options?.length || 0} опции • 0 одговори</p>
      </div>
    </div>
  );
};

export default PollCard;
