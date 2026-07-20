import React from 'react';
import { ChevronLeft, ChevronRight, Timer, Square, Lock, Unlock, Check } from 'lucide-react';
import { useLiveAnnouncer } from '../../hooks/useLiveAnnouncer';
import VoiceControlButton from '../VoiceControlButton';

const HostNavBar = ({
  activePollIndex,
  polls,
  goNext,
  goPrev,
  timerRemaining,
  startTimer,
  stopTimer,
  event,
  toggleLock,
  onEndSession,
}) => {
  const { announce } = useLiveAnnouncer();

  const handleToggleLock = async () => {
    const next = await toggleLock();
    announce(next ? 'Гласањето е заклучено за публиката.' : 'Гласањето е отклучено за публиката.', { assertive: true });
  };

  return (
    <div className="flex items-center justify-between bg-slate-900 text-white rounded-2xl px-6 py-3 gap-4 flex-wrap">
      <button onClick={goPrev} disabled={activePollIndex === 0}
        className="flex items-center gap-2 font-black text-sm disabled:opacity-30 hover:text-indigo-400 transition-colors disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-5 h-5" /> Претходна
      </button>

      {/* Timer controls */}
      <div className="flex items-center gap-2">
        {timerRemaining > 0 ? (
          <>
            <span className={`font-black text-2xl tabular-nums ${timerRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {String(Math.floor(timerRemaining / 60)).padStart(2,'0')}:{String(timerRemaining % 60).padStart(2,'0')}
            </span>
            <button onClick={stopTimer} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-xs transition-all">
              <Square className="w-3 h-3" /> Стоп
            </button>
          </>
        ) : (
          <>
            <Timer className="w-4 h-4 text-slate-400" />
            {[15, 30, 60, 90].map(s => (
              <button key={s} onClick={() => startTimer(s)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl font-black text-xs transition-all"
              >
                {s}s
              </button>
            ))}
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <VoiceControlButton
          handlers={{
            next: goNext,
            prev: goPrev,
            lock: async () => {
              if (event.is_locked) return;
              await toggleLock();
            },
            unlock: async () => {
              if (!event.is_locked) return;
              await toggleLock();
            },
            start: () => startTimer(60),
            stopCmd: () => stopTimer(),
          }}
        />
        <button
          onClick={handleToggleLock}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all ${
            event.is_locked
              ? 'bg-red-500 text-white'
              : 'bg-slate-700 hover:bg-red-500/20 text-slate-300 hover:text-red-400'
          }`}
          title={event.is_locked ? 'Отклучи публика' : 'Заклучи публика'}
        >
          {event.is_locked
            ? <><Unlock className="w-3.5 h-3.5" /> Отклучи</>
            : <><Lock className="w-3.5 h-3.5" /> Заклучи</>
          }
        </button>
        <button
          onClick={onEndSession}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs bg-slate-700 hover:bg-emerald-600 text-slate-300 hover:text-white transition-all"
          title="Заврши сесија — заклучи и отвори статистики"
        >
          <Check className="w-3.5 h-3.5" /> Заврши
        </button>
        <button onClick={goNext} disabled={activePollIndex === polls.length - 1}
          className="flex items-center gap-2 font-black text-sm disabled:opacity-30 hover:text-indigo-400 transition-colors disabled:cursor-not-allowed"
        >
          Следна <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default HostNavBar;
