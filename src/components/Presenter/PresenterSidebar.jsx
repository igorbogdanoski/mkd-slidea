import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Hash, Activity, Users } from 'lucide-react';

// ─── Right sidebar: Q&A / Leaderboard ─────────────────────────────────────────
const PresenterSidebar = ({ currentPoll, leaderboard, questions, activeParticipants, activeNow, totalVotes, brandColor, markQuestionAnswered, setQuestionPinned, setQuestionHidden }) => {
  const [pendingAnsweredId, setPendingAnsweredId] = useState(null);

  return (
    <div className="col-span-4">
      <div className="bg-slate-800/50 backdrop-blur-xl p-10 rounded-[4rem] border border-slate-700/50 h-full flex flex-col">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-2xl font-black flex items-center gap-3">
            <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: brandColor }} />
            {currentPoll.is_quiz ? 'Табела на лидери' : 'Топ прашања'}
          </h3>
          <div className="flex flex-col items-end gap-2">
            <div className="bg-slate-700/50 px-5 py-3 rounded-[1.5rem] border border-slate-600/50 flex items-center gap-3 text-indigo-400 font-black">
              <div className="relative">
                <Activity className="w-5 h-5 text-indigo-400" />
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-indigo-400 rounded-full scale-150 blur-sm opacity-20"
                />
              </div>
              <span className="text-xl">{activeParticipants} во живо</span>
              {activeNow > 0 && (
                <span
                  className="ml-2 text-xs font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  title="Активни во последните 4 секунди"
                >
                  🔥 {activeNow} активни сега
                </span>
              )}
            </div>
            {activeParticipants > 0 && ['poll','quiz','rating','ranking','scale','wordcloud','open'].includes(currentPoll.type) && (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-black text-sm">
                  {Math.min(totalVotes, activeParticipants)}/{activeParticipants} одговориле
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5 flex-1 overflow-y-auto pr-4 scrollbar-hide">
          {currentPoll.is_quiz ? (
            [...leaderboard].sort((a, b) => b.points - a.points).map((user, i) => {
              const medals = ['🥇', '🥈', '🥉'];
              const topColors = [
                'bg-amber-500/20 border-amber-500/40 text-amber-300',
                'bg-slate-400/10 border-slate-400/30 text-slate-300',
                'bg-orange-600/10 border-orange-600/30 text-orange-300',
              ];
              const isTop = i < 3;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex items-center justify-between p-5 rounded-2xl border ${isTop ? topColors[i] : 'bg-slate-800 border-slate-700/30 text-slate-300'}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{isTop ? medals[i] : `#${i + 1}`}</span>
                    <span className="text-xl font-black truncate max-w-[120px]">{user.username}</span>
                  </div>
                  <span className={`text-2xl font-black ${isTop ? '' : 'text-indigo-400'}`}>{user.points} pts</span>
                </motion.div>
              );
            })
          ) : (
            questions.map((q, i) => (
              <motion.div key={q.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-slate-800 rounded-[2.5rem] border border-slate-700/30 hover:border-indigo-500/50 transition-all"
              >
                <p className="text-2xl font-bold mb-4 text-slate-200">{q.text}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    {q.author}
                    {q.is_pinned && <span className="ml-2 text-amber-400">📌</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    {typeof setQuestionPinned === 'function' && (
                      <button
                        onClick={() => setQuestionPinned(q.id, !q.is_pinned)}
                        className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg border transition-all ${q.is_pinned ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' : 'bg-slate-700/40 hover:bg-slate-700/70 text-slate-400 border-slate-700/40'}`}
                        title="Pin"
                      >
                        {q.is_pinned ? 'Откачи' : 'Pin'}
                      </button>
                    )}
                    {typeof setQuestionHidden === 'function' && (
                      <button
                        onClick={() => setQuestionHidden(q.id, true)}
                        className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase rounded-lg border border-rose-500/20 transition-all"
                        title="Сокриј"
                      >
                        Сокриј
                      </button>
                    )}
                    <button onClick={() => {
                      if (pendingAnsweredId === q.id) {
                        markQuestionAnswered(q.id);
                        setPendingAnsweredId(null);
                        return;
                      }
                      setPendingAnsweredId(q.id);
                      setTimeout(() => {
                        setPendingAnsweredId((prev) => (prev === q.id ? null : prev));
                      }, 2500);
                    }}
                      className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase rounded-lg border border-indigo-500/20 transition-all"
                    >
                      {pendingAnsweredId === q.id ? 'Потврди' : 'Одговорено'}
                    </button>
                    <div className="flex items-center gap-2 text-indigo-400 font-black">
                      <span className="text-2xl">{q.votes}</span>
                      <Hash className="w-4 h-4 text-slate-600" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PresenterSidebar;
