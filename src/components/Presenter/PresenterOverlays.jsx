import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play } from 'lucide-react';

// ─── Small overlays: presenter notes / countdown / pause banner ───────────────
const PresenterOverlays = ({ showNotes, setShowNotes, currentPoll, timerRemaining, event, onToggleLock, handleToggleLock }) => (
  <>
    {/* Sprint 8.3.6 — Presenter notes overlay (host-only, toggle 'N') */}
    <AnimatePresence>
      {showNotes && currentPoll?.presenter_notes && (
        <motion.div
          key="presenter-notes"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-6 right-6 z-[60] max-w-md bg-amber-50 border-2 border-amber-300 rounded-3xl shadow-2xl p-5 text-slate-800"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
              Белешки за презентер
            </div>
            <button
              type="button"
              onClick={() => setShowNotes(false)}
              className="text-amber-600 hover:text-amber-800 text-xs font-black uppercase tracking-widest"
            >
              N · скриј
            </button>
          </div>
          <p className="text-sm font-bold whitespace-pre-wrap leading-relaxed">
            {currentPoll.presenter_notes}
          </p>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Countdown overlay — last 5 seconds */}
    <AnimatePresence>
      {timerRemaining !== null && timerRemaining > 0 && timerRemaining <= 5 && (
        <motion.div
          key={timerRemaining}
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'backOut' }}
          className="fixed inset-0 z-[80] flex items-center justify-center pointer-events-none"
        >
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full blur-3xl opacity-40"
              style={{ backgroundColor: timerRemaining <= 3 ? '#ef4444' : '#f59e0b', transform: 'scale(2)' }}
            />
            <p
              className="relative text-[22rem] font-black tabular-nums leading-none select-none"
              style={{ color: timerRemaining <= 3 ? '#ef4444' : '#f59e0b', textShadow: '0 0 80px currentColor' }}
            >
              {timerRemaining}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Pause overlay banner */}
    <AnimatePresence>
      {event?.is_locked && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[70] flex items-center justify-center gap-4 py-3 bg-red-600 text-white font-black text-sm uppercase tracking-widest"
        >
          <Pause className="w-4 h-4" />
          Гласањето е паузирано — учесниците не можат да гласаат
          {onToggleLock && (
            <button
              onClick={handleToggleLock}
              className="ml-4 px-4 py-1 bg-white text-red-600 rounded-xl text-xs font-black hover:bg-red-50 transition-all"
            >
              <Play className="w-3 h-3 inline mr-1" /> Продолжи
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  </>
);

export default PresenterOverlays;
