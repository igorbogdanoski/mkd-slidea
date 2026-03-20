import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Settings, Users, PieChart, MessageSquare, Plus, ThumbsUp, QrCode, MonitorPlay } from 'lucide-react';
import QRCodeModal from '../components/QRCodeModal';
import CreatePollModal from '../components/CreatePollModal';
import CreateQuizModal from '../components/CreateQuizModal';

const Host = ({ polls, questions, setView, onAddPoll, activePollIndex, setActivePollIndex }) => {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false);
  const eventCode = "982341";

  const openPresenter = () => {
    window.open(`/event/${eventCode}/present`, '_blank');
  };

  return (
    <motion.div
      key="host"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="max-w-7xl mx-auto px-6 pt-12 pb-24"
    >
      <QRCodeModal 
        isOpen={isQRModalOpen} 
        onClose={() => setIsQRModalOpen(false)} 
        eventCode={eventCode} 
      />

      <CreatePollModal 
        isOpen={isCreatePollOpen} 
        onClose={() => setIsCreatePollOpen(false)} 
        onSave={onAddPoll} 
      />

      <CreateQuizModal 
        isOpen={isCreateQuizOpen} 
        onClose={() => setIsCreateQuizOpen(false)} 
        onSave={onAddPoll} 
      />

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
          <button 
            onClick={() => setIsQRModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl font-mono font-bold text-slate-600 text-lg transition-all group"
          >
            <QrCode className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            #{eventCode}
          </button>
          <button 
            onClick={openPresenter}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl font-bold text-sm transition-all"
          >
            <MonitorPlay className="w-4 h-4" /> Презентација
          </button>
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
                <h3 className="text-xl font-black">Сите активности</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsCreatePollOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Анкета
                  </button>
                  <button 
                    onClick={() => setIsCreateQuizOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-bold text-sm hover:bg-amber-100 transition-all"
                  >
                    <Trophy className="w-4 h-4" /> Квиз
                  </button>
                </div>
              </div>

              <div className="space-y-4 mb-12">
                {polls.map((poll, index) => (
                  <div 
                    key={poll.id}
                    onClick={() => setActivePollIndex(index)}
                    className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${
                      activePollIndex === index 
                        ? 'border-indigo-600 bg-indigo-50/50' 
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        activePollIndex === index 
                          ? 'bg-indigo-600 text-white' 
                          : poll.is_quiz ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {activePollIndex === index ? 'Активна' : poll.is_quiz ? 'КВИЗ' : 'АНКЕТА'}
                      </span>
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                        <Users className="w-3 h-3" />
                        {poll.options.reduce((a, b) => a + b.votes, 0)} гласови
                      </div>
                    </div>
                    <p className="font-bold text-slate-800">{poll.question}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-xl font-black mb-6">Резултати во живо</h3>
              <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-xl font-bold text-slate-800 mb-8">{polls[activePollIndex].question}</p>
                <div className="space-y-6">
                  {polls[activePollIndex].options.map((option, i) => {
                    const totalVotes = polls[activePollIndex].options.reduce((a, b) => a + b.votes, 0);
                    const percentage = Math.round((option.votes / totalVotes) * 100) || 0;
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
  );
};

export default Host;
