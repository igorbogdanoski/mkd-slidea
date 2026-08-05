import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, Pause, Play, Timer, TimerOff, Eye, EyeOff } from 'lucide-react';

// ─── Footer controls: pause / timer / confetti ────────────────────────────────
const PresenterControls = ({ event, onToggleLock, lockPending, handleToggleLock, timerRemaining, timerPickerOpen, setTimerPickerOpen, handleStartTimer, handleStopTimer, fireConfetti, onStartTimer, currentPoll, onToggleAnswer }) => {
  const timerPickerRef = useRef(null);

  // Close timer picker on outside click
  useEffect(() => {
    if (!timerPickerOpen) return;
    const close = (e) => {
      if (timerPickerRef.current && !timerPickerRef.current.contains(e.target)) {
        setTimerPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [timerPickerOpen]);

  return (
    <div className="flex items-center gap-3">
      {/* Pause / Resume */}
      {onToggleLock && (
        <button
          onClick={handleToggleLock}
          disabled={lockPending}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all border ${
            event?.is_locked
              ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-white'
              : 'bg-slate-800 hover:bg-red-500/20 border-slate-700/50 text-slate-400 hover:text-red-400 hover:border-red-500/40'
          }`}
          title={event?.is_locked ? 'Продолжи со гласање (L)' : 'Паузирај гласање (L)'}
        >
          {event?.is_locked
            ? <><Play className="w-3.5 h-3.5" /> Продолжи</>
            : <><Pause className="w-3.5 h-3.5" /> Паузирај</>
          }
        </button>
      )}

      {/* Reveal the answer key — only for the activity types that have one.
          The reveal is written to the poll row, so this button changes what
          every phone in the room shows at the same instant. */}
      {onToggleAnswer && ['open', 'fill_blanks'].includes(currentPoll?.type) &&
        (currentPoll?.correct_answer || (currentPoll?.blanks || []).length > 0) && (
        <button
          onClick={() => onToggleAnswer(currentPoll.id, !currentPoll.answer_revealed)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all border ${
            currentPoll.answer_revealed
              ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-white'
              : 'bg-slate-800 hover:bg-emerald-500/20 border-slate-700/50 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40'
          }`}
          title={currentPoll.answer_revealed ? 'Сокриј го точниот одговор' : 'Покажи го точниот одговор на сите'}
        >
          {currentPoll.answer_revealed
            ? <><EyeOff className="w-3.5 h-3.5" /> Сокриј одговор</>
            : <><Eye className="w-3.5 h-3.5" /> Покажи одговор</>
          }
        </button>
      )}

      {/* Timer picker */}
      {onStartTimer && currentPoll?.id && (
        <div className="relative" ref={timerPickerRef}>
          <button
            onClick={() => {
              if (timerRemaining && timerRemaining > 0) {
                handleStopTimer();
              } else {
                setTimerPickerOpen((v) => !v);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all border ${
              timerRemaining && timerRemaining > 0
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400'
                : 'bg-slate-800 hover:bg-indigo-600/20 border-slate-700/50 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/40'
            }`}
            title={timerRemaining && timerRemaining > 0 ? 'Стопирај тајмер' : 'Стартувај тајмер'}
          >
            {timerRemaining && timerRemaining > 0
              ? <><TimerOff className="w-3.5 h-3.5" /> Стопирај</>
              : <><Timer className="w-3.5 h-3.5" /> Тајмер</>
            }
          </button>

          <AnimatePresence>
            {timerPickerOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute bottom-full mb-2 right-0 bg-slate-800 border border-slate-700/60 rounded-2xl p-3 shadow-2xl flex flex-col gap-1.5 min-w-[130px]"
              >
                {[
                  { label: '30 сек', sec: 30 },
                  { label: '60 сек', sec: 60 },
                  { label: '90 сек', sec: 90 },
                  { label: '2 мин', sec: 120 },
                  { label: '5 мин', sec: 300 },
                ].map(({ label, sec }) => (
                  <button
                    key={sec}
                    onClick={() => handleStartTimer(sec)}
                    className="px-4 py-2 text-slate-300 font-bold text-sm hover:bg-indigo-600 hover:text-white rounded-xl transition-all text-left"
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <button
        onClick={fireConfetti}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 border border-slate-700/50 hover:border-indigo-500 transition-all text-slate-400 hover:text-white"
        title="Преслави со конфети!"
      >
        <PartyPopper className="w-4 h-4" /> Конфети 🎉
      </button>
    </div>
  );
};

export default PresenterControls;
