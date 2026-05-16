import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSEO } from '../hooks/useSEO';
import {
  GraduationCap, Users, BarChart2, Shield, Globe, Zap,
  CheckCircle2, ArrowRight, Mail, Building2, BookOpen
} from 'lucide-react';

const FEATURES = [
  { icon: Zap,         title: 'AI генерирање на квизови',   desc: 'Наставникот опишува тема — AI прави целосен квиз за 30 секунди. Усогласено со БРО курикулумот G1–G13.' },
  { icon: Users,       title: 'До 500 ученици истовремено',  desc: 'Еден код, без апликација, без регистрација за учениците. Работи на секој уред со browser.' },
  { icon: BarChart2,   title: 'Аналитика по ученик и клас', desc: 'Статистики по прашање, скорборд, CSV/PDF извоз за евиденција и портфолио.' },
  { icon: Shield,      title: 'GDPR и безбедност',          desc: 'Серверите во ЕУ (Supabase Frankfurt). Ученичките податоци не се продаваат. Анонимно учество опционално.' },
  { icon: Globe,       title: '7 јазика',                   desc: 'Македонски, албански, српски, бугарски, хрватски, романски, англиски. Идеален за мулти-етнички средини.' },
  { icon: BookOpen,    title: '100+ готови шаблони',        desc: 'Математика, физика, хемија, историја, јазик — по одделение. Наставникот само избира и почнува.' },
];

const PLANS = [
  {
    name: 'Поединечен наставник',
    price: '5',
    period: '/месец',
    note: 'или 20€/год',
    features: ['До 500 учесници', '100 AI генерирања/месец', 'CSV/PDF извоз', 'QR код', 'Presenter notes'],
    cta: 'Пробај бесплатно',
    href: '/',
    highlight: false,
  },
  {
    name: 'Училиште / Институција',
    price: 'По договор',
    period: '',
    note: 'Од 10 наставника',
    features: ['Неограничени наставници', 'Централна Admin конзола', 'AI без лимит', 'Фактура / УЈП сметка', 'Приоритетна поддршка на МК', 'Брендиран интерфејс'],
    cta: 'Контактирај нè',
    href: 'mailto:bogdanoskiigor@gmail.com?subject=MKD Slidea — институционална лиценца',
    highlight: true,
  },
];

const STATS = [
  { value: '100+', label: 'готови шаблони' },
  { value: '7',    label: 'јазика' },
  { value: '500',  label: 'учесници/настан' },
  { value: '30s',  label: 'AI генерирање' },
];

export default function Schools() {
  useSEO({
    title: 'MKD Slidea за училишта и институции | Интерактивна настава',
    description: 'Институционални лиценци за училишта, факултети и НВО. Централна Admin конзола, неограничени наставници, GDPR усогласено, фактура/УЈП. Контактирај нè за понуда.',
    keywords: 'интерактивна настава школа, мон образование македонија, бро курикулум дигитализација, slidea за училиште, edu лиценца македонија',
    path: '/schools',
    image: 'https://slidea.mismath.net/api/og',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': 'MKD Slidea за институции',
      'description': 'Институционална лиценца за интерактивна настава — школи, факултети, НВО.',
      'url': 'https://slidea.mismath.net/schools',
      'brand': { '@type': 'Brand', 'name': 'MKD Slidea' },
      'offers': {
        '@type': 'Offer',
        'priceCurrency': 'EUR',
        'price': '0',
        'description': 'Цена по договор за институции. Контакт за понуда.',
        'seller': { '@type': 'Organization', 'name': 'MKD Slidea' },
      },
    },
  });

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20 px-4"
        style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #24243e 100%)' }}>
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #6366f133 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b5cf633 0%, transparent 50%)' }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-4 py-2 rounded-full text-sm font-bold mb-6">
              <Building2 className="w-4 h-4" />
              За училишта, факултети и НВО
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              Дигитализирај ја<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}>
                наставата во твоето училиште
              </span>
            </h1>
            <p className="text-slate-300 text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
              Еден план за целиот наставен кадар. Централна контрола, GDPR усогласеност, фактура за УЈП — сè што институцијата бара.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:bogdanoskiigor@gmail.com?subject=MKD Slidea — институционална лиценца&body=Здраво, заинтересирани сме за институционална лиценца за MKD Slidea. Институција: %0AБрој на наставници: %0AКонтакт телефон:"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-lg transition-all"
              >
                <Mail className="w-5 h-5" /> Побарај понуда
              </a>
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black text-lg transition-all border border-white/20"
              >
                Пробај бесплатно <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-b border-slate-100">
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <div className="text-4xl font-black text-indigo-600 mb-1">{s.value}</div>
              <div className="text-sm text-slate-500 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">Се' што ти треба за модерна настава</h2>
            <p className="text-slate-500 text-lg">Дизајниран специфично за македонскиот образовен контекст.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="p-6 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-black text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* МОН/БРО alignment */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(135deg, #f8faff 0%, #f5f3ff 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <GraduationCap className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-slate-900 mb-4">Усогласено со БРО курикулумот</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Шаблоните и AI генерирањето се усогласени со Бирото за развој на образованието (БРО) — одделенија G1–G13, сите предмети.
            Платформата ги поддржува <strong>4К компетенциите</strong> (критичко размислување, комуникација, соработка, креативност)
            пропишани во реформата на основното образование.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['БРО G1–G13', 'Активно учење', '4К компетенции', 'Формативна оценка', 'Дигитализација'].map(tag => (
              <span key={tag} className="text-sm font-bold bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Едноставни цени</h2>
            <p className="text-slate-500">Без скриени такси. Фактура за буџетски организации.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`rounded-3xl p-8 border-2 ${plan.highlight ? 'border-indigo-500 shadow-xl shadow-indigo-100' : 'border-slate-100'}`}>
                {plan.highlight && (
                  <div className="inline-block bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
                    Препорачано
                  </div>
                )}
                <h3 className="text-xl font-black text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`font-black ${plan.price === 'По договор' ? 'text-2xl text-indigo-600' : 'text-4xl text-slate-900'}`}>{plan.price}</span>
                  {plan.period && <span className="text-slate-400 font-medium mb-1">{plan.period}</span>}
                </div>
                <p className="text-slate-400 text-sm mb-6">{plan.note}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                {plan.href.startsWith('mailto') ? (
                  <a href={plan.href}
                    className={`block w-full text-center py-3 rounded-2xl font-black transition-all ${plan.highlight ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                    {plan.cta}
                  </a>
                ) : (
                  <Link to={plan.href}
                    className={`block w-full text-center py-3 rounded-2xl font-black transition-all ${plan.highlight ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                    {plan.cta}
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4"
        style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-4">Подготвено за твоето училиште?</h2>
          <p className="text-slate-300 mb-8">Испрати ни email со бројот на наставници и ние ви испраќаме понуда за 24 часа.</p>
          <a
            href="mailto:bogdanoskiigor@gmail.com?subject=MKD Slidea — институционална лиценца"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-all"
          >
            <Mail className="w-5 h-5" /> bogdanoskiigor@gmail.com
          </a>
        </div>
      </section>
    </div>
  );
}
