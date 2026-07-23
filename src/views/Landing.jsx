import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, ArrowRight, Presentation,
  MonitorPlay, Users, Cloud, PieChart, MessageSquare,
  Trophy, CheckCircle2, Star, Sparkles, ChevronRight, UserPlus, X,
  BookOpen, GraduationCap, School, BarChart2, MousePointerClick, Layout, XCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { testimonials, faqItems, demoPollData, demoQuizOptions, solutions } from '../data/landingContent';
import CountUp from '../components/CountUp';

const Landing = ({ code, setCode, setView }) => {
  useSEO({
    title: 'MKD Slidea | Интерактивни презентации, анкети и квизови во живо',
    description: 'Македонска интерактивна платформа за настава, обуки и презентации во живо со анкети, квизови, Q&A и word cloud активности во реално време.',
    keywords: 'интерактивни презентации, mentimeter алтернатива, kahoot алтернатива, квиз во живо, анкета, word cloud, интерактивна настава, БРО курикулум, македонска SaaS',
    path: '/',
    image: 'https://slidea.mismath.net/api/og-png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'EducationalApplication',
          '@id': 'https://slidea.mismath.net/#edu-app',
          'name': 'MKD Slidea',
          'description': 'Македонска интерактивна платформа за настава, обуки и презентации во живо со анкети, квизови, Q&A и word cloud активности.',
          'applicationCategory': 'EducationalApplication',
          'operatingSystem': 'Web',
          'url': 'https://slidea.mismath.net/',
          'inLanguage': ['mk', 'sq', 'sr', 'bg', 'hr', 'ro', 'en'],
          'audience': {
            '@type': 'EducationalAudience',
            'educationalRole': ['teacher', 'student', 'trainer', 'professor', 'corporate trainer'],
          },
          'offers': [
            { '@type': 'Offer', 'price': '0', 'priceCurrency': 'EUR', 'name': 'Бесплатен' },
            { '@type': 'Offer', 'price': '5', 'priceCurrency': 'EUR', 'name': 'Месечен' },
            { '@type': 'Offer', 'price': '20', 'priceCurrency': 'EUR', 'name': 'Годишен Pro' },
          ],
        },
        {
          '@type': 'FAQPage',
          '@id': 'https://slidea.mismath.net/#faq',
          'mainEntity': faqItems.map((f) => ({
            '@type': 'Question',
            'name': f.question,
            'acceptedAnswer': { '@type': 'Answer', 'text': f.answer },
          })),
        },
        {
          '@type': 'BreadcrumbList',
          '@id': 'https://slidea.mismath.net/#breadcrumb',
          'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': 'Почетна', 'item': 'https://slidea.mismath.net/' },
          ],
        },
      ],
    },
  });
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [activeDemo, setActiveDemo] = useState('wordcloud');
  const [demoValue, setDemoValue] = useState('');
  const [isCoHostOpen, setIsCoHostOpen] = useState(false);
  const [coHostCode, setCoHostCode] = useState('');
  const [coHostError, setCoHostError] = useState('');
  const [coHostLoading, setCoHostLoading] = useState(false);
  const [codeStatus, setCodeStatus] = useState('idle'); // idle | checking | valid | locked | invalid
  const validationTimer = useRef(null);

  const handleCodeChange = (val) => {
    const cleaned = val.replace(/^#/, '').toUpperCase().trim();
    setCode(cleaned);
    setCodeStatus('idle');
    clearTimeout(validationTimer.current);
    if (cleaned.length >= 5) {
      setCodeStatus('checking');
      validationTimer.current = setTimeout(async () => {
        const { data } = await supabase
          .from('events')
          .select('id, is_locked')
          .ilike('code', cleaned)
          .limit(1);
        if (data?.length > 0) {
          setCodeStatus(data[0].is_locked ? 'locked' : 'valid');
        } else {
          setCodeStatus('invalid');
        }
      }, 500);
    }
  };
  const autoWords = [
    'Интеракција', 'Учење', 'Квиз', 'Забава', 'Скопје', 'Дигитално',
    'Анкета', 'Тимска работа', 'Иновација', 'Едукација', 'Резултати',
    'Презентација', 'Активност', 'Знаење', 'Соработка', 'Напредок',
  ];
  const [demoWords, setDemoWords] = useState(
    autoWords.slice(0, 6).map((text, i) => ({ text, size: [40, 30, 25, 35, 20, 28][i] }))
  );

  useEffect(() => {
    const remaining = [...autoWords.slice(6)];
    let idx = 0;
    const timer = setInterval(() => {
      const word = remaining[idx % remaining.length];
      idx++;
      setDemoWords(prev => {
        if (prev.find(w => w.text === word)) return prev;
        const updated = [...prev, { text: word, size: Math.random() * 18 + 20 }];
        return updated.length > 14 ? updated.slice(1) : updated;
      });
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  const addWord = (e) => {
    if (e.key === 'Enter' && demoValue.trim()) {
      setDemoWords(prev => [...prev, { text: demoValue.trim(), size: Math.random() * 20 + 20 }]);
      setDemoValue('');
    }
  };

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
      <section id="hero" className="relative pt-16 pb-16 overflow-hidden" aria-label="Почетна секција">
        {/* Background Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-pink-100/30 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left space-y-6">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-black text-xs uppercase tracking-widest shadow-sm"
            >
              <Sparkles size={14} /> Новата ера на презентации
            </motion.div>

            {/* H1 — first above-fold element */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[0.95]"
            >
              Слајдови кои <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 italic">слушаат.</span><br />
              Идеи кои <span className="text-indigo-600">водат.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-slate-500 max-w-md leading-relaxed font-medium"
            >
              Анкети, квизови и word cloud во живо — за класот, обуката или настанот.
              Без инсталација, директно од прелистувач.
            </motion.p>

            {/* Creator CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-wrap gap-3"
            >
              <button
                onClick={() => { localStorage.removeItem('active_event_code'); setView('host'); }}
                className="group px-8 py-4 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-2"
              >
                Започни сега <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => setView('demo')}
                className="px-8 py-4 bg-white text-slate-700 rounded-[2rem] font-black text-lg border-2 border-slate-100 hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95"
              >
                Пробај без регистрација
              </button>
            </motion.div>

            {/* PIN Entry — big, prominent, for participants */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-indigo-600 to-violet-600 p-5 rounded-[2rem] shadow-2xl shadow-indigo-200"
            >
              <p className="text-white/70 font-black text-xs uppercase tracking-widest mb-3 pl-1">
                Имаш код за настан? Приклучи се веднаш →
              </p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    maxLength={7}
                    placeholder="Внеси код..."
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && codeStatus === 'valid' && setView('join')}
                    className="w-full bg-white/15 backdrop-blur-md border-2 border-white/20 rounded-xl px-5 py-4 text-white font-black text-lg placeholder:text-white/40 focus:bg-white/25 focus:border-white/40 outline-none transition-all tracking-widest"
                    autoComplete="off"
                  />
                  {/* Validation indicator */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {codeStatus === 'checking' && (
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    )}
                    {codeStatus === 'valid' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                    )}
                    {codeStatus === 'invalid' && (
                      <X className="w-5 h-5 text-red-300" />
                    )}
                    {codeStatus === 'locked' && (
                      <span className="text-amber-300 text-xs font-black">ПАУЗИРАН</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setView('join')}
                  disabled={code.length < 3}
                  className={`px-7 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 ${
                    codeStatus === 'valid'
                      ? 'bg-emerald-400 text-emerald-900 shadow-lg shadow-emerald-500/30 scale-105'
                      : 'bg-white text-indigo-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  Влези
                </button>
              </div>
              {codeStatus === 'valid' && (
                <p className="text-emerald-300 font-black text-xs mt-2 pl-1">✓ Сесијата е активна — притисни Влези или Enter</p>
              )}
              {codeStatus === 'invalid' && code.length >= 5 && (
                <p className="text-red-300 font-black text-xs mt-2 pl-1">Кодот не постои. Провери го со презентерот.</p>
              )}
              {codeStatus === 'locked' && (
                <p className="text-amber-300 font-black text-xs mt-2 pl-1">Сесијата е паузирана. Почекај инструкции.</p>
              )}
            </motion.div>

            {/* Co-host entry */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
              <button
                onClick={() => setIsCoHostOpen(true)}
                className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-black text-xs uppercase tracking-widest transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Сте Ко-домаќин? Влезте тука →
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

            {/* Trusted by strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="pt-2"
            >
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Користат наставници од:</p>
              <div className="flex flex-wrap gap-2">
                {['УКИМ', 'ДУИ', 'Гимназија „Скопје"', 'ФИНКИ', 'МОН обуки', 'Корпоративни тренинзи'].map((inst) => (
                  <span key={inst} className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[11px] font-black">
                    {inst}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Animated Stats */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-100">
              {[
                { target: 800, suffix: '+', label: 'Активни наставници' },
                { target: 12000, suffix: '+', label: 'Учесници одговориле' },
                { target: 98, suffix: '%', label: 'Задоволни корисници' },
              ].map((s) => (
                <div key={s.label} className="bg-white/80 border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
                  <div className="text-xl md:text-2xl font-black text-indigo-600">
                    <CountUp target={s.target} suffix={s.suffix} />
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 leading-tight mt-1">{s.label}</div>
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

      {/* Testimonials */}
      <section className="bg-slate-50 py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-black text-xs uppercase tracking-widest">
              <Star size={13} className="fill-amber-400 text-amber-400" /> Искуства на корисници
            </div>
            <h2 className="text-4xl font-black text-slate-900">Наставниците веруваат во MKD Slidea</h2>
            <p className="text-slate-500 font-bold max-w-xl mx-auto">Погледнете зошто педагозите и тренерите ширум Македонија ја избираат нашата платформа.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col gap-6 hover:shadow-md transition-shadow"
              >
                {/* Stars */}
                <div className="flex gap-1">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} size={16} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-slate-700 font-medium leading-relaxed flex-1 text-[15px]">
                  „{t.text}"
                </p>
                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 ${t.color}`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-sm">{t.name}</div>
                    <div className="text-xs font-bold text-slate-400">{t.role}</div>
                    <div className="text-xs font-bold text-indigo-500">{t.school}</div>
                  </div>
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
              className="bg-gradient-to-br from-indigo-700 to-violet-800 rounded-[3rem] p-12 shadow-2xl shadow-indigo-200 flex flex-col gap-8"
            >
              <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center">
                <School className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white mb-4">Секој ученик добива глас</h3>
                <p className="text-indigo-200 font-medium leading-relaxed mb-6 text-[15px]">
                  Анонимното гласање ги охрабрува поплашливите ученици да учествуваат. Сите се чувствуваат безбедно да одговорат — без страв од грешка.
                </p>
                <ul className="space-y-3">
                  {[
                    'Анонимни одговори — без притисок',
                    'Квизови со бодување и ранг листа',
                    'Q&A: учениците поставуваат прашања анонимно',
                    'Работи на секој уред — без апликација',
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-white/90">
                      <div className="bg-white/20 p-1 rounded-full flex-shrink-0">
                        <CheckCircle2 size={14} className="text-emerald-300" />
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

          {/* Activity type showcase — Show don't tell */}
          <div className="mt-8">
            <p className="text-center text-slate-400 font-black text-xs uppercase tracking-widest mb-8">Типови активности — изберете го вистинскиот формат</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  type: 'Word Cloud',
                  color: 'from-indigo-500 to-violet-500',
                  icon: <Cloud size={18} className="text-white" />,
                  desc: 'Учесниците внесуваат зборови — се гради облак во живо',
                  preview: (
                    <div className="flex flex-wrap gap-1.5 justify-center items-center h-20 overflow-hidden">
                      {['Учење','Квиз','Забава','Знаење','Тим'].map((w,i)=>(
                        <span key={i} style={{fontSize: [18,14,20,12,16][i]}} className="font-black text-indigo-600/80">{w}</span>
                      ))}
                    </div>
                  ),
                },
                {
                  type: 'Анкета',
                  color: 'from-emerald-500 to-teal-500',
                  icon: <PieChart size={18} className="text-white" />,
                  desc: 'Повеќекратен избор со резултати во реално време',
                  preview: (
                    <div className="space-y-1.5 w-full">
                      {[['Да, веднаш', 64], ['Можеби', 24], ['Не', 12]].map(([l,v])=>(
                        <div key={l} className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{width:`${v}%`}} />
                          </div>
                          <span className="text-[10px] font-black text-slate-500 w-6">{v}%</span>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  type: 'Квиз',
                  color: 'from-amber-500 to-orange-500',
                  icon: <Trophy size={18} className="text-white" />,
                  desc: 'Натпревар со точни одговори и ранг листа',
                  preview: (
                    <div className="space-y-1.5 w-full">
                      {[['Python','✓',true],['Java','✗',false],['C++','✗',false]].map(([l,m,c])=>(
                        <div key={l} className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-black ${c ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          <span>{l}</span><span>{m}</span>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  type: 'Q&A',
                  color: 'from-rose-500 to-pink-500',
                  icon: <MessageSquare size={18} className="text-white" />,
                  desc: 'Анонимни прашања со upvote од публиката',
                  preview: (
                    <div className="space-y-1.5 w-full">
                      {[['Кога следен квиз?',12],['Може ли повторување?',8]].map(([q,v])=>(
                        <div key={q} className="flex items-center justify-between bg-slate-100 rounded-lg px-3 py-1.5">
                          <span className="text-[10px] font-bold text-slate-600 truncate flex-1">{q}</span>
                          <span className="text-[10px] font-black text-rose-600 ml-2">▲{v}</span>
                        </div>
                      ))}
                    </div>
                  ),
                },
              ].map((act, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                  <div className={`bg-gradient-to-r ${act.color} px-5 py-4 flex items-center gap-2`}>
                    <div className="bg-white/20 w-7 h-7 rounded-lg flex items-center justify-center">{act.icon}</div>
                    <span className="font-black text-white text-sm">{act.type}</span>
                  </div>
                  <div className="p-5">
                    <div className="mb-4">{act.preview}</div>
                    <p className="text-[11px] text-slate-400 font-bold leading-snug">{act.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {solutions.map((sol, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -8, boxShadow: '0 24px 48px -12px rgba(99,102,241,0.18)' }}
                onClick={() => setView('pricing')}
                className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 group cursor-pointer hover:bg-white transition-all"
              >
                <div className={`${sol.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {sol.icon}
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-3">{sol.title}</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
                  {sol.desc}
                </p>
                <span className="flex items-center gap-1 text-indigo-600 font-black text-xs uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                  Дознај повеќе <ChevronRight size={14} />
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-xs uppercase tracking-widest">
              <Zap size={13} /> Зошто MKD Slidea?
            </div>
            <h2 className="text-4xl font-black text-slate-900">Споредба со конкурентите</h2>
            <p className="text-slate-500 font-bold max-w-xl mx-auto">Направена специјално за македонскиот пазар — со функции кои другите ги немаат.</p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-[2rem] border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-5 font-black text-slate-500 text-xs uppercase tracking-widest w-[38%]">Функционалност</th>
                  <th className="p-5 text-center w-[20%]">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center"><Zap size={14} className="text-white" /></div>
                      <span className="font-black text-indigo-600 text-sm">MKD Slidea</span>
                    </div>
                  </th>
                  <th className="p-5 text-center w-[20%]">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 font-black text-xs">M</div>
                      <span className="font-black text-slate-400 text-sm">Mentimeter</span>
                    </div>
                  </th>
                  <th className="p-5 text-center w-[20%]">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 font-black text-xs">K</div>
                      <span className="font-black text-slate-400 text-sm">Kahoot</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Целосно на македонски јазик', mkd: true, menti: false, kahoot: false, highlight: true },
                  { feature: 'Бесплатно до 200 учесници', mkd: true, menti: false, kahoot: 'partial' },
                  { feature: 'Без апликација за учесниците', mkd: true, menti: true, kahoot: true },
                  { feature: 'Word Cloud активност', mkd: true, menti: true, kahoot: false },
                  { feature: 'Отворени прашања (Open Q)', mkd: true, menti: true, kahoot: false },
                  { feature: 'Q&A со upvote од учесниците', mkd: true, menti: true, kahoot: false },
                  { feature: 'Квизови со ранг листа', mkd: true, menti: false, kahoot: true },
                  { feature: 'Модерација на одговори', mkd: true, menti: false, kahoot: false, highlight: true },
                  { feature: 'Офлајн резервна копија (гласови)', mkd: true, menti: false, kahoot: false },
                  { feature: 'CSV / PDF извоз на резултати', mkd: true, menti: 'partial', kahoot: 'partial' },
                  { feature: 'Поддршка на македонски јазик', mkd: true, menti: false, kahoot: false, highlight: true },
                ].map((row, i) => {
                  const Cell = ({ val }) => val === true
                    ? <CheckCircle2 size={20} className="text-emerald-500 mx-auto" />
                    : val === 'partial'
                    ? <span className="text-amber-500 font-black text-xs mx-auto block text-center">Делумно</span>
                    : <XCircle size={20} className="text-slate-300 mx-auto" />;
                  return (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.04 }}
                      className={`border-b border-slate-100 last:border-0 ${row.highlight ? 'bg-indigo-50/60' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <td className="p-4 pl-5 font-bold text-slate-700 text-[13px]">
                        {row.highlight && <span className="inline-block w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2 mb-0.5" />}
                        {row.feature}
                      </td>
                      <td className="p-4 text-center"><Cell val={row.mkd} /></td>
                      <td className="p-4 text-center"><Cell val={row.menti} /></td>
                      <td className="p-4 text-center"><Cell val={row.kahoot} /></td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-center text-slate-400 text-xs font-bold mt-5">* Споредбата е базирана на јавно достапните бесплатни планови (јуни 2026)</p>
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
              onClick={() => { localStorage.removeItem('active_event_code'); setView('host'); }}
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

          <div className="grid gap-3">
            {faqItems.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className={`border rounded-[1.75rem] overflow-hidden transition-all duration-300 ${isOpen ? 'bg-white border-indigo-200 shadow-md shadow-indigo-50' : 'bg-slate-50 border-slate-200 hover:border-indigo-200'}`}
                >
                  <button
                    className="w-full flex items-center justify-between gap-4 text-left px-7 py-5 cursor-pointer"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                  >
                    <span className="text-base md:text-lg font-black text-slate-900">{item.question}</span>
                    <span className={`text-indigo-600 text-2xl leading-none transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-45' : ''}`}>+</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <p className="px-7 pb-6 text-slate-500 font-medium leading-relaxed text-[15px]">{item.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
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
              onClick={() => { localStorage.removeItem('active_event_code'); setView('host'); }}
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
