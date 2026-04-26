import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, ArrowRight, Presentation,
  MonitorPlay, Users, Cloud, PieChart, MessageSquare,
  Trophy, CheckCircle2, Star, Sparkles, ChevronRight, UserPlus, X,
  BookOpen, GraduationCap, School, BarChart2, MousePointerClick, Layout
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const faqItems = [
  {
    question: 'За кого е наменета MKD Slidea?',
    answer: 'MKD Slidea е наменета за наставници, професори, обучувачи, HR тимови, компании и организатори на настани кои сакаат поактивна публика и мерливи резултати.',
  },
  {
    question: 'Дали учесниците треба да инсталираат апликација?',
    answer: 'Не. Учесниците се приклучуваат преку код и линк директно од прелистувач, на телефон, таблет или компјутер.',
  },
  {
    question: 'Кои интеракции ги поддржува платформата?',
    answer: 'Поддржани се анкети, квизови, word cloud, Q&A, рангирање, rating активности и преглед на резултати во реално време.',
  },
  {
    question: 'Дали е погодна за училници и обуки на македонски јазик?',
    answer: 'Да. Платформата е локализирана за македонски корисници и е дизајнирана за образование, обуки и деловни презентации.',
  },
];

const demoPollData = [
  { label: 'Да, веднаш би ја користел/а', value: 64, color: 'bg-indigo-600' },
  { label: 'Сакам прво кратко демо', value: 24, color: 'bg-violet-500' },
  { label: 'Ми треба повеќе информации', value: 12, color: 'bg-slate-300' },
];

