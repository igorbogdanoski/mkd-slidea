import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Dashboard/Sidebar';
import HomeTab from '../components/Dashboard/HomeTab';
import AnalyticsTab from '../components/Dashboard/AnalyticsTab';
import { templates } from '../data/templates';
import { supabase } from '../lib/supabase';

const Dashboard = ({ setView, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');

  const useTemplate = async (template) => {
    try {
      const eventCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert([{ 
          code: eventCode, 
          title: template.title,
          user_id: user?.id 
        }])
        .select()
        .single();

      if (eventError) throw eventError;

      for (const poll of template.polls) {
        const { data: newPoll, error: pollError } = await supabase
          .from('polls')
          .insert([{
            event_id: event.id,
            question: poll.question,
            type: poll.type,
            is_quiz: poll.is_quiz
          }])
          .select()
          .single();
        
        if (pollError) throw pollError;

        if (poll.options && poll.options.length > 0) {
          const optionsToInsert = poll.options.map(opt => ({
            poll_id: newPoll.id,
            text: typeof opt === 'string' ? opt : opt.text,
            is_correct: opt.is_correct || false
          }));
          await supabase.from('options').insert(optionsToInsert);
        } else if (poll.type === 'rating') {
          const ratings = ['1', '2', '3', '4', '5'].map(val => ({ poll_id: newPoll.id, text: val }));
          await supabase.from('options').insert(ratings);
        }
      }

      localStorage.setItem('active_event_code', eventCode);
      setView('host');
    } catch (err) {
      console.error("Error using template:", err);
      alert("Грешка при креирање на настанот од шаблонот.");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab setView={setView} setActiveTab={setActiveTab} user={user} />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'presentations':
        const recentPresentations = [
          { id: 1, title: 'AI Navigator & Gemini Mastery', date: 'Пред 2 часа', slides: 5, color: 'bg-indigo-600', code: '123456' },
          { id: 2, title: 'Дигитална трансформација на часот', date: 'Пред 2 дена', slides: 7, color: 'bg-emerald-600', code: '654321' },
          { id: 3, title: 'Реакции на часот по математика', date: 'Пред 5 дена', slides: 12, color: 'bg-violet-600', code: 'MAT101' },
        ];
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-12"
          >
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Мои презентации</h2>
                <p className="text-slate-400 font-bold italic tracking-wide">Сите ваши претходни активности на едно место.</p>
              </div>
              <button 
                onClick={() => setView('host')}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                + Нова презентација
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentPresentations.map((pres) => (
                <div key={pres.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group cursor-pointer hover:shadow-2xl hover:shadow-indigo-50 transition-all hover:-translate-y-1">
                  <div className={`h-48 ${pres.color} p-8 flex items-end relative`}>
                     <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                       <span className="text-3xl text-white">📊</span>
                     </div>
                     <div className="absolute bottom-6 right-6 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30 text-white font-black text-xs">
                        #{pres.code}
                     </div>
                  </div>
                  <div className="p-8">
                    <h3 className="font-black text-xl text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{pres.title}</h3>
                    <div className="flex items-center justify-between text-slate-400 text-xs font-black uppercase tracking-widest">
                      <span>{pres.slides} активности</span>
                      <span>{pres.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      case 'templates':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-12"
          >
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Сите шаблони</h2>
                <p className="text-slate-400 font-bold">Започнете брзо со еден од нашите претходно дизајнирани шаблони.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
               {templates.map((temp) => (
                 <div key={temp.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group cursor-pointer hover:shadow-2xl hover:shadow-indigo-50 transition-all">
                    <div className="h-48 relative overflow-hidden">
                      <img src={temp.img} alt={temp.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600">
                          {temp.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-8">
                      <h4 className="font-black text-slate-900 mb-6 line-clamp-2">{temp.title}</h4>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => useTemplate(temp)}
                          className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all active:scale-95"
                        >
                          Користи
                        </button>
                        <button className="flex-1 py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-xs hover:bg-slate-100 transition-all">Преглед</button>
                      </div>
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>
        );
      case 'plan':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-12 max-w-5xl mx-auto"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Мој План</h2>
            <div className="bg-white rounded-[3rem] border-2 border-slate-100 p-12 relative overflow-hidden mb-12 shadow-sm">
               <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                 <div>
                   <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">Активен План</span>
                   <h3 className="text-4xl font-black text-slate-900 mb-2">Бесплатен</h3>
                   <p className="text-slate-400 font-bold">Вашиот план е секогаш бесплатен за наставници.</p>
                 </div>
                 <div className="text-left md:text-right">
                   <div className="text-5xl font-black text-slate-900 mb-2">€0</div>
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Засекогаш</p>
                 </div>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[80px] -z-10 -translate-y-1/2 translate-x-1/2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                 { label: 'Учесници', value: '50', total: '50' },
                 { label: 'Анкети', value: '3', total: '3' },
                 { label: 'Настани', value: '5', total: '5' }
               ].map((stat, i) => (
                 <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{stat.label}</p>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-3xl font-black text-slate-900">{stat.value}</span>
                      <span className="text-slate-300 font-bold">/ {stat.total}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full w-full" />
                    </div>
                 </div>
               ))}
            </div>

            <div className="mt-16 bg-slate-900 p-12 rounded-[3.5rem] flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-2xl shadow-indigo-100">
               <div>
                 <h4 className="text-2xl font-black text-white mb-2">Сакате повеќе можности?</h4>
                 <p className="text-indigo-200 font-bold opacity-70">Надградете го вашиот план и добијте неограничен пристап до сите AI алатки.</p>
               </div>
               <button 
                onClick={() => setView('pricing')}
                className="px-10 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-lg hover:bg-indigo-50 transition-all active:scale-95"
               >
                 Види планови
               </button>
            </div>
          </motion.div>
        );
      case 'team':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-12 max-w-4xl mx-auto text-center pt-32"
          >
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-16 rounded-[4rem] border-2 border-indigo-100/50 shadow-2xl shadow-indigo-50 relative overflow-hidden group">
               <div className="relative z-10">
                 <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-indigo-600 mx-auto mb-10 shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform duration-500">
                    <span className="text-5xl font-black tracking-tighter">TEAM</span>
                 </div>
                 <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Работете заедно со вашиот тим</h2>
                 <p className="text-xl text-slate-500 font-bold mb-12 leading-relaxed opacity-80 uppercase tracking-widest text-xs">Функција достапна само во Pro и Semester плановите.</p>
                 <button 
                  onClick={() => setActiveTab('plan')}
                  className="px-12 py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 active:scale-95"
                >
                  Надгради сега
                </button>
               </div>
               <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white/40 rounded-full blur-[80px]" />
            </div>
          </motion.div>
        );
      default:
        return (
          <div className="p-12 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mb-8 animate-bounce">
               <span className="text-5xl">⚙️</span>
            </div>
            <h2 className="text-3xl font-black text-slate-300">Наскоро достапно...</h2>
            <p className="text-slate-200 font-bold mt-2 uppercase tracking-widest">Овој дел се подготвува за вас.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans selection:bg-indigo-100 selection:text-indigo-700">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={onLogout} />
      
      <main className="flex-1 min-h-screen relative overflow-y-auto h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Dashboard;
