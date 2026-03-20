import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Sparkles, Clock, ChevronRight, 
  Presentation, Bell, Zap, MoreVertical
} from 'lucide-react';

const HomeTab = ({ setView, setActiveTab }) => {
  const recentPresentations = [
    { id: 1, title: 'AI Navigator & Gemini Mastery', date: 'Пред 2 часа', slides: 5, color: 'bg-indigo-600', code: '123456' },
    { id: 2, title: 'Дигитална трансформација на часот', date: 'Пред 2 дена', slides: 7, color: 'bg-emerald-600', code: '654321' },
  ];

  const popularTemplates = [
    { title: 'Technology In The Classroom', category: 'Classroom Activity', color: 'bg-blue-500', img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=400&h=250&auto=format&fit=crop' },
    { title: 'Visual Communication', category: 'Presentation Ideas', color: 'bg-pink-500', img: 'https://images.unsplash.com/photo-1558403194-611308249627?q=80&w=400&h=250&auto=format&fit=crop' },
    { title: 'Situational Leadership', category: 'Interactive Ideas', color: 'bg-amber-500', img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=400&h=250&auto=format&fit=crop' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-12 max-w-7xl mx-auto"
    >
      {/* Header Section */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Добредојде, Игор Богданоски</h1>
          <p className="text-slate-400 font-bold flex items-center gap-2">
            <Zap size={16} className="text-amber-500" /> Управувај со твоите интерактивни презентации © 2026.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
            <Bell size={20} />
          </button>
          <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-2xl border border-slate-100 shadow-sm">
             <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-100">
               ИБ
             </div>
             <div className="flex flex-col">
               <span className="font-black text-sm text-slate-900">Игор Б.</span>
               <span className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">Administrator</span>
             </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-6 mb-16">
        <button 
          onClick={() => setView('host')}
          className="flex items-center gap-4 px-10 py-6 bg-slate-900 text-white rounded-3xl font-black text-xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95 group"
        >
          <Plus size={28} className="group-hover:rotate-90 transition-transform" /> Нова презентација
        </button>
        <button className="flex items-center gap-4 px-10 py-6 bg-white border-2 border-slate-100 text-slate-900 rounded-3xl font-black text-xl hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm active:scale-95 group">
          <Sparkles size={28} className="text-indigo-600 group-hover:scale-110 transition-transform" /> Креирај со AI
        </button>
      </div>

      {/* Recent Presentations */}
      <section className="mb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <Clock size={24} className="text-indigo-600" /> Последни активности
          </h2>
          <button onClick={() => setActiveTab('presentations')} className="text-indigo-600 font-black text-sm hover:underline flex items-center gap-1 uppercase tracking-widest">
            Види ги сите <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recentPresentations.map((pres) => (
            <div key={pres.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group cursor-pointer hover:shadow-2xl hover:shadow-indigo-50 transition-all hover:-translate-y-1">
              <div className={`h-48 ${pres.color} p-8 flex items-end relative`}>
                 <div className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
                    <MoreVertical size={24} />
                 </div>
                 <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                   <Presentation size={32} className="text-white" />
                 </div>
                 <div className="absolute bottom-6 right-6 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30 text-white font-black text-xs">
                    #{pres.code}
                 </div>
              </div>
              <div className="p-8">
                <h3 className="font-black text-xl text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{pres.title}</h3>
                <div className="flex items-center justify-between text-slate-400 text-xs font-black uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Presentation size={14} /> {pres.slides} слајдови</span>
                  <span>{pres.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Templates */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black flex items-center gap-3">
             🎨 Популарни шаблони
          </h2>
          <button onClick={() => setActiveTab('templates')} className="text-indigo-600 font-black text-sm hover:underline flex items-center gap-1 uppercase tracking-widest">
            Разгледај сè <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {popularTemplates.map((template, idx) => (
            <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group cursor-pointer hover:shadow-2xl hover:shadow-indigo-50 transition-all">
              <div className="h-56 relative overflow-hidden">
                <img src={template.img} alt={template.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/30">
                    {template.category}
                  </span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="font-black text-lg text-slate-900 mb-4">{template.title}</h3>
                <button className="w-full py-3 bg-slate-50 text-slate-900 rounded-xl font-black text-sm hover:bg-indigo-600 hover:text-white transition-all">
                  Користи го овој шаблон
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default HomeTab;