const demoQuizOptions = [
  { label: 'Python', correct: true },
  { label: 'Java', correct: false },
  { label: 'C', correct: false },
  { label: 'PHP', correct: false },
];

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
    { title: 'Бизнис состаноци', desc: 'Собери мислења од целиот тим во реално време.', icon: <Presentation className="w-6 h-6" />, color: 'bg-indigo-50 text-indigo-600' },
    { title: 'Предавања', desc: 'Провери го знаењето и задржи ја вниманието.', icon: <GraduationCap className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600' },
    { title: 'Обуки', desc: 'Интерактивни сесии со мерливи резултати.', icon: <Users className="w-6 h-6" />, color: 'bg-amber-50 text-amber-600' },
    { title: 'Вебинари', desc: 'Ангажирај ја онлајн публиката исто како во сала.', icon: <MonitorPlay className="w-6 h-6" />, color: 'bg-rose-50 text-rose-600' },
  ];

  useEffect(() => {
    const cleanups = [];
    const description = 'MKD Slidea е македонска интерактивна платформа за настава, обуки и презентации во живо со анкети, квизови, Q&A и word cloud активности во реално време.';
    const title = 'MKD Slidea | Интерактивни презентации, анкети и квизови во живо';
    const canonicalUrl = `${window.location.origin}/`;
    const updateMeta = (attr, key, value) => {
      let element = document.head.querySelector(`meta[${attr}="${key}"]`);
      const created = !element;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      const previous = element.getAttribute('content');
      element.setAttribute('content', value);
      cleanups.push(() => {
        if (created) {
          element.remove();
        } else if (previous === null) {
          element.removeAttribute('content');
        } else {
          element.setAttribute('content', previous);
        }
      });
    };
    const updateLink = (rel, href) => {
      let element = document.head.querySelector(`link[rel="${rel}"]`);
      const created = !element;
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      const previous = element.getAttribute('href');
      element.setAttribute('href', href);
      cleanups.push(() => {
        if (created) {
          element.remove();
        } else if (previous === null) {
          element.removeAttribute('href');
        } else {
          element.setAttribute('href', previous);
        }
      });
    };

    const previousTitle = document.title;
    document.title = title;
    cleanups.push(() => {
      document.title = previousTitle;
    });

    updateMeta('name', 'description', description);
    updateMeta('name', 'robots', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
    updateMeta('property', 'og:title', title);
    updateMeta('property', 'og:description', description);
    updateMeta('property', 'og:type', 'website');
    updateMeta('property', 'og:url', canonicalUrl);
    updateMeta('name', 'twitter:title', title);
    updateMeta('name', 'twitter:description', description);
    updateMeta('name', 'twitter:card', 'summary_large_image');
    updateLink('canonical', canonicalUrl);

    const previousSchema = document.getElementById('landing-seo-schema');
    if (previousSchema) {
      previousSchema.remove();
    }
    const schema = document.createElement('script');
    schema.id = 'landing-seo-schema';
    schema.type = 'application/ld+json';
    schema.textContent = JSON.stringify([
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'MKD Slidea',
        url: canonicalUrl,
        inLanguage: 'mk-MK',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'MKD Slidea',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        inLanguage: 'mk-MK',
        description,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'EUR',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ]);
    document.head.appendChild(schema);
    cleanups.push(() => {
      schema.remove();
    });

    return () => {
      cleanups.reverse().forEach((cleanup) => cleanup());
    };
  }, []);

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const demoTitle = {
    wordcloud: 'Демо: Облак со зборови',
    poll: 'Демо: Анкета во живо',
    quiz: 'Демо: Квиз прашање',
  }[activeDemo];

  return (
    <motion.div
      key="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative"
    >
      {/* Hero Section */}
      <section id="hero" className="relative pt-32 pb-20 overflow-hidden" aria-label="Почетна секција">
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
              Трансформирајте ја училницата, обуката или состанокот во интерактивно доживување.
              Создавајте анкети, квизови и активности во живо за публика што навистина учествува.
            </motion.p>

            <div className="flex flex-wrap gap-3">
              {['Без инсталација', 'Во живо на секој уред', 'Целосно на македонски'].map((item) => (
                <div key={item} className="px-4 py-2 rounded-full bg-white/80 border border-slate-200 text-sm font-black text-slate-700 shadow-sm">
                  {item}
                </div>
              ))}
            </div>

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
                onClick={() => scrollToSection('interactive-demo')}
                className="px-10 py-5 bg-white text-slate-700 rounded-[2rem] font-black text-xl border-2 border-slate-100 hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95"
              >
                Погледни демо
              </button>
            </motion.div>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => scrollToSection('education')} className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-black text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                За образование
              </button>
              <button onClick={() => scrollToSection('solutions')} className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-black text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                За тимови и бизнис
              </button>
              <button onClick={() => scrollToSection('faq')} className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-black text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                ЧПП
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-slate-100">
              {[
                { value: 'Бесплатно', label: 'За старт, без кредитна картичка' },
                { value: '100%', label: 'Локализирано на македонски јазик' },
                { value: 'Во живо', label: 'Резултати и интеракција во реално време' },
              ].map((item) => (
                <div key={item.value} className="bg-white/80 border border-slate-200 rounded-[1.75rem] p-5 shadow-sm">
                  <div className="text-2xl font-black text-slate-900">{item.value}</div>
                  <div className="text-sm font-bold text-slate-400">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Demo Block */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="relative"
            id="interactive-demo"
          >
            <div className="bg-white p-2 rounded-[4rem] shadow-[0_32px_64px_-16px_rgba(79,70,229,0.15)] border border-slate-100">
              <div className="bg-slate-50 rounded-[3.5rem] overflow-hidden p-8 md:p-12 relative min-h-[500px] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                      {activeDemo === 'wordcloud' ? <Cloud size={20} /> : activeDemo === 'poll' ? <PieChart size={20} /> : <Trophy size={20} />}
                    </div>
                    <span className="font-black text-slate-400 uppercase tracking-widest text-xs">{demoTitle}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-slate-200" />)}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {[
                    { id: 'wordcloud', label: 'Word Cloud' },
                    { id: 'poll', label: 'Анкета' },
                    { id: 'quiz', label: 'Квиз' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveDemo(tab.id)}
                      className={`px-4 py-2 rounded-full text-sm font-black transition-all ${activeDemo === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeDemo === 'wordcloud' && (
                  <>
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
                  </>
                )}

                {activeDemo === 'poll' && (
                  <div className="flex-1 flex flex-col justify-center gap-5 py-8">
                    <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Прашање</p>
                      <h3 className="text-2xl font-black text-slate-900 mb-6">Дали би користеле интерактивни анкети на следната презентација?</h3>
                      <div className="space-y-4">
                        {demoPollData.map((item) => (
                          <div key={item.label}>
                            <div className="flex items-center justify-between mb-2 text-sm font-black text-slate-700">
                              <span>{item.label}</span>
                              <span>{item.value}%</span>
                            </div>
                            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                              <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-5 text-sm font-bold text-indigo-700">
                      Одговорите пристигнуваат веднаш и се прикажуваат пред целата публика во живо.
                    </div>
                  </div>
                )}

                {activeDemo === 'quiz' && (
                  <div className="flex-1 flex flex-col justify-center py-8">
                    <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm max-w-xl mx-auto w-full">
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Квиз прашање</p>
                      <h3 className="text-2xl font-black text-slate-900 mb-6">Кој програмски јазик најчесто се користи во AI/ML проекти?</h3>
                      <div className="space-y-3">
                        {demoQuizOptions.map((option) => (
                          <div
                            key={option.label}
                            className={`rounded-2xl border px-5 py-4 font-black text-sm ${option.correct ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                          >
                            {option.label}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-5 text-center text-sm font-bold text-slate-500">
                      Квизови со точни одговори, рангирање и моментални резултати.
                    </div>
                  </div>
                )}
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

      {/* 3-Step Process */}
      <section id="how-it-works" className="bg-white py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-4xl font-black text-slate-900">Едноставно како 1 — 2 — 3</h2>
            <p className="text-slate-500 font-bold max-w-xl mx-auto">Од идеја до интерактивна презентација за помалку од 2 минути.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-0.5 bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-200" />
            {[
              {
                step: '01',
                icon: <Layout className="w-7 h-7" />,
                title: 'Креирај',
                desc: 'Додај прашања — анкети, квизови, облак со зборови, Q&A. Без инсталација, директно во прелистувачот.',
                color: 'bg-indigo-600',
                light: 'bg-indigo-50',
              },
              {
                step: '02',
                icon: <MousePointerClick className="w-7 h-7" />,
                title: 'Прикажи и собери одговори',
                desc: 'Учесниците се приклучуваат со код. Одговорите пристигнуваат во реално време — без апликација.',
                color: 'bg-violet-600',
                light: 'bg-violet-50',
              },
              {
                step: '03',
                icon: <BarChart2 className="w-7 h-7" />,
                title: 'Анализирај',
                desc: 'Извези ги резултатите во Excel, PDF или погледни ги статистиките директно по настанот.',
                color: 'bg-emerald-600',
                light: 'bg-emerald-50',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 flex flex-col gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className={`${item.color} text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                    {item.icon}
                  </div>
                  <span className="text-5xl font-black text-slate-100">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section id="education" className="py-32 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs uppercase tracking-widest">
              <GraduationCap size={14} /> За образование
            </div>
            <h2 className="text-5xl font-black text-slate-900 leading-tight">
              Ангажирај ги твоите<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">ученици и студенти</span>
            </h2>
            <p className="text-slate-500 font-bold max-w-2xl mx-auto text-lg">
              Совршена за основни и средни училишта, факултети и обуки. Направи ја секоја лекција незаборавна.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Left: big feature card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm flex flex-col gap-8"
            >
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <School className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">Секој ученик добива глас</h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                  Анонимното гласање ги охрабрува поплашливите ученици да учествуваат. Сите се чувствуваат безбедно да одговорат — без страв од грешка.
                </p>
                <ul className="space-y-3">
                  {[
                    'Анонимни одговори — без притисок',
                    'Квизови со бодување и ранг листа',
                    'Q&A: учениците поставуваат прашања анонимно',
                    'Работи на секој уред — без апликација',
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                      <div className="bg-emerald-100 p-1 rounded-full flex-shrink-0">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Right: 2 smaller cards */}
            <div className="flex flex-col gap-8">
              {[
                {
                  icon: <BookOpen className="w-6 h-6 text-violet-600" />,
                  bg: 'bg-violet-50',
                  title: 'Провери го знаењето — веднаш',
                  desc: 'Брза анкета или квиз по секоја лекција ти покажува кој концепт не е разбран — пред испитот, не после.',
                },
                {
                  icon: <BarChart2 className="w-6 h-6 text-amber-600" />,
                  bg: 'bg-amber-50',
                  title: 'Резултати во реално време',
                  desc: 'Графиконите се ажурираат пред очите на сите. Учениците го гледаат мислењето на целото одделение инстантно.',
                },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex gap-6 items-start"
                >
                  <div className={`${card.bg} w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0`}>
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">{card.title}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{card.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Use case tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Основно училиште', icon: '🏫' },
              { label: 'Средно училиште', icon: '📚' },
              { label: 'Факултет', icon: '🎓' },
              { label: 'Корпоративни обуки', icon: '💼' },
            ].map((uc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-white border border-slate-100 rounded-2xl p-6 text-center hover:border-indigo-300 hover:shadow-md transition-all cursor-default"
              >
                <div className="text-3xl mb-2">{uc.icon}</div>
                <div className="text-sm font-black text-slate-700">{uc.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section id="solutions" className="bg-white py-32 border-t border-slate-100">
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
                  {sol.desc}
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
      <section id="features" className="py-32 bg-[#F8FAFC]">
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

      {/* FAQ */}
      <section id="faq" className="bg-white py-28 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center space-y-4 mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-black text-xs uppercase tracking-widest">
              <Sparkles size={14} /> Чести прашања
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">Сѐ што им треба на новите корисници за да одлучат побрзо</h2>
            <p className="text-slate-500 font-bold max-w-2xl mx-auto">
              Јасни одговори за платформата, приклучувањето на учесници и типовите интеракции што можете да ги користите.
            </p>
          </div>

          <div className="grid gap-4">
            {faqItems.map((item) => (
              <details key={item.question} className="group bg-slate-50 border border-slate-200 rounded-[2rem] p-6 open:bg-white open:shadow-sm">
                <summary className="list-none cursor-pointer flex items-center justify-between gap-4 text-lg font-black text-slate-900">
                  <span>{item.question}</span>
                  <span className="text-indigo-600 text-2xl leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-4 text-slate-500 font-medium leading-relaxed pr-8">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2">
            <h3 className="text-white text-2xl font-black">Подготвени сте да ја подигнете интеракцијата на следно ниво?</h3>
            <p className="text-slate-300 font-bold">Започнете бесплатно, тестирајте со публика во живо и одлучете без ризик.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setView('host')}
              className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-lg hover:bg-slate-100 transition-all active:scale-95"
            >
              Започни бесплатно
            </button>
            <button 
              onClick={() => setView('pricing')}
              className="px-10 py-4 bg-transparent border border-white/20 text-white rounded-2xl font-black text-lg hover:bg-white/10 transition-all active:scale-95"
            >
              Погледни цени
            </button>
          </div>
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
                  // SECURITY: cohost_code column is no longer readable by anon.
                  // Use SECURITY DEFINER RPC that returns only the matched event.
                  const { data, error } = await supabase
                    .rpc('find_event_by_cohost_code', { p_code: coHostCode.trim().toUpperCase() });
                  setCoHostLoading(false);
                  const match = Array.isArray(data) && data.length > 0 ? data[0] : null;
                  if (error || !match) {
                    setCoHostError('Погрешен код. Проверете го кодот кај домаќинот.');
                    return;
                  }
                  localStorage.setItem('active_event_code', match.code);
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
