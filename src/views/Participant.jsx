import React from 'react';
import { motion } from 'framer-motion';
import { Hash, PieChart, MessageSquare, Send, ThumbsUp, Trophy, CheckCircle2 } from 'lucide-react';

const Participant = ({ 
  polls, 
  questions, 
  activePollIndex, 
  userVoted, 
  handleVote, 
  handleUpvote, 
  newQuestion, 
  setNewQuestion, 
  submitQuestion,
  username,
  setUsername
}) => {
  const currentPoll = polls[activePollIndex];
  
  if (!username) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto px-6 pt-32 text-center"
      >
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
          <h2 className="text-2xl font-black mb-6">Како да те запишеме?</h2>
          <input 
            type="text" 
            placeholder="Твоето име..."
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all mb-6 text-center"
            onKeyDown={(e) => e.key === 'Enter' && setUsername(e.target.value)}
          />
          <button 
            onClick={(e) => setUsername(e.currentTarget.previousSibling.value)}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Започни
          </button>
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      key="participant"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-xl mx-auto px-6 pt-12 pb-24"
    >
      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <Hash className="text-white w-5 h-5" />
          </div>
          <span className="font-black text-slate-900">#982341</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Во живо</span>
        </div>
      </div>

      <div className="space-y-8">
        {/* Active Activity Card */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-100/50 border border-slate-100 relative overflow-hidden">
          {currentPoll.is_quiz && (
            <div className="absolute top-0 right-0 bg-amber-100 text-amber-600 px-6 py-2 rounded-bl-3xl font-black text-xs tracking-widest">КВИЗ</div>
          )}
          <div className="flex items-center gap-2 mb-6">
            {currentPoll.is_quiz ? <Trophy className="text-amber-500 w-5 h-5" /> : <PieChart className="text-indigo-600 w-5 h-5" />}
            <span className={`font-black text-xs uppercase tracking-widest ${currentPoll.is_quiz ? 'text-amber-500' : 'text-indigo-600'}`}>
              {currentPoll.is_quiz ? 'Натпревар во живо' : 'Анкета во живо'}
            </span>
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 mb-8 leading-tight">
            {currentPoll.question}
          </h2>

          <div className="space-y-4">
            {currentPoll.options.map((option, i) => {
              const totalVotes = currentPoll.options.reduce((a, b) => a + b.votes, 0);
              const percentage = Math.round((option.votes / totalVotes) * 100) || 0;
              
              const isCorrect = currentPoll.is_quiz && option.is_correct;
              
              return (
                <button
                  key={i}
                  onClick={() => handleVote(i)}
                  disabled={userVoted}
                  className={`w-full group relative overflow-hidden p-6 rounded-3xl border-2 transition-all text-left ${
                    userVoted 
                      ? isCorrect 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-slate-50 bg-slate-50 opacity-60'
                      : 'border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 active:scale-[0.98]'
                  }`}
                >
                  <div className="relative z-10 flex justify-between items-center font-bold">
                    <span className={userVoted ? 'text-slate-800' : 'text-slate-700'}>{option.text}</span>
                    {userVoted && (
                      <div className="flex items-center gap-3">
                        {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                        <span className="text-indigo-600">{percentage}%</span>
                      </div>
                    )}
                  </div>
                  {userVoted && !currentPoll.is_quiz && (
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className="absolute top-0 left-0 h-full bg-indigo-100/50 -z-0"
                    />
                  )}
                </button>
              );
            })}
          </div>
          
          {userVoted && (
            <p className="mt-6 text-center text-sm font-bold text-slate-400 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
              Ви благодариме за гласањето!
            </p>
          )}
        </div>

        {/* Q&A Section */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="text-indigo-600 w-5 h-5" />
            <span className="font-black text-xs text-indigo-600 uppercase tracking-widest">Прашај нешто</span>
          </div>

          <div className="flex gap-2 mb-8">
            <input 
              type="text" 
              placeholder="Што те интересира?"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
            />
            <button 
              onClick={submitQuestion}
              className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="flex items-start justify-between gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="font-bold text-slate-700 mb-1">{q.text}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{q.author}</p>
                </div>
                <button 
                  onClick={() => handleUpvote(q.id)}
                  className="flex flex-col items-center gap-1 p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-indigo-600"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-xs font-black">{q.votes}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Participant;
