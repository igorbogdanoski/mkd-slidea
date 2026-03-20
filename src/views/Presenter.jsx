import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Hash, Users, Zap, Cloud, Star } from 'lucide-react';
import WordCloud from '../components/WordCloud';

const Presenter = ({ event, polls, questions, activePollIndex, leaderboard, reactions = [] }) => {
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
      return (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {sortedOptions.map((option, i) => (
              <motion.div 
                key={option.id || i}
                layout
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-8 bg-slate-800/40 p-8 rounded-[2rem] border border-slate-700/50"
              >
                <div className="bg-indigo-600 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black shadow-lg shadow-indigo-500/20">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h4 className="text-3xl font-bold text-white mb-2">{option.text}</h4>
                  <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0}%` }}
                      className="h-full bg-indigo-500"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-indigo-400">{option.votes}</p>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Поени</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      );
    }

    if (currentPoll.type === 'open') {
      const colors = ['bg-amber-100', 'bg-emerald-100', 'bg-rose-100', 'bg-sky-100', 'bg-violet-100'];
      return (
        <div className="grid grid-cols-3 gap-8 max-h-[600px] overflow-y-auto pr-4 scrollbar-hide p-4">
          {currentPoll.options.map((opt, i) => (
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
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {currentPoll.options.map((option, i) => {
            const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
            return (
              <motion.div 
                key={i}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
              >
                <div className="flex justify-between items-end mb-4 px-2">
                  <span className="text-3xl font-bold text-slate-200">{option.text}</span>
                  <span className="text-4xl font-black text-indigo-400">{percentage}%</span>
                </div>
                <div className="h-20 w-full bg-slate-800 rounded-[1.5rem] overflow-hidden border border-slate-700 p-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className="h-full bg-indigo-600 rounded-xl relative shadow-[0_0_30px_rgba(79,70,229,0.3)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
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
            <p className="text-3xl font-black text-indigo-400">slidea.mismath.net</p>
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
              {!currentPoll.is_quiz && (
                <div className="bg-slate-700 px-4 py-2 rounded-2xl text-sm font-black text-indigo-400 flex items-center gap-2">
                  <Users className="w-4 h-4" /> 24 во живо
                </div>
              )}
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-4 scrollbar-hide">
              {currentPoll.is_quiz ? (
                leaderboard.sort((a, b) => b.points - a.points).map((user, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-6 bg-slate-800 rounded-3xl border border-slate-700/30"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`text-xl font-black ${i === 0 ? 'text-amber-400' : 'text-slate-500'}`}>#{i+1}</span>
                      <span className="text-xl font-bold">{user.username}</span>
                    </div>
                    <span className="text-2xl font-black text-indigo-400">{user.points}</span>
                  </motion.div>
                ))
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
                      <div className="flex items-center gap-3 text-indigo-400 font-black">
                        <span className="text-3xl">{q.votes}</span>
                        <Hash className="w-4 h-4 text-slate-600" />
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
        <p>© 2024 MKD Slidea • Направено во 🇲🇰</p>
        <p>Најдобрата платформа за интеракција во живо</p>
        <p>100% приватно и безбедно</p>
      </div>
    </div>
  );
};

export default Presenter;
