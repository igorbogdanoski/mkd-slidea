import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Sparkles, Clock, ChevronRight,
  Presentation, Bell, Zap, MoreVertical, LayoutGrid
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { templates } from '../../data/templates';

const cardColors = [
  'bg-indigo-600', 'bg-violet-600', 'bg-emerald-600',
  'bg-amber-500', 'bg-rose-600', 'bg-cyan-600',
];

const formatDate = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Пред момент';
  if (m < 60) return `Пред ${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Пред ${h} ${h === 1 ? 'час' : 'часа'}`;
  const d = Math.floor(h / 24);
  return `Пред ${d} ${d === 1 ? 'ден' : 'дена'}`;
};

const HomeTab = ({ setView, setActiveTab, user, useTemplate }) => {
  const userName = user?.name || 'Наставник';
  const userInitials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const userRole = user?.role === 'admin' ? 'Администратор' : 'Наставник';

  const [recentEvents, setRecentEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('events')
        .select('id, code, title, created_at')
        .order('created_at', { ascending: false })
        .limit(6);
      setRecentEvents(data || []);
      setLoadingEvents(false);
    };
    load();
  }, []);

  const featuredTemplates = templates.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-12 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Добредојде, {userName} 👋</h1>
          <p className="text-slate-400 font-bold flex items-center gap-2">
            <Zap size={16} className="text-amber-500" /> Управувај со твоите интерактивни часови
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
            <Bell size={20} />
          </button>
          <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-100">
              {userInitials}
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm text-slate-900">{userName}</span>
              <span className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">{userRole}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-6 mb-12">
        {[
          { label: 'Вкупно настани', value: recentEvents.length > 0 ? recentEvents.length + '+' : '—', icon: '📋' },
          { label: 'Шаблони', value: templates.length, icon: '🎨' },
          { label: 'Типови активности', value: '6', icon: '⚡' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
            <span className="text-4xl">{stat.icon}</span>
            <div>
              <p className="text-3xl font-black text-slate-900">{stat.value}</p>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-6 mb-16">
        <button
          onClick={() => setView('host')}
          className="flex items-center gap-4 px-10 py-6 bg-slate-900 text-white rounded-3xl font-black text-xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95 group"
        >
          <Plus size={28} className="group-hover:rotate-90 transition-transform" /> Нова презентација
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className="flex items-center gap-4 px-10 py-6 bg-white border-2 border-slate-100 text-slate-900 rounded-3xl font-black text-xl hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm active:scale-95 group"
        >
          <LayoutGrid size={28} className="text-indigo-600 group-hover:scale-110 transition-transform" /> Разгледај шаблони
        </button>
      </div>

      {/* Recent Events */}
      <section className="mb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <Clock size={24} className="text-indigo-600" /> Последни настани
          </h2>
          <button
            onClick={() => setActiveTab('presentations')}
            className="text-indigo-600 font-black text-sm hover:underline flex items-center gap-1 uppercase tracking-widest"
          >
            Види ги сите <ChevronRight size={18} />
          </button>
        </div>

        {loadingEvents ? (
          <div className="grid grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[2.5rem] border border-slate-100 h-64 animate-pulse" />
            ))}
          </div>
        ) : recentEvents.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 p-16 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-black text-slate-400 mb-2">Сè уште нема настани</h3>
            <p className="text-slate-300 font-bold mb-6">Креирај ја твојата прва интерактивна презентација</p>
            <button
              onClick={() => setView('host')}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              + Нова презентација
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentEvents.map((ev, idx) => (
              <div
                key={ev.id}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group cursor-pointer hover:shadow-2xl hover:shadow-indigo-50 transition-all hover:-translate-y-1"
                onClick={() => {
                  localStorage.setItem('active_event_code', ev.code);
                  setView('host');
                }}
              >
                <div className={`h-48 ${cardColors[idx % cardColors.length]} p-8 flex items-end relative`}>
                  <div className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
                    <MoreVertical size={24} />
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                    <Presentation size={32} className="text-white" />
                  </div>
                  <div className="absolute bottom-6 right-6 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30 text-white font-black text-xs">
                    #{ev.code}
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="font-black text-xl text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {ev.title || 'Без наслов'}
                  </h3>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest">
                    {formatDate(ev.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Templates */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black flex items-center gap-3">
            🎨 Препорачани шаблони
          </h2>
          <button
            onClick={() => setActiveTab('templates')}
            className="text-indigo-600 font-black text-sm hover:underline flex items-center gap-1 uppercase tracking-widest"
          >
            Разгледај сè <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group cursor-pointer hover:shadow-2xl hover:shadow-indigo-50 transition-all"
            >
              <div className="h-56 relative overflow-hidden">
                <img
                  src={template.img}
                  alt={template.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600">
                    {template.category}
                  </span>
                </div>
                <div className="absolute bottom-4 left-6">
                  <p className="text-white font-black text-xs opacity-70">
                    {template.polls.length} активности
                  </p>
                </div>
              </div>
              <div className="p-8">
                <h3 className="font-black text-lg text-slate-900 mb-4 line-clamp-1">{template.title}</h3>
                <button
                  onClick={() => useTemplate && useTemplate(template)}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
                >
                  Користи го шаблонот
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
