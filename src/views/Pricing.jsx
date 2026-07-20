import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, XCircle, ArrowRight, Gift, RotateCcw, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

const Pricing = ({ setView }) => {
  const navigate = useNavigate();
  const [comparisonOpen, setComparisonOpen] = useState(false);

  useSEO({
    title: 'Цени | MKD Slidea — Бесплатен и Pro план за наставници и фирми',
    description: 'Бесплатен план со 200 учесници, Pro план од €20/година. 14 дена бесплатен пробен период. Македонска интерактивна платформа за настава, обуки и состаноци.',
    keywords: 'цени, mentimeter алтернатива, slidea план, бесплатен квиз, pro план',
    path: '/pricing',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Product',
          'name': 'MKD Slidea',
          'description': 'Македонска интерактивна платформа за настава, обуки и презентации.',
          'brand': { '@type': 'Brand', 'name': 'MKD Slidea' },
          'offers': [
            { '@type': 'Offer', 'name': 'Бесплатен', 'price': '0', 'priceCurrency': 'EUR', 'availability': 'https://schema.org/InStock' },
            { '@type': 'Offer', 'name': 'Месечен', 'price': '5', 'priceCurrency': 'EUR', 'availability': 'https://schema.org/InStock' },
            { '@type': 'Offer', 'name': 'Годишен', 'price': '20', 'priceCurrency': 'EUR', 'availability': 'https://schema.org/InStock' },
          ],
        },
        {
          '@type': 'FAQPage',
          'mainEntity': [
            { '@type': 'Question', 'name': 'Дали треба кредитна картичка за 14-дневниот пробен период?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Не, не е потребна кредитна картичка. Можете да го пробате Pro планот 14 дена целосно бесплатно.' } },
            { '@type': 'Question', 'name': 'Може ли да откажам претплата?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Да, можете да откажете во секое време. Нема обврски или скриени такси.' } },
            { '@type': 'Question', 'name': 'Каква е гаранцијата?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Нудиме 30-дневна гаранција за поврат на пари. Ако не сте задоволни, ќе ви вратиме целосен рефунд без прашања.' } },
            { '@type': 'Question', 'name': 'Колку учесници може да гласаат во реалното?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Бесплатниот план поддржува до 200 учесници. Про планот поддржува до неограничен број учесници во зависност од планот.' } },
            { '@type': 'Question', 'name': 'Дали MKD Slidea поддржува македонски јазик?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Да, MKD Slidea е целосно на македонски јазик и е наменета специјално за македонскиот образовен систем.' } },
          ],
        },
        {
          '@type': 'Organization',
          'name': 'MKD Slidea',
          'url': 'https://slidea.mismath.net',
          'description': 'Македонска интерактивна платформа за настава и обуки.',
          'contactPoint': { '@type': 'ContactPoint', 'contactType': 'customer support', 'email': 'support@mismath.net' },
        },
      ],
    },
  });

  const plans = [
    {
      code: null,
      name: "Бесплатен",
      price: "0",
      period: "/засекогаш",
      target: "За наставници",
      features: [
        "До 200 учесници",
        "10 анкети по настан",
        "До 5 настани месечно",
        "Основни извештаи",
        "Реакции во живо"
      ],
      button: "Започни бесплатно",
      color: "bg-slate-50 text-slate-900",
      btnColor: "bg-slate-900 text-white",
      tag: "ОСНОВЕН"
    },
    {
      code: 'monthly',
      name: "Месечен",
      price: "5",
      period: "/мес",
      target: "Флексибилен",
      features: [
        "До 200 учесници",
        "10 анкети по настан",
        "Неограничени настани",
        "AI Генерирање (ограничено)",
        "Приоритетна поддршка"
      ],
      button: "Пробај 14 дена бесплатно",
      color: "bg-white text-slate-900 border-2 border-slate-100",
      btnColor: "bg-indigo-600 text-white",
      tag: "FLEX",
      trial: true
    },
    {
      code: 'quarterly',
      name: "Квартален",
      price: "10",
      period: "/3 мес",
      target: "Заштеди 33%",
      features: [
        "До 500 учесници",
        "Неограничени анкети",
        "Целосен AI асистент",
        "Напредна аналитика",
        "Тимска соработка"
      ],
      button: "Пробај 14 дена бесплатно",
      color: "bg-white text-slate-900 border-2 border-slate-100",
      btnColor: "bg-indigo-600 text-white",
      tag: "SAVER",
      trial: true
    },
    {
      code: 'semester',
      name: "Семестрален",
      price: "15",
      period: "/6 мес",
      target: "Најпопуларно",
      features: [
        "До 1000 учесници",
        "Сè од Кварталниот план",
        "Експорт на извештаи",
        "Сопствени бои",
        "До 5 тимски членови"
      ],
      button: "Пробај 14 дена бесплатно",
      color: "bg-white text-slate-900 border-2 border-indigo-100 shadow-xl shadow-indigo-50",
      btnColor: "bg-indigo-600 text-white",
      tag: "ПОПУЛАРНО",
      popular: true,
      trial: true
    },
    {
      code: 'yearly',
      name: "Годишен",
      price: "20",
      period: "/год",
      target: "Професионален",
      features: [
        "Неограничени учесници",
        "Најдобра вредност",
        "Сопствено брендирање",
        "Експорт на податоци",
        "Интеграции: PowerPoint, Google и e-дневник"
      ],
      button: "Пробај 14 дена бесплатно",
      color: "bg-slate-900 text-white",
      btnColor: "bg-emerald-500 text-white",
      tag: "НАЈДОБРА ПОНУДА",
      trial: true
    }
  ];

  const comparison = [
    { feature: "Цена / година",          mkd: "€0–€20",  menti: "€300+",        mkdWins: true },
    { feature: "Учесници (бесплатен)",   mkd: "200",      menti: "2",            mkdWins: true },
    { feature: "Македонски јазик",       mkd: "✓",        menti: "✗",            mkdWins: true },
    { feature: "AI генерирање прашања",  mkd: "✓ Pro",    menti: "✗",            mkdWins: true },
    { feature: "Анонимно гласање",       mkd: "✓",        menti: "✓",            mkdWins: false },
    { feature: "Реално-временски резулт", mkd: "✓",       menti: "✓",            mkdWins: false },
    { feature: "Рангирање & Рејтинг",    mkd: "✓",        menti: "✓ Pro",        mkdWins: true },
    { feature: "Извоз на податоци",      mkd: "✓ Pro",    menti: "✓ Pro",        mkdWins: false },
    { feature: "Локална поддршка (МК)",  mkd: "✓",        menti: "✗",            mkdWins: true },
    { feature: "Податоци во ЕУ",         mkd: "✓ Supabase EU", menti: "✗ US",    mkdWins: true },
    { feature: "30-ден гаранција",       mkd: "✓",        menti: "✗",            mkdWins: true },
  ];

  const goToCheckout = (plan) => {
    if (!plan.code) {
      setView('host');
    } else {
      navigate(`/checkout/${plan.code}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-32 pb-24 px-6 min-h-screen bg-[#F8FAFC]"
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-full mb-6 border border-emerald-200"
        >
          <Gift size={14} />
          14 дена бесплатен пробен период — без кредитна картичка
        </motion.div>
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6">Едноставни цени за секого</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
          Изберете го планот што најдобро одговара на вашите потреби. Сите Pro планови доаѓаат со 14 дена бесплатен период и 30-дневна гаранција.
        </p>
      </div>

      {/* Plans grid */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {plans.map((plan, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-10 rounded-[3rem] flex flex-col relative transition-all hover:scale-[1.02] ${plan.color}`}
          >
            {plan.tag && (
              <div className={`absolute top-8 right-8 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest ${plan.popular ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {plan.tag}
              </div>
            )}
            <h3 className="text-2xl font-black mb-1">{plan.name}</h3>
            <p className="font-bold text-xs mb-8 uppercase tracking-widest text-slate-400">{plan.target}</p>

            <div className="flex items-baseline gap-1 mb-10">
              <span className={`text-5xl font-black ${plan.name === 'Годишен' ? 'text-emerald-400' : 'text-slate-900'}`}>€{plan.price}</span>
              <span className="text-lg font-bold opacity-40">{plan.period}</span>
            </div>

            {plan.trial && (
              <div className={`mb-6 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl text-center ${plan.name === 'Годишен' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-indigo-50 text-indigo-600'}`}>
                14 дена бесплатно
              </div>
            )}

            <ul className="space-y-5 mb-12 flex-1">
              {plan.features.map((feat, j) => (
                <li key={j} className="flex items-start gap-3 text-sm font-bold leading-tight">
                  <ShieldCheck className={`${plan.name === 'Годишен' ? 'text-emerald-400' : 'text-indigo-500'} shrink-0`} size={18} />
                  <span className={plan.name === 'Годишен' ? 'text-slate-300' : 'text-slate-600'}>{feat}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => goToCheckout(plan)}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95 ${plan.btnColor}`}
            >
              {plan.button}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="max-w-3xl mx-auto mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          { icon: RotateCcw, title: "30-дневна гаранција", sub: "Не сте задоволни? Целосен рефунд без прашања." },
          { icon: Gift, title: "14 дена бесплатно", sub: "Пробај го секој Pro план без кредитна картичка." },
          { icon: Zap, title: "Откажи кога сакаш", sub: "Без договор. Откажувањето е со еден клик." },
        ].map(({ icon: Icon, title, sub }, i) => (
          <div key={i} className="flex items-start gap-4 bg-white rounded-3xl px-6 py-5 border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
              <Icon className="text-indigo-600" size={18} />
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm">{title}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5 leading-snug">{sub}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Mentimeter comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="max-w-3xl mx-auto mt-20"
      >
        <div className="text-center mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Зошто MKD Slidea?</p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900">MKD Slidea наспроти Mentimeter</h2>
          <p className="text-slate-500 font-medium mt-3">Иста функционалност. 15× пониска цена. На македонски.</p>
        </div>

        <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-100/50">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto] bg-slate-50 border-b border-slate-100">
            <div className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Функција</div>
            <div className="px-8 py-5 text-xs font-black uppercase tracking-widest text-indigo-600 text-center min-w-[120px]">MKD Slidea</div>
            <div className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-center min-w-[120px]">Mentimeter</div>
          </div>

          {comparison.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-[1fr_auto_auto] items-center border-b border-slate-50 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
            >
              <div className="px-8 py-4 text-sm font-bold text-slate-700">{row.feature}</div>
              <div className={`px-8 py-4 text-sm font-black text-center min-w-[120px] ${row.mkdWins ? 'text-emerald-600' : 'text-slate-500'}`}>
                {row.mkdWins ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-500" />
                    {row.mkd}
                  </span>
                ) : (
                  row.mkd
                )}
              </div>
              <div className={`px-8 py-4 text-sm font-bold text-center min-w-[120px] ${row.mkdWins ? 'text-slate-400' : 'text-slate-500'}`}>
                {row.mkdWins && (row.menti === '✗' || row.menti.startsWith('✗')) ? (
                  <span className="inline-flex items-center gap-1.5">
                    <XCircle size={15} className="text-red-300" />
                    {row.menti.replace('✗', '').trim() || 'Не'}
                  </span>
                ) : (
                  row.menti
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 font-medium mt-5">
          * Цените за Mentimeter се приближни врз основа на нивниот јавен ценовник и подлежат на промена без најава.
        </p>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-20 text-center"
      >
        <div className="inline-flex flex-col items-center gap-4">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Имате специфични потреби?</p>
          <a
            href="mailto:bogdanoskiigor@gmail.com?subject=MKD Slidea — Enterprise решение"
            className="text-indigo-600 font-black flex items-center gap-2 hover:gap-3 transition-all"
          >
            Контактирајте нè за Enterprise решение <ArrowRight size={18} />
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Pricing;
