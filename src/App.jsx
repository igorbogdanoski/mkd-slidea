import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, BarChart3, Users, Zap, Hash, ArrowRight, 
  Settings, LogOut, Plus, Send, ThumbsUp, PieChart, Globe,
  Presentation, School, MonitorPlay
} from 'lucide-react';

const App = () => {
  const [view, setView] = useState('landing'); // landing, join, host, participant
  const [code, setCode] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  
  // Mock Data
  const [polls, setPolls] = useState([
    { id: 1, question: "Како се чувствувате во врска со новата технологија?", options: [
      { text: "Возбудено", votes: 15 },
      { text: "Загрижено", votes: 5 },
      { text: "Неутрално", votes: 10 }
    ], active: true }
  ]);

  const [questions, setQuestions] = useState([
    { id: 1, text: "Кога ќе биде достапна мобилната верзија?", votes: 12, author: "Ана" },
    { id: 2, text: "Дали можеме да додаваме слики во анкетите?", votes: 8, author: "Марко" },
    { id: 3, text: "Како се гарантира приватноста?", votes: 5, author: "Петар" }
  ]);

  const [activePollIndex, setActivePollIndex] = useState(0);
  const [userVoted, setUserVoted] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");

  const handleVote = (optionIndex) => {
    if (userVoted) return;
    const updatedPolls = [...polls];
    updatedPolls[activePollIndex].options[optionIndex].votes += 1;
    setPolls(updatedPolls);
    setUserVoted(true);
    // Add confetti for "world-class" feel if it was a quiz, but here just a feedback
    if (window.confetti) {
      window.confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4F46E5', '#7C3AED', '#C026D3']
      });
    }
  };

  const handleUpvote = (id) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, votes: q.votes + 1 } : q
    ).sort((a, b) => b.votes - a.votes));
  };

  const submitQuestion = () => {
    if (!newQuestion.trim()) return;
    const q = {
      id: questions.length + 1,
      text: newQuestion,
      votes: 0,
      author: "Гостин"
    };
    setQuestions([q, ...questions]);
    setNewQuestion("");
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (code.length === 6) {
      setIsJoined(true);
      setView('participant');
    }
  };

  const Nav = () => (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => setView('landing')}
        >
          <div className="bg-indigo-600 p-1.5 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-200">
            <Zap className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tight">MKD <span className="text-indigo-600">Slidea</span></span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">Производ</a>
          <a href="#" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">Цени</a>
          <a href="#" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">Ресурси</a>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('join')}
            className="text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors"
          >
            Приклучи се
          </button>
          <button 
            onClick={() => setView('host')}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
          >
            Креирај настан
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      <Nav />
      
      <main className="pt-16">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative overflow-hidden"
            >
              {/* Promo Join Bar */}
              <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 py-4 shadow-lg">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-4 text-white">
                  <span className="font-bold text-lg">Се приклучувате како учесник?</span>
                  <div className="flex bg-white/20 p-1 rounded-2xl backdrop-blur-md border border-white/30 w-full md:w-auto">
                    <input 
                      type="text" 
                      placeholder="Внеси го кодот" 
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="bg-transparent px-4 py-2 outline-none placeholder:text-white/70 font-bold w-full md:w-40"
                    />
                    <button 
                      onClick={() => view !== 'join' && setView('join')}
                      className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-black hover:bg-indigo-50 transition-colors"
                    >
                      Влези
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Hero */}
              <div className="max-w-7xl mx-auto px-6 pt-20 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="text-left">
                  <motion.h1 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-6xl md:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-[1.1]"
                  >
                    Слајдови кои <span className="text-indigo-600">слушаат</span>,<br />
                    Идеи кои <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600">водат.</span>
                  </motion.h1>
                  <p className="text-xl text-slate-500 mb-10 max-w-xl leading-relaxed">
                    Направете ги вашите презентации двонасочна улица. Најдобрата македонска платформа за квизови, анкети и моќна интеракција во живо.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                      <div className="bg-indigo-50 p-3 rounded-2xl w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Plus className="w-6 h-6" />
                      </div>
                      <h3 className="font-black mb-2">Готови шаблони</h3>
                      <p className="text-sm text-slate-400 font-medium">Пронајдете го вашиот совршен дизајн веднаш.</p>
                      <button className="mt-4 text-indigo-600 font-bold text-sm flex items-center gap-1">Земи бесплатно <ArrowRight className="w-4 h-4" /></button>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                      <div className="bg-violet-50 p-3 rounded-2xl w-fit mb-4 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                        <Zap className="w-6 h-6" />
                      </div>
                      <h3 className="font-black mb-2">AI Креирање</h3>
                      <p className="text-sm text-slate-400 font-medium">Инстант слајдови со помош на вештачка интелигенција.</p>
                      <button className="mt-4 text-violet-600 font-bold text-sm flex items-center gap-1">Креирај со AI <ArrowRight className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                      Започни сега
                    </button>
                    <button className="bg-white text-slate-700 px-8 py-4 rounded-2xl font-black text-lg border-2 border-slate-100 hover:border-indigo-600 transition-all">
                      Погледни демо
                    </button>
                  </div>
                </div>

                <div className="relative hidden lg:block">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 bg-white p-4 rounded-[3rem] shadow-2xl border border-slate-100"
                  >
                    <div className="bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 p-8">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                          <Users className="w-5 h-5" />
                        </div>
                        <span className="font-black text-slate-400">ПРАШАЊЕ ВО ЖИВО</span>
                      </div>
                      <h2 className="text-3xl font-black text-slate-800 mb-10 leading-snug">Кој е главниот град на Македонија?</h2>
                      <div className="space-y-4">
                        <div className="p-5 bg-white rounded-2xl border-2 border-indigo-600 shadow-lg shadow-indigo-100 font-black text-indigo-600 flex justify-between items-center">
                          Скопје
                          <div className="w-3 h-3 bg-indigo-600 rounded-full animate-ping"></div>
                        </div>
                        <div className="p-5 bg-white rounded-2xl border-2 border-slate-100 font-bold text-slate-400">Битола</div>
                        <div className="p-5 bg-white rounded-2xl border-2 border-slate-100 font-bold text-slate-400">Охрид</div>
                      </div>
                    </div>
                  </motion.div>
                  {/* Decorative blobs */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-100/50 rounded-full blur-3xl -z-10"></div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-100/50 rounded-full blur-2xl -z-10"></div>
                </div>
              </div>

              {/* Integrations Section */}
              <div className="bg-white py-24 border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-6 text-center">
                  <h2 className="text-3xl font-black mb-4 text-slate-900">Интегрирајте беспрекорно</h2>
                  <p className="text-slate-500 mb-16 max-w-2xl mx-auto font-medium">
                    Спречете го постојаното менување апликации. MKD Slidea работи таму каде што се вашите состаноци.
                  </p>
                  <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-sm border border-red-100">
                        <Presentation className="w-8 h-8" />
                      </div>
                      <span className="font-bold text-xs text-slate-400">PowerPoint</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                        <Globe className="w-8 h-8" />
                      </div>
                      <span className="font-bold text-xs text-slate-400">Google Slides</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                        <MonitorPlay className="w-8 h-8" />
                      </div>
                      <span className="font-bold text-xs text-slate-400">Teams / Zoom</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'join' && (
            <motion.div
              key="join"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-lg mx-auto px-6 pt-32 text-center"
            >
              <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 relative overflow-hidden">
                {/* Decorative element */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-violet-600"></div>
                
                <h2 className="text-3xl font-black mb-2">Приклучи се</h2>
                <p className="text-slate-500 mb-8">Внеси го кодот за да започнеш со интеракција</p>
                
                <form onSubmit={handleJoin} className="space-y-6">
                  <div className="relative group">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-3xl transition-colors group-focus-within:text-indigo-600">#</span>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full pl-14 pr-6 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-4xl font-black tracking-[0.4em] focus:border-indigo-600 focus:bg-white focus:outline-none transition-all text-center uppercase placeholder:text-slate-200"
                    />
                  </div>
                  <button
                    disabled={code.length !== 6}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-200 active:scale-[0.98]"
                  >
                    Влези <ArrowRight className="w-6 h-6" />
                  </button>
                </form>
              </div>
              
              <button 
                onClick={() => setView('landing')}
                className="mt-8 text-slate-400 font-bold hover:text-indigo-600 transition-colors"
              >
                Откажи и врати се назад
              </button>
            </motion.div>
          )}

          {view === 'participant' && (
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
                    <Zap className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Во живо</p>
                    <p className="font-black text-slate-900">#{code}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setView('landing'); setCode(''); }}
                  className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Active Poll */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                      <PieChart className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-xl">Анкета</h3>
                  </div>
                  <p className="text-lg text-slate-700 mb-8 font-medium">{polls[activePollIndex].question}</p>
                  <div className="grid gap-3">
                    {polls[activePollIndex].options.map((option, idx) => (
                      <button
                        key={option.text}
                        disabled={userVoted}
                        className={`w-full py-4 px-6 text-left border-2 rounded-2xl transition-all font-bold flex justify-between items-center group ${
                          userVoted 
                          ? 'bg-slate-50 border-slate-100 text-slate-400 opacity-80' 
                          : 'border-slate-50 bg-slate-50/50 hover:border-indigo-600 hover:bg-white hover:shadow-lg hover:shadow-indigo-50 text-slate-600 hover:text-indigo-600'
                        }`}
                        onClick={() => handleVote(idx)}
                      >
                        {option.text}
                        {!userVoted && <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        {userVoted && (
                          <span className="text-indigo-600 text-sm">
                            {Math.round((option.votes / polls[activePollIndex].options.reduce((a, b) => a + b.votes, 0)) * 100)}%
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {userVoted && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center mt-6 text-emerald-600 font-bold text-sm"
                    >
                      ✓ Ви благодариме за гласот!
                    </motion.p>
                  )}
                </div>

                {/* Q&A Section */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-xl">Постави прашање</h3>
                  </div>
                  <div className="relative">
                    <textarea
                      placeholder="Што ве интересира?"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-3xl focus:border-indigo-600 focus:bg-white focus:outline-none transition-all h-40 resize-none font-medium text-slate-700"
                    />
                    <button 
                      onClick={submitQuestion}
                      className="absolute bottom-4 right-4 p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-90"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Participant Q&A Feed */}
                  <div className="mt-8 space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {questions.map((q) => (
                      <div key={q.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">{q.text}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{q.author}</p>
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
          )}

          {view === 'host' && (
            <motion.div
              key="host"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-7xl mx-auto px-6 pt-12 pb-24"
            >
              {/* Host Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100">
                    <Zap className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">Контролна табла</h2>
                    <p className="text-slate-400 text-sm font-bold">Управувајте со вашиот настан во живо</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="px-4 py-2 bg-slate-50 rounded-xl font-mono font-bold text-indigo-600 text-lg">
                    #982341
                  </div>
                  <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                    <Settings className="w-5 h-5" />
                  </button>
                  <div className="h-6 w-px bg-slate-100"></div>
                  <button 
                    onClick={() => setView('landing')}
                    className="flex items-center gap-2 px-4 py-2 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-all text-sm"
                  >
                    Затвори
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                      { label: "Учесници", value: "24", icon: <Users />, color: "text-blue-600", bg: "bg-blue-50" },
                      { label: "Одговори", value: "86", icon: <PieChart />, color: "text-amber-600", bg: "bg-amber-50" },
                      { label: "Прашања", value: "12", icon: <MessageSquare />, color: "text-emerald-600", bg: "bg-emerald-50" },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className={`p-3 ${stat.bg} ${stat.color} rounded-2xl w-fit mb-4`}>
                          {stat.icon}
                        </div>
                        <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Active Content Tabs */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex border-b border-slate-50">
                      <button className="px-8 py-5 font-black text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30">Анкети</button>
                      <button className="px-8 py-5 font-bold text-slate-400 hover:text-slate-600 transition-colors">Прашања</button>
                      <button className="px-8 py-5 font-bold text-slate-400 hover:text-slate-600 transition-colors">Подесувања</button>
                    </div>
                    
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black">Активна анкета</h3>
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                          <Plus className="w-4 h-4" /> Нова анкета
                        </button>
                      </div>

                      <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                        <p className="text-xl font-bold text-slate-800 mb-8">{polls[0].question}</p>
                        <div className="space-y-6">
                          {polls[0].options.map((option, i) => {
                            const totalVotes = polls[0].options.reduce((a, b) => a + b.votes, 0);
                            const percentage = Math.round((option.votes / totalVotes) * 100);
                            return (
                              <div key={i} className="space-y-2">
                                <div className="flex justify-between font-bold text-sm">
                                  <span>{option.text}</span>
                                  <span className="text-indigo-600">{percentage}%</span>
                                </div>
                                <div className="h-4 w-full bg-white rounded-full overflow-hidden border border-slate-200 p-0.5">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-indigo-600 rounded-full"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200">
                    <h3 className="text-xl font-black mb-6">Q&A во живо</h3>
                    <div className="space-y-4">
                      {questions.map((q) => (
                        <div key={q.id} className="p-5 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/5 group hover:bg-white/15 transition-all">
                          <div className="flex justify-between items-start gap-4 mb-3">
                            <p className="font-medium text-slate-200 text-sm">{q.text}</p>
                            <button className="flex items-center gap-1.5 font-bold text-xs text-indigo-400 group-hover:text-indigo-300 transition-colors">
                              <ThumbsUp className="w-3.5 h-3.5" /> {q.votes}
                            </button>
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{q.author}</p>
                        </div>
                      ))}
                    </div>
                    <button className="w-full mt-6 py-4 bg-white/10 text-white rounded-2xl font-bold text-sm hover:bg-white/20 transition-all border border-white/10">
                      Види ги сите прашања
                    </button>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="font-black mb-4">Брзи контроли</h3>
                    <div className="grid gap-3">
                      <button className="w-full py-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold text-sm hover:bg-emerald-100 transition-all text-left px-6 border border-emerald-100">
                        Овозможи Q&A
                      </button>
                      <button className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-bold text-sm transition-all text-left px-6 border border-slate-100 cursor-not-allowed">
                        Архивирај настан
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <footer className="py-12 text-center text-slate-400 text-sm font-medium border-t border-slate-100 mt-20">
        <div className="flex items-center justify-center gap-6 mb-4">
          <a href="#" className="hover:text-indigo-600 transition-colors">Политика на приватност</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Услови за користење</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Контакт</a>
        </div>
        <p>© 2024 MKD Slidea. Со гордост направено во 🇲🇰</p>
      </footer>
    </div>
  );
};

export default App;
