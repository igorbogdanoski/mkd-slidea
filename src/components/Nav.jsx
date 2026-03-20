import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, ChevronDown, PieChart, MessageSquare, Cloud, 
  ClipboardList, Trophy, LineChart, Presentation, Globe,
  Users, School, Briefcase, Calendar
} from 'lucide-react';

const MegaMenu = ({ isOpen, items }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute top-full left-0 w-[600px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 mt-2 grid grid-cols-2 gap-8 z-50"
      >
        {items.map((section, idx) => (
          <div key={idx}>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">
              {section.title}
            </h4>
            <div className="space-y-6">
              {section.links.map((link, lIdx) => (
                <div key={lIdx} className="flex gap-4 group cursor-pointer">
                  <div className={`p-2 rounded-xl ${link.bg} ${link.color} group-hover:scale-110 transition-transform`}>
                    {link.icon}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {link.label}
                    </p>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      {link.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);

const Nav = ({ setView }) => {
  const [activeMenu, setActiveMenu] = useState(null);

  const features = [
    {
      title: "Интеракција",
      links: [
        { label: "Анкети во живо", desc: "Добијте одговори веднаш", icon: <PieChart size={18} />, color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "Q&A во живо", desc: "Дајте им глас на сите", icon: <MessageSquare size={18} />, color: "text-violet-600", bg: "bg-violet-50" },
        { label: "Word Cloud", desc: "Визуелизирајте идеи", icon: <Cloud size={18} />, color: "text-pink-600", bg: "bg-pink-50" }
      ]
    },
    {
      title: "Оценување",
      links: [
        { label: "Квизови", desc: "Учење низ игра", icon: <Trophy size={18} />, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Аналитика", desc: "Детални извештаи", icon: <LineChart size={18} />, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Анкети", desc: "Длабоко истражување", icon: <ClipboardList size={18} />, color: "text-blue-600", bg: "bg-blue-50" }
      ]
    }
  ];

  const solutions = [
    {
      title: "Корпоративни",
      links: [
        { label: "Состаноци", desc: "Попродуктивни тимови", icon: <Briefcase size={18} />, color: "text-slate-600", bg: "bg-slate-50" },
        { label: "Обуки", desc: "Развој на вработени", icon: <Users size={18} />, color: "text-slate-600", bg: "bg-slate-50" }
      ]
    },
    {
      title: "Едукација",
      links: [
        { label: "Предавања", desc: "Интерактивни часови", icon: <School size={18} />, color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "Настани", desc: "Вебинари и семинари", icon: <Calendar size={18} />, color: "text-indigo-600", bg: "bg-indigo-50" }
      ]
    }
  ];

  return (
    <nav className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => { setView('landing'); setActiveMenu(null); }}
          >
            <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-200">
              <Zap className="text-white w-6 h-6 fill-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              MKD <span className="text-indigo-600">Slidea</span>
            </span>
          </div>
          
          <div className="hidden lg:flex items-center gap-2">
            <div className="relative" onMouseEnter={() => setActiveMenu('features')} onMouseLeave={() => setActiveMenu(null)}>
              <button className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 transition-colors ${activeMenu === 'features' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}>
                Производ <ChevronDown size={14} className={`transition-transform duration-300 ${activeMenu === 'features' ? 'rotate-180' : ''}`} />
              </button>
              <MegaMenu isOpen={activeMenu === 'features'} items={features} />
            </div>

            <div className="relative" onMouseEnter={() => setActiveMenu('solutions')} onMouseLeave={() => setActiveMenu(null)}>
              <button className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 transition-colors ${activeMenu === 'solutions' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}>
                Решенија <ChevronDown size={14} className={`transition-transform duration-300 ${activeMenu === 'solutions' ? 'rotate-180' : ''}`} />
              </button>
              <MegaMenu isOpen={activeMenu === 'solutions'} items={solutions} />
            </div>

            <button className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors">Цени</button>
            <button className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors">Ресурси</button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('join')}
            className="text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors px-4 py-2"
          >
            Приклучи се
          </button>
          <button 
            onClick={() => setView('host')}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            Креирај настан
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
