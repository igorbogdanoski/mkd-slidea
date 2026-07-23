import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, UserPlus } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { testimonials, faqItems, solutions } from '../data/landingContent';
import CountUp from '../components/CountUp';
import InteractiveDemoBlock from '../components/Landing/InteractiveDemoBlock';
import JoinCodeEntry from '../components/Landing/JoinCodeEntry';
import CoHostModal from '../components/Landing/CoHostModal';
import ThreeStepSection from '../components/Landing/ThreeStepSection';
import TestimonialsSection from '../components/Landing/TestimonialsSection';
import EducationSection from '../components/Landing/EducationSection';
import SolutionsSection from '../components/Landing/SolutionsSection';
import ComparisonSection from '../components/Landing/ComparisonSection';
import FeaturesDetailSection from '../components/Landing/FeaturesDetailSection';
import FaqSection from '../components/Landing/FaqSection';
import TrustBannerSection from '../components/Landing/TrustBannerSection';

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
  const [isCoHostOpen, setIsCoHostOpen] = useState(false);
  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
            <JoinCodeEntry code={code} setCode={setCode} setView={setView} />

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
          <InteractiveDemoBlock />
        </div>
      </section>

      {/* 3-Step Process */}
      <ThreeStepSection />

      {/* Testimonials */}
      <TestimonialsSection testimonials={testimonials} />

      {/* Education Section */}
      <EducationSection />

      {/* Solutions Grid */}
      <SolutionsSection solutions={solutions} setView={setView} />

      {/* Comparison Section */}
      <ComparisonSection />

      {/* Features Detail */}
      <FeaturesDetailSection setView={setView} />

      {/* FAQ */}
      <FaqSection faqItems={faqItems} />

      {/* Trust Banner */}
      <TrustBannerSection setView={setView} />

      {/* Co-host Modal */}
      <CoHostModal isOpen={isCoHostOpen} onClose={() => setIsCoHostOpen(false)} />
    </motion.div>
  );
};

export default Landing;
