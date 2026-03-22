import React from 'react';
import { motion } from 'framer-motion';
import { Hash, PieChart, MessageSquare, Send, ThumbsUp, Trophy, CheckCircle2, Star, Activity } from 'lucide-react';
import { useEventStore } from '../lib/store';

const Participant = ({
  polls,
  questions,
  activePollIndex,
  userVoted,
  resultsVisible = true,
  timerRemaining,
  handleVote,
  handleUpvote,
  newQuestion,
  setNewQuestion,
  submitQuestion,
  username,
  setUsername,
  sendReaction
}) => {
  const { activeParticipants } = useEventStore();
  const currentPoll = polls[activePollIndex] || { question: 'Чекаме настан...', options: [], type: 'poll' };
  const [response, setResponse] = React.useState('');
  const [rating, setRating] = React.useState(0);

  const submitResponse = async () => {
    if (!response.trim()) return;
    handleVote(response.trim());
    setResponse('');
  };

  const submitRating = async (val) => {
    const idx = currentPoll.options.findIndex(o => o.text === val.toString());
    if (idx !== -1) {
      handleVote(idx);
    }
  };

  const [nameInput, setNameInput] = React.useState('');
  const confirmName = () => { const v = nameInput.trim(); if (v) setUsername(v); };

  if (!username) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto px-6 pt-32 text-center"
      >
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
          <div className="text-5xl mb-6">👋</div>
          <h2 className="text-2xl font-black mb-2">Kako да те запишеме?</h2>
          <p className="text-slate-400 font-bold mb-8">Твоето ime ќе се прикаже на лидерборд и во прашања</p>
          <input
            type="text"
            placeholder="Твоето ime..."
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirmName()}
            autoFocus
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all mb-6 text-center text-xl"
          />
          <button
            onClick={confirmName}
            disabled={!nameInput.trim()}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            Започни →
          </button>
        </div>
      </motion.div>
    );
  }

  const isTextType = ['wordcloud', 'open'].includes(currentPoll.type);

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative">
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
            <span className="font-black text-slate-900">#{polls[0]?.event_id?.substring(0,6) || '982341'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 px-3 py-1.5 rounded-2xl flex items-center gap-2 border border-slate-200">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{activeParticipants} во живо</span>
            </div>
            <div className="w-px h-4 bg-slate-200 mx-1"></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Активно</span>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-100/50 border border-slate-100 relative overflow-hidden">
            {currentPoll.is_quiz && (
              <div className="absolute top-0 right-0 bg-amber-100 text-amber-600 px-6 py-2 rounded-bl-3xl font-black text-xs tracking-widest">КВИЗ</div>
            )}
            <div className="flex items-center gap-2 mb-6">
              {currentPoll.is_quiz ? <Trophy className="text-amber-500 w-5 h-5" /> : <PieChart className="text-indigo-600 w-5 h-5" />}
              <span className={`font-black text-xs uppercase tracking-widest ${currentPoll.is_quiz ? 'text-amber-500' : 'text-indigo-600'}`}>
                {currentPoll.type === 'wordcloud' ? 'Облак со зборови' : 
                 currentPoll.type === 'ranking' ? 'Рангирање' :
                 currentPoll.type === 'rating' ? 'Оценување' :
                 currentPoll.type === 'open' ? 'Отворен текст' :
                 currentPoll.is_quiz ? 'Натпревар во живо' : 'Анкета во живо'}
              </span>
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 mb-8 leading-tight">
              {currentPoll.question}
            </h2>

            {/* Timer bar */}
            {timerRemaining > 0 && (
              <div className={`mb-6 rounded-2xl px-5 py-3 flex items-center justify-between ${timerRemaining <= 10 ? 'bg-red-50 border border-red-200' : 'bg-indigo-50 border border-indigo-100'}`}>
                <span className={`font-black text-sm ${timerRemaining <= 10 ? 'text-red-600' : 'text-indigo-600'}`}>⏱ Преостанато</span>
                <span className={`font-black text-2xl tabular-nums ${timerRemaining <= 10 ? 'text-red-600 animate-pulse' : 'text-indigo-700'}`}>
                  {String(Math.floor(timerRemaining / 60)).padStart(2,'0')}:{String(timerRemaining % 60).padStart(2,'0')}
                </span>
              </div>
            )}

            {userVoted ? (
              <div className="py-12 text-center space-y-4">
                <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <p className="text-xl font-black text-slate-800">Ви благодариме!</p>
                {!resultsVisible ? (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4">
                    <p className="text-amber-700 font-black">⏳ Чекај ги резултатите...</p>
                    <p className="text-amber-600 text-sm font-bold mt-1">Наставникот ќе ги открие наскоро.</p>
                  </div>
                ) : (
                  <p className="text-slate-500 font-bold">Вашиот одговор е успешно испратен.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {currentPoll.type === 'rating' ? (
                  <div className="flex justify-center gap-4 py-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => {
                          setRating(star);
                          submitRating(star);
                        }}
                        onMouseEnter={() => !userVoted && setRating(star)}
                        className="transition-transform active:scale-90"
                      >
                        <Star 
                          className={`w-12 h-12 ${
                            star <= rating 
                              ? 'fill-amber-400 text-amber-400' 
                              : 'text-slate-200'
                          } transition-colors`} 
                        />
                      </button>
                    ))}
                  </div>
                ) : isTextType ? (
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder={currentPoll.type === 'wordcloud' ? "Внесете збор..." : "Вашиот одговор..."}
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                      onKeyDown={(e) => e.key === 'Enter' && submitResponse()}
                    />
                    <button 
                      onClick={submitResponse}
                      disabled={!response.trim()}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                    >
                      Испрати
                    </button>
                  </div>
                ) : (
                  currentPoll.options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => handleVote(i)}
                      className="w-full group relative overflow-hidden p-6 rounded-3xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 active:scale-[0.98] transition-all text-left"
                    >
                      <div className="relative z-10 flex justify-between items-center font-bold">
                        <span className="text-slate-700">{option.text}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

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

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/80 backdrop-blur-xl p-3 rounded-[2rem] border border-slate-100 shadow-2xl z-50">
        {['❤️', '👍', '🔥', '👏', '😂', '😮'].map((emoji) => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            className="w-12 h-12 flex items-center justify-center text-2xl hover:bg-slate-50 rounded-full transition-all active:scale-75"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Participant;
