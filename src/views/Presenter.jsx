import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Hash, Users, Zap, Cloud, Star, Activity } from 'lucide-react';
import WordCloud from '../components/WordCloud';
import { useEventStore } from '../lib/store';

const Presenter = ({ event, polls, questions, activePollIndex, leaderboard, reactions = [], markQuestionAnswered }) => {
  const { activeParticipants } = useEventStore();
  const eventCode = event?.code || "982341";
  const joinUrl = `${window.location.origin}/event/${eventCode}`;
  const currentPoll = polls[activePollIndex] || { 
    question: "Чекаме да започне првата анкета...", 
    options: [],
    is_quiz: false,
    type: 'poll'
  };
  
  const totalVotes = currentPoll.options?.reduce((a, b) => a + (b.votes || 0), 0) || 0;
  
  const averageRating = totalVotes > 0 
    ? (currentPoll.options.reduce((acc, opt) => acc + (parseInt(opt.text) * opt.votes), 0) / totalVotes).toFixed(1)
    : 0;

  const renderResults = () => {
    if (currentPoll.type === 'wordcloud') {
      return <WordCloud words={currentPoll.options} />;
    }

    if (currentPoll.type === 'rating') {
      return (
        <div className="flex flex-col items-center justify-center space-y-12 py-20 bg-slate-800/20 rounded-[4rem] border border-slate-700/50">
          <div className="text-center">
            <p className="text-slate-500 font-black text-xl uppercase tracking-widest mb-4">Просечна оцена</p>
            <h3 className="text-[12rem] font-black leading-none text-indigo-400">{averageRating}</h3>
          </div>
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className={`w-24 h-24 ${star <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} 
              />
            ))}
          </div>
          <p className="text-3xl font-bold text-slate-400">{totalVotes} гласови</p>
        </div>
      );
    }

    if (currentPoll.type === 'ranking') {
      const sortedOptions = [...currentPoll.options].sort((a, b) => b.votes - a.votes);
      const medals = ['🥇', '🥈', '🥉'];
      const rankColors = [
        'border-amber-500/60 bg-amber-500/10 shadow-amber-500/10',
        'border-slate-400/60 bg-slate-400/10 shadow-slate-400/10',
        'border-orange-600/60 bg-orange-600/10 shadow-orange-600/10',
      ];
      const barColors = ['bg-amber-400', 'bg-slate-400', 'bg-orange-500'];
      return (
        <div className="space-y-5">
          <AnimatePresence mode="popLayout">
            {sortedOptions.map((option, i) => {
              const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
              const isTop = i < 3;
              return (
                <motion.div
                  key={option.id || i}
                  layout
                  initial={{ opacity: 0, x: -60 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
                  className={`flex items-center gap-8 p-7 rounded-[2rem] border shadow-lg ${
                    isTop ? rankColors[i] : 'bg-slate-800/40 border-slate-700/50'
                  }`}
                >
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                    isTop ? 'bg-slate-900/60 text-4xl' : 'bg-indigo-600/20 border border-indigo-500/30 text-2xl font-black text-indigo-300'
                  }`}>
                    {isTop ? medals[i] : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-3xl font-black text-white mb-3 truncate">{option.text}</h4>
                    <div className="h-3 bg-slate-700/60 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.2, ease: 'circOut', delay: i * 0.08 + 0.2 }}
                        className={`h-full rounded-full ${isTop ? barColors[i] : 'bg-indigo-500'}`}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-4xl font-black text-white">{option.votes}</p>
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
          {currentPoll.options.length === 0 ? (
             <div className="col-span-3 py-20 text-center text-slate-500 font-bold text-2xl border-2 border-dashed border-slate-800 rounded-[3rem]">
                Сè уште нема одговори...
             </div>
          ) : (
            currentPoll.options.map((opt, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8, rotate: Math.random() * 10 - 5 }}
                animate={{ opacity: 1, scale: 1, rotate: Math.random() * 6 - 3 }}
                whileHover={{ scale: 1.05, rotate: 0 }}
                className={`${colors[i % colors.length]} p-8 rounded-xl shadow-xl border-t-4 border-black/5 relative min-h-[200px] flex items-center justify-center`}
              >
                <div className="absolute top-4 left-4 w-4 h-4 bg-black/10 rounded-full" />
                <p className="text-slate-800 text-2xl font-black leading-tight text-center font-mono">
                  {opt.text}
                </p>
              </motion.div>
            ))
          )}
        </div>
      );
    }

    const barPalette = [
      { bar: 'bg-indigo-600', glow: 'rgba(99,102,241,0.35)', text: 'text-indigo-400' },
      { bar: 'bg-violet-600', glow: 'rgba(139,92,246,0.35)', text: 'text-violet-400' },
      { bar: 'bg-emerald-500', glow: 'rgba(16,185,129,0.35)', text: 'text-emerald-400' },
      { bar: 'bg-amber-500',  glow: 'rgba(245,158,11,0.35)',  text: 'text-amber-400'  },
      { bar: 'bg-rose-500',   glow: 'rgba(239,68,68,0.35)',   text: 'text-rose-400'   },
      { bar: 'bg-cyan-500',   glow: 'rgba(6,182,212,0.35)',   text: 'text-cyan-400'   },
    ];
    const maxVotes = Math.max(...currentPoll.options.map(o => o.votes || 0), 1);

    return (
      <div className="space-y-7">
        <AnimatePresence mode="popLayout">
          {currentPoll.options.map((option, i) => {
            const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
            const isLeading = option.votes === maxVotes && option.votes > 0;
            const palette = barPalette[i % barPalette.length];
            return (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 200, damping: 22 }}
                className="relative"
              >
                <div className="flex justify-between items-end mb-3 px-2">
                  <span className={`text-3xl font-black ${isLeading ? 'text-white' : 'text-slate-300'}`}>
                    {isLeading && '👑 '}{option.text}
                  </span>
                  <span className={`text-4xl font-black ${palette.text}`}>{percentage}%</span>
                </div>
                <div className="h-20 w-full bg-slate-800 rounded-[1.5rem] overflow-hidden border border-slate-700/50 p-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, ease: 'circOut', delay: i * 0.06 }}
                    className={`h-full ${palette.bar} rounded-xl relative`}
                    style={{ boxShadow: `0 0 30px ${palette.glow}` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  };

  const getSubTitle = () => {
    if (currentPoll.type === 'wordcloud') return '☁️ Облак со зборови';
    if (currentPoll.type === 'open') return '💬 Отворени одговори';
    if (currentPoll.type === 'rating') return '⭐ Оценување во живо';
    if (currentPoll.type === 'ranking') return '🏅 Рангирање во живо';
    if (currentPoll.is_quiz) return '🏆 Квиз во живо';
    return '📊 Анкета во живо';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col p-12 overflow-hidden relative">
      {/* Floating Reactions Layer */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {reactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ y: '100vh', x: `${20 + Math.random() * 60}vw`, opacity: 0, scale: 0.5 }}
              animate={{ y: '-10vh', opacity: [0, 1, 1, 0], scale: [1, 1.5, 1.2, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 4, ease: "easeOut" }}
              className="absolute text-6xl"
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Top Header */}
      <div className="flex items-center justify-between mb-20">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 p-4 rounded-3xl shadow-2xl shadow-indigo-500/20">
            <Zap className="w-10 h-10 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">MKD <span className="text-indigo-400">Slidea</span></h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
              {getSubTitle()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <div className="text-right">
            <p className="text-slate-500 font-black text-sm uppercase tracking-widest mb-1">Приклучи се на</p>
            <p className="text-3xl font-black text-indigo-400">{window.location.host}</p>
          </div>
          <div className="bg-white p-3 rounded-3xl shadow-2xl border-4 border-slate-800">
            <QRCodeSVG value={joinUrl} size={100} />
          </div>
          <div className="bg-slate-800 px-8 py-5 rounded-[2rem] border border-slate-700">
            <p className="text-slate-500 font-black text-xs uppercase tracking-widest mb-1 text-center">Код за влезот</p>
            <p className="text-5xl font-black tracking-widest text-white">#{eventCode}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-12 gap-16">
        {/* Left: Active Poll Results */}
        <div className="col-span-8 space-y-12">
          <motion.h2 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-6xl font-black leading-tight max-w-4xl"
          >
            {currentPoll.question}
          </motion.h2>

          {renderResults()}
        </div>

        {/* Right: Q&A / Sidebar / Leaderboard */}
        <div className="col-span-4 space-y-8">
          <div className="bg-slate-800/50 backdrop-blur-xl p-10 rounded-[4rem] border border-slate-700/50 h-full flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <div className="w-1.5 h-10 bg-indigo-500 rounded-full" />
                {currentPoll.is_quiz ? 'Табела на лидери' : 'Топ прашања'}
              </h3>
              <div className="bg-slate-700/50 px-5 py-3 rounded-[1.5rem] border border-slate-600/50 flex items-center gap-3 text-indigo-400 font-black shadow-lg">
                <div className="relative">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-indigo-400 rounded-full scale-150 blur-sm opacity-20"
                  />
                </div>
                <span className="text-xl">{activeParticipants} во живо</span>
              </div>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-4 scrollbar-hide">
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
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`flex items-center justify-between p-5 rounded-2xl border ${
                        isTop ? topColors[i] : 'bg-slate-800 border-slate-700/30 text-slate-300'
                      }`}
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
                  <motion.div 
                    key={q.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-8 bg-slate-800 rounded-[2.5rem] border border-slate-700/30 group hover:border-indigo-500/50 transition-all"
                  >
                    <p className="text-2xl font-bold mb-4 text-slate-200">{q.text}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{q.author}</span>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => markQuestionAnswered(q.id)}
                          className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase rounded-lg border border-indigo-500/20 transition-all"
                        >
                          Одговорено
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
      </div>

      {/* Footer Info */}
      <div className="mt-auto pt-10 flex items-center justify-between border-t border-slate-800/50 text-slate-600 font-black text-xs uppercase tracking-[0.2em]">
        <p>© 2026 MKD Slidea • Автор: Игор Богданоски • Направено во 🇲🇰</p>
        <p>Најдобрата платформа за интеракција во живо</p>
        <p>100% приватно и безбедно</p>
      </div>
    </div>
  );
};

export default Presenter;
