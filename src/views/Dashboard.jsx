import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, Presentation, LayoutGrid, Users, 
  CreditCard, Share2, Trash2, Plus, 
  Sparkles, Search, MoreVertical, Clock,
  ChevronRight, Bell
} from 'lucide-react';

const Dashboard = ({ setView }) => {
  const [activeTab, setActiveTab] = useState('home');

  const menuItems = [
    { id: 'home', label: 'Почетна', icon: <Home size={20} /> },
    { id: 'presentations', label: 'Мои презентации', icon: <Presentation size={20} /> },
    { id: 'templates', label: 'Сите шаблони', icon: <LayoutGrid size={20} /> },
    { id: 'team', label: 'Креирај тим', icon: <Users size={20} /> },
    { id: 'plan', label: 'Мој план', icon: <CreditCard size={20} /> },
    { id: 'integrations', label: 'Интеграции', icon: <Share2 size={20} /> },
    { id: 'trash', label: 'Корпа', icon: <Trash2 size={20} /> },
  ];

  const recentPresentations = [
    { id: 1, title: 'AI Navigator & Gemini Mastery', date: 'Edited Mar 13, 2026', slides: 5, color: 'bg-indigo-600' },
    { id: 2, title: 'Дигитална трансформација на часот', date: 'Edited Feb 21, 2026', slides: 7, color: 'bg-emerald-600' },
  ];

  const popularTemplates = [
    { title: 'Technology In The Classroom', category: 'Classroom Activity', color: 'bg-blue-500' },
    { title: 'Visual Communication', category: 'Presentation Ideas', color: 'bg-pink-500' },
    { title: 'Situational Leadership', category: 'Interactive Ideas', color: 'bg-amber-500' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col pt-24 px-4 pb-8 fixed h-full z-40">
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 pt-24 px-10 pb-20">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Добредојде, Игор Богданоски</h1>
            <p className="text-slate-400 font-bold">Управувај со твоите интерактивни презентации © 2026.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
              <Bell size={20} />
            </button>
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center font-black text-indigo-600 border border-indigo-200">
              ИБ
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-16">
          <button 
            onClick={() => setView('host')}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
          >
            <Plus size={24} /> Нова презентација
          </button>
          <button className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black text-lg hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm">
            <Sparkles size={24} className="text-indigo-600" /> Креирај со AI
          </button>
        </div>

        {/* Recent Presentations */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black flex items-center gap-2">
              <Clock size={20} className="text-indigo-600" /> Последни презентации
            </h2>
            <button className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1">
              Види ги сите <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentPresentations.map((pres) => (
              <div key={pres.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group cursor-pointer hover:shadow-xl hover:shadow-indigo-50 transition-all">
                <div className={`h-40 ${pres.color} p-6 flex items-end relative`}>
                   <div className="absolute top-4 right-4 text-white/50">
                      <MoreVertical size={20} />
                   </div>
                   <Presentation size={48} className="text-white/20 absolute bottom-4 right-4" />
                </div>
                <div className="p-6">
                  <h3 className="font-black text-lg text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{pres.title}</h3>
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <span>{pres.slides} слајдови</span>
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
            <h2 className="text-xl font-black flex items-center gap-2">
              <LayoutGrid size={20} className="text-indigo-600" /> Популарни шаблони
            </h2>
            <button className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1">
              Види ги сите <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {popularTemplates.map((temp, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all flex items-center gap-4 group cursor-pointer">
                <div className={`w-16 h-16 ${temp.color} rounded-2xl flex items-center justify-center text-white`}>
                   <LayoutGrid size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{temp.title}</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{temp.category}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
