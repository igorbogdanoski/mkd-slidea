import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  Users, 
  Lock, 
  EyeOff, 
  RotateCcw,
  Smartphone
} from 'lucide-react';
import { useEventStore } from '../../lib/store';

const RemoteController = ({ polls, activePollIndex, setActivePoll, eventCode }) => {
  const { activeParticipants } = useEventStore();
  const currentPoll = polls[activePollIndex];

  const handleNext = () => {
    if (activePollIndex < polls.length - 1) {
      setActivePoll(activePollIndex + 1);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }
  };

  const handlePrev = () => {
    if (activePollIndex > 0) {
      setActivePoll(activePollIndex - 1);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }
  };

  const handleAction = (_action) => {
    if (window.navigator.vibrate) window.navigator.vibrate([30, 30, 30]);
  };

  if (!currentPoll) return null;

  return (
    <div className="fixed inset-0 bg-slate-950 z-[200] flex flex-col text-white font-sans">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-white/10 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight">Далечинска <span className="text-indigo-400">Контрола</span></h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">#{eventCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
          <Users className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-black text-indigo-400">{activeParticipants}</span>
        </div>
      </div>

      {/* Main Content: Active Poll Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPoll.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            className="w-full"
          >
            <span className="inline-block px-4 py-1.5 bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-lg shadow-indigo-600/20">
              {currentPoll.is_quiz ? 'КВИЗ' : 'АНКЕТА'} {activePollIndex + 1}/{polls.length}
            </span>
            <h2 className="text-3xl md:text-5xl font-black leading-tight mb-8">
              {currentPoll.question}
            </h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
              {currentPoll.options?.length || 0} опции • 0 одговори
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-3 gap-4 p-8 bg-slate-900/30">
        <button 
          onClick={() => handleAction('lock')}
          className="flex flex-col items-center gap-3 p-6 bg-slate-900 border border-white/5 rounded-[2rem] active:bg-red-600/20 active:border-red-600/50 transition-all group"
        >
          <Lock className="w-6 h-6 text-slate-400 group-active:text-red-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-active:text-red-500">Заклучи</span>
        </button>
        <button 
          onClick={() => handleAction('hide')}
          className="flex flex-col items-center gap-3 p-6 bg-slate-900 border border-white/5 rounded-[2rem] active:bg-amber-600/20 active:border-amber-600/50 transition-all group"
        >
          <EyeOff className="w-6 h-6 text-slate-400 group-active:text-amber-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-active:text-amber-500">Скриј</span>
        </button>
        <button 
          onClick={() => handleAction('reset')}
          className="flex flex-col items-center gap-3 p-6 bg-slate-900 border border-white/5 rounded-[2rem] active:bg-indigo-600/20 active:border-indigo-600/50 transition-all group"
        >
          <RotateCcw className="w-6 h-6 text-slate-400 group-active:text-indigo-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-active:text-indigo-400">Ресетирај</span>
        </button>
      </div>

      {/* Navigation Controls: Large Mobile-First Buttons */}
      <div className="p-8 flex gap-4 bg-slate-900 border-t border-white/5">
        <button
          onClick={handlePrev}
          disabled={activePollIndex === 0}
          className="flex-1 py-8 bg-slate-800 rounded-[2.5rem] flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all active:bg-slate-700"
        >
          <ChevronLeft size={48} className="text-white" />
        </button>
        <button
          onClick={handleNext}
          disabled={activePollIndex === polls.length - 1}
          className="flex-1 py-8 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all active:bg-indigo-700 shadow-2xl shadow-indigo-600/20"
        >
          <ChevronRight size={48} className="text-white" />
        </button>
      </div>
      
      {/* Footer Info */}
      <div className="p-6 text-center bg-slate-900 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] border-t border-white/5">
        MKD Slidea • Далечински режим
      </div>
    </div>
  );
};

export default RemoteController;
