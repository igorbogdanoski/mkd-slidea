import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, ChevronDown, PieChart, MessageSquare, Cloud, 
  ClipboardList, Trophy, LineChart, Presentation, Globe,
  Users, School, Briefcase, Calendar, LayoutGrid, LogIn
} from 'lucide-react';
import LoginModal from './LoginModal';

const MegaMenu = ({ isOpen, items, setView, setActiveMenu }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute top-full -left-10 w-[700px] pt-4 z-50"
      >
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10 grid grid-cols-2 gap-10">
          {items.map((section, idx) => (
            <div key={idx}>
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-8 border-b border-slate-50 pb-4">
                {section.title}
              </h4>
              <div className="space-y-8">
                {section.links.map((link, lIdx) => (
                  <div 
                    key={lIdx} 
                    className="flex gap-6 group cursor-pointer"
                    onClick={() => {
                      if (link.type) setView('host', link.type);
                      setActiveMenu(null);
                    }}
                  >
                    <div className={`w-12 h-12 rounded-2xl ${link.bg} ${link.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-slate-50`}>
                      {link.icon}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                        {link.label}
                      </p>
                      <p className="text-xs text-slate-400 font-bold leading-relaxed">
                        {link.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Nav = ({ setView, onLogin, user, onLogout }) => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const features = [
    {
      title: "Интеракција",
      links: [
        { label: "Анкети во живо", desc: "Добијте одговори веднаш", icon: <PieChart size={18} />, color: "text-indigo-600", bg: "bg-indigo-50", type: "poll" },
        { label: "Q&A во живо", desc: "Дајте им глас на сите", icon: <MessageSquare size={18} />, color: "text-violet-600", bg: "bg-violet-50", type: "open" },
        { label: "Word Cloud", desc: "Визуелизирајте идеи", icon: <Cloud size={18} />, color: "text-pink-600", bg: "bg-pink-50", type: "wordcloud" }
      ]
    },
    {
      title: "Оценување",
      links: [
        { label: "Квизови", desc: "Учење низ игра", icon: <Trophy size={18} />, color: "text-amber-600", bg: "bg-amber-50", type: "quiz" },
        { label: "Аналитика", desc: "Детални извештаи", icon: <LineChart size={18} />, color: "text-emerald-600", bg: "bg-emerald-50", type: "analytics" },
        { label: "Анкети", desc: "Длабоко истражување", icon: <ClipboardList size={18} />, color: "text-blue-600", bg: "bg-blue-50", type: "survey" }
      ]
    }
  ];

  const solutions = [
    {
      title: "Корпоративни",
      links: [
        { label: "Бизнис состаноци", desc: "Попродуктивни тимови", icon: <Briefcase size={18} />, color: "text-slate-600", bg: "bg-slate-50" },
        { label: "Хибридна работа", desc: "Поврзете ги сите", icon: <Globe size={18} />, color: "text-slate-600", bg: "bg-slate-50" },
        { label: "Обуки", desc: "Развој на вработени", icon: <Users size={18} />, color: "text-slate-600", bg: "bg-slate-50" }
      ]
    },
    {
      title: "Едукација",
      links: [
        { label: "Предавања", desc: "Интерактивни часови", icon: <School size={18} />, color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "Вебинари", desc: "Настани во живо", icon: <Presentation size={18} />, color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "Училници", desc: "K-12 и Универзитети", icon: <Calendar size={18} />, color: "text-indigo-600", bg: "bg-indigo-50" }
      ]
    }
  ];

  const resources = [
    {
      title: "Учи",
      links: [
        { label: "Блог", desc: "Најнови вести", icon: <Presentation size={18} />, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Студии на случај", desc: "Примери од пракса", icon: <ClipboardList size={18} />, color: "text-emerald-600", bg: "bg-emerald-50" }
      ]
    },
    {
      title: "Академија",
      links: [
        { label: "Упатства", desc: "Како да започнете", icon: <Globe size={18} />, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Чести прашања", desc: "Помош и поддршка", icon: <MessageSquare size={18} />, color: "text-blue-600", bg: "bg-blue-50" }
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
              <MegaMenu isOpen={activeMenu === 'features'} items={features} setView={setView} setActiveMenu={setActiveMenu} />
            </div>

            <div className="relative" onMouseEnter={() => setActiveMenu('solutions')} onMouseLeave={() => setActiveMenu(null)}>
              <button className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 transition-colors ${activeMenu === 'solutions' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}>
                Решенија <ChevronDown size={14} className={`transition-transform duration-300 ${activeMenu === 'solutions' ? 'rotate-180' : ''}`} />
              </button>
              <MegaMenu isOpen={activeMenu === 'solutions'} items={solutions} setView={setView} setActiveMenu={setActiveMenu} />
            </div>

            <button 
              onClick={() => setView('pricing')}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            >
              Цени
            </button>
            
            <div className="relative" onMouseEnter={() => setActiveMenu('resources')} onMouseLeave={() => setActiveMenu(null)}>
              <button className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 transition-colors ${activeMenu === 'resources' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}>
                Ресурси <ChevronDown size={14} className={`transition-transform duration-300 ${activeMenu === 'resources' ? 'rotate-180' : ''}`} />
              </button>
              <MegaMenu isOpen={activeMenu === 'resources'} items={resources} setView={setView} setActiveMenu={setActiveMenu} />
            </div>

            <button 
              onClick={() => setView('dashboard')}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            >
              Шаблони
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('join')}
            className="text-sm font-black text-slate-500 hover:text-indigo-600 transition-all px-4 py-2 uppercase tracking-widest"
          >
            Приклучи се
          </button>
          <div className="w-px h-6 bg-slate-100 mx-2" />
          {user ? (
            <div className="flex items-center gap-4">
              {user.role === 'admin' && (
                <button 
                  onClick={() => setView('dashboard')}
                  className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <LayoutGrid size={14} /> Админ Панел
                </button>
              )}
              <button 
                onClick={() => setView('dashboard')}
                className="text-sm font-black text-slate-900 hover:text-indigo-600"
              >
                Мој Профил
              </button>
              <button 
                onClick={onLogout}
                className="text-sm font-black text-red-500 hover:text-red-600"
              >
                Одјави се
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="text-sm font-black text-slate-900 hover:text-indigo-600 transition-all px-6 py-2"
              >
                Најави се
              </button>
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center gap-2"
              >
                Регистрирај се
              </button>
            </>
          )}
        </div>
      </div>
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLogin={onLogin} 
      />
    </nav>
  );
};

export default Nav;
