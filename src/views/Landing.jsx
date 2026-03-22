import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Plus, ArrowRight, Presentation, Globe,
  MonitorPlay, Users, Cloud, PieChart, MessageSquare,
  Trophy, CheckCircle2, Star, Sparkles, ChevronRight, UserPlus, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const Landing = ({ code, setCode, setView }) => {
  const navigate = useNavigate();
  const [activeDemo, setActiveDemo] = useState('wordcloud');
  const [demoValue, setDemoValue] = useState('');
  const [isCoHostOpen, setIsCoHostOpen] = useState(false);
  const [coHostCode, setCoHostCode] = useState('');
  const [coHostError, setCoHostError] = useState('');
  const [coHostLoading, setCoHostLoading] = useState(false);
  const [demoWords, setDemoWords] = useState([
    { text: 'Интеракција', size: 40 },
    { text: 'Учење', size: 30 },
    { text: 'Квиз', size: 25 },
    { text: 'Забава', size: 35 },
    { text: 'Скопје', size: 20 },
    { text: 'Дигитално', size: 28 },
  ]);

  const addWord = (e) => {
    if (e.key === 'Enter' && demoValue.trim()) {
      setDemoWords([...demoWords, { text: demoValue.trim(), size: Math.random() * 20 + 20 }]);
      setDemoValue('');
    }
  };

  const solutions = [
    { title: 'Бизнис состаноци', icon: <Presentation className="w-6 h-6" />, color: 'bg-indigo-50 text-indigo-600' },
    { title: 'Предавања', icon: <Globe className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600' },
    { title: 'Обуки', icon: <Users className="w-6 h-6" />, color: 'bg-amber-50 text-amber-600' },
    { title: 'Вебинари', icon: <MonitorPlay className="w-6 h-6" />, color: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <motion.div
      key="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative"
    >
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-pink-100/30 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="text-left space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 rounded-[2.5rem] flex items-center gap-4 mb-8 shadow-2xl shadow-indigo-100 max-w-lg"
            >
              <span className="text-white font-black text-xs uppercase tracking-widest pl-4 hidden md:block">Приклучи се како учесник:</span>
              <div className="flex-1 flex gap-2">
                <input 
                  type="text" 
                  maxLength={7}
                  placeholder="Внеси код..."
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/^#/, '').toUpperCase())}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 text-white font-black placeholder:text-white/40 focus:bg-white/20 outline-none w-full"
                />
                <button 
                  onClick={() => setView('join')}
                  className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                >
                  Влези
                </button>
              </div>
            </motion.div>

            {/* Co-host entry */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <button
                onClick={() => setIsCoHostOpen(true)}
                className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-black text-xs uppercase tracking-widest transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Сте Ко-домаќин? Влезте тука →
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-black text-xs uppercase tracking-widest shadow-sm"
            >
              <Sparkles size={14} /> Новата ера на презентации
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 leading-[0.95]"
            >
              Слајдови кои <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 italic">слушаат.</span><br />
              Идеи кои <span className="text-indigo-600">водат.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-500 max-w-xl leading-relaxed font-medium"
            >
              Трансформирајте ја вашата училница или бизнис состанок во интерактивно доживување. 
              Најмоќната македонска алатка за анкети и квизови во живо.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              <button 
                onClick={() => setView('host')}
                className="group relative px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95 flex items-center gap-3"
              >
                Започни сега <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => setView('dashboard')}
                className="px-10 py-5 bg-white text-slate-700 rounded-[2rem] font-black text-xl border-2 border-slate-100 hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95"
              >
                Погледни демо
              </button>
            </motion.div>

            {/* Quick Stats */}
            <div className="flex items-center gap-12 pt-8 border-t border-slate-100">
              <div>
                <div className="text-3xl font-black text-slate-900">50,000+</div>
                <div className="text-sm font-bold text-slate-400">Корисници месечно</div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900">100%</div>
                <div className="text-sm font-bold text-slate-400">На македонски</div>
              </div>
            </div>
          </div>

          {/* Interactive Demo Block */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="relative"
          >
            <div className="bg-white p-2 rounded-[4rem] shadow-[0_32px_64px_-16px_rgba(79,70,229,0.15)] border border-slate-100">
              <div className="bg-slate-50 rounded-[3.5rem] overflow-hidden p-8 md:p-12 relative min-h-[500px] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                      <Cloud size={20} />
                    </div>
                    <span className="font-black text-slate-400 uppercase tracking-widest text-xs">Демо: Облак со зборови</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-slate-200" />)}
                  </div>
                </div>

                <div className="flex-1 flex flex-wrap items-center justify-center gap-4 py-8 content-center">
                  <AnimatePresence>
                    {demoWords.map((word, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ fontSize: word.size, fontWeight: 900 }}
                        className="text-indigo-600/80 hover:text-indigo-600 cursor-default transition-colors"
                      >
                        {word.text}
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="mt-auto bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/50 shadow-xl">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Пробај: Внеси збор и притисни Enter</p>
                  <input 
                    type="text" 
                    placeholder="Вашиот збор..."
                    value={demoValue}
                    onChange={(e) => setDemoValue(e.target.value)}
                    onKeyDown={addWord}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-10 -right-10 bg-white p-6 rounded-3xl shadow-xl border border-slate-50 z-20"
            >
              <PieChart size={32} className="text-emerald-500" />
            </motion.div>
            <motion.div 
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-6 -left-10 bg-white p-6 rounded-3xl shadow-xl border border-slate-50 z-20"
            >
              <Trophy size={32} className="text-amber-500" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="bg-white py-32 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl font-black text-slate-900">Едно решение за сите ваши потреби</h2>
            <p className="text-slate-500 font-bold max-w-2xl mx-auto">
              MKD Slidea е дизајнирана да биде вашата десна рака без разлика дали предавате во училница или водите глобален вебинар.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {solutions.map((sol, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 group cursor-pointer hover:bg-white hover:shadow-2xl hover:shadow-indigo-50 transition-all"
              >
                <div className={`${sol.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  {sol.icon}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-4">{sol.title}</h3>
                <p className="text-sm text-slate-400 font-bold leading-relaxed mb-8 text-left">
                  Интерактивни алатки специјално прилагодени за {sol.title.toLowerCase()}.
                </p>
                <button className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                  Дознај повеќе <ChevronRight size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Detail */}
      <section className="py-32 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-12">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                   <MessageSquare className="text-indigo-600 mb-4" />
                   <h4 className="font-black mb-2">Q&A во живо</h4>
                   <p className="text-xs text-slate-400 font-bold leading-relaxed">Дајте ѝ глас на публиката без прекинување.</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                   <PieChart className="text-emerald-600 mb-4" />
                   <h4 className="font-black mb-2">Анкети</h4>
                   <p className="text-xs text-slate-400 font-bold leading-relaxed">Инстант одговори во преубави графикони.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                   <Trophy className="text-amber-500 mb-4" />
                   <h4 className="font-black mb-2">Квизови</h4>
                   <p className="text-xs text-slate-400 font-bold leading-relaxed">Натпреварувајте се и најдете го победникот.</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                   <Star className="text-pink-600 mb-4" />
                   <h4 className="font-black mb-2">Реакции</h4>
                   <p className="text-xs text-slate-400 font-bold leading-relaxed">Дозволете им на сите да ја покажат емоцијата.</p>
                </div>
              </div>
            </div>
            {/* Background Circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-50 rounded-full blur-[100px] -z-10" />
          </div>

          <div className="order-1 lg:order-2 space-y-8">
            <h2 className="text-5xl font-black text-slate-900 leading-tight">Сите алатки што ви требаат за успех</h2>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              Не трошете време на сложени платформи. MKD Slidea ви нуди сè што ви треба на едноставен, но моќен начин.
            </p>
            <ul className="space-y-4">
              {['Неограничени активности', 'Детална аналитика по настан', 'Споделување со еден клик'].map((feat, i) => (
                <li key={i} className="flex items-center gap-3 font-bold text-slate-700">
                  <div className="bg-emerald-100 p-1 rounded-full"><CheckCircle2 size={16} className="text-emerald-600" /></div>
                  {feat}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => setView('host')}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
            >
              Креирај настан бесплатно
            </button>
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <h3 className="text-white text-2xl font-black">Подготвени сте да ја подигнете интеракцијата на следно ниво?</h3>
          <button 
            onClick={() => setView('host')}
            className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-lg hover:bg-slate-100 transition-all active:scale-95"
          >
            Започни бесплатно
          </button>
        </div>
      </section>

      {/* Co-host Modal */}
      <AnimatePresence>
        {isCoHostOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" onClick={() => setIsCoHostOpen(false)}>
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl z-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-[2rem]" />
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 p-3 rounded-2xl">
                    <UserPlus className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Ко-домаќин</h3>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">Внесете го кодот за пристап</p>
                  </div>
                </div>
                <button onClick={() => setIsCoHostOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setCoHostError('');
                  setCoHostLoading(true);
                  const { data } = await supabase
                    .from('events')
                    .select('code')
                    .eq('cohost_code', coHostCode.trim().toUpperCase())
                    .single();
                  setCoHostLoading(false);
                  if (!data) {
                    setCoHostError('Погрешен код. Проверете го кодот кај домаќинот.');
                    return;
                  }
                  localStorage.setItem('active_event_code', data.code);
                  navigate('/host');
                }}
                className="space-y-4"
              >
                <input
                  autoFocus
                  type="text"
                  value={coHostCode}
                  onChange={e => { setCoHostCode(e.target.value.toUpperCase()); setCoHostError(''); }}
                  placeholder="Ко-домаќин код..."
                  maxLength={10}
                  className={`w-full border-2 rounded-2xl px-5 py-4 font-black text-slate-900 text-lg tracking-widest outline-none transition-all ${coHostError ? 'border-red-400 bg-red-50' : 'border-slate-100 focus:border-indigo-500'}`}
                />
                {coHostError && (
                  <p className="text-red-500 font-black text-sm">{coHostError}</p>
                )}
                <button
                  type="submit"
                  disabled={coHostLoading || coHostCode.length < 6}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg shadow-indigo-100 disabled:shadow-none"
                >
                  {coHostLoading ? 'Се проверува...' : 'Влези како Ко-домаќин'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Landing;
