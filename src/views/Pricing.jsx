import React, { useState, useId } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, XCircle, ArrowRight, Gift, RotateCcw, Zap, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { PLAN_CATALOG, SELLABLE_PLANS, yearlySavingPercent, yearlySavingAmount } from '../lib/billing';

// Single source for the FAQ: the accordion below and the FAQPage JSON-LD are
// both built from this array. They used to be separate — the structured data
// advertised five questions that appeared nowhere on the page, which is not
// just wasted markup: Google requires FAQPage content to be visible to the
// user, and marks up hidden Q&A as a structured-data violation.
const FAQS = [
  {
    q: 'Дали треба кредитна картичка за да започнам?',
    a: 'Не. Бесплатниот план важи засекогаш и не бара кредитна картичка — вклучува до 200 учесници, 5 настани и 10 анкети по настан.',
  },
  {
    q: 'Што добивам со платен план што го нема бесплатниот?',
    a: 'До 500 учесници наместо 200, неограничени настани и анкети, AI генерирање на прашања, напредна аналитика, извоз во CSV и PDF, сопствено брендирање, ко-домаќин и вградување на настанот во друга страница.',
  },
  {
    q: 'Правиме само еден вебинар годишно — мора ли претплата?',
    a: 'Не. Планот „Еден настан" чини €80 еднократно, важи 7 дена и ги отклучува сите можности за до 500 учесници. Наменет е за НВО, конференции и еднократни обуки — нема обновување и нема обврска.',
  },
  {
    q: 'Што добива училиште или организација?',
    a: 'Годишен план за правно лице со места за целиот колектив, заедничка библиотека со шаблони, фактура со ЕДБ, приоритетна поддршка и воведна обука за наставниците. Бројот на места и точната цена се договараат според големината на колективот.',
  },
  {
    q: 'Како се плаќа?',
    a: 'Плаќањето засега е рачно — по избор на план добивате инструкции за уплата на банкарска сметка или преку PayPal. Планот се активира по потврда на уплатата, најдоцна во рок од 24 часа. За правни лица издаваме фактура со ЕДБ.',
  },
  {
    q: 'Може ли да откажам претплата?',
    a: 'Да, можете да откажете во секое време. Нема обврски, договор ниту скриени такси — планот едноставно не се обновува.',
  },
  {
    q: 'Каква е гаранцијата?',
    a: 'Доколку планот не е искористен, имате право на поврат на средствата во рок од 14 дена од уплатата.',
  },
  {
    q: 'Колку учесници можат да гласаат истовремено?',
    // Deliberately not "неограничено": load testing from inside the datacenter
    // proved 300 concurrent voters at 100% success and 500 at 85–94% under a
    // fully synchronised burst. Nothing above that has been measured, so
    // nothing above that is promised.
    a: 'Бесплатниот план поддржува до 200 учесници во ист настан, а платените до 500. Тие бројки се измерени со реален тест на оптоварување, не проценети. За настан со повеќе од 500 учесници контактирајте нè однапред за да ја подготвиме инфраструктурата.',
  },
  {
    q: 'Дали MKD Slidea поддржува македонски јазик?',
    a: 'Да, платформата е целосно на македонски и е направена за македонскиот образовен систем — вклучувајќи шаблони по предмет и одделение според наставната програма.',
  },
];

const Pricing = ({ setView }) => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  // Annual is the default because it is the better deal and we say so plainly
  // — the old ladder made the frequent-payment option cost three times more
  // for less, which is the kind of thing a buyer only notices after paying.
  const [annual, setAnnual] = useState(true);
  const faqId = useId();

  useSEO({
    title: 'Цени | MKD Slidea — Бесплатен и Pro план за наставници и фирми',
    description: 'Бесплатен план засекогаш — 200 учесници, без кредитна картичка. Наставник од €36/година, план по настан €80, годишен план за училишта и НВО. Македонска платформа за интерактивна настава и вебинари.',
    keywords: 'цени, mentimeter алтернатива, план за училиште, цена по вебинар, бесплатен квиз, интерактивна презентација',
    path: '/pricing',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Product',
          'name': 'MKD Slidea',
          'description': 'Македонска интерактивна платформа за настава, обуки и презентации.',
          'brand': { '@type': 'Brand', 'name': 'MKD Slidea' },
          // Built from the catalogue so the structured data cannot advertise a
          // price the checkout no longer charges — it used to hardcode €5 and
          // €20 alongside a five-plan page.
          'offers': [
            { '@type': 'Offer', 'name': 'Бесплатен', 'price': '0', 'priceCurrency': 'EUR', 'availability': 'https://schema.org/InStock' },
            ...SELLABLE_PLANS.map((p) => ({
              '@type': 'Offer',
              'name': p.label,
              'price': String(p.amount),
              'priceCurrency': p.currency,
              'availability': 'https://schema.org/InStock',
            })),
          ],
        },
        {
          '@type': 'FAQPage',
          'mainEntity': FAQS.map(({ q, a }) => ({
            '@type': 'Question',
            'name': q,
            'acceptedAnswer': { '@type': 'Answer', 'text': a },
          })),
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

  // Prices come from PLAN_CATALOG so the page cannot quote a number the
  // checkout and the server do not agree with.
  const teacher = annual ? PLAN_CATALOG.teacher_yearly : PLAN_CATALOG.teacher_monthly;

  const plans = [
    {
      code: null,
      name: "Бесплатен",
      price: "0",
      period: "/засекогаш",
      target: "За проба и мали часови",
      features: [
        "До 200 учесници",
        "10 анкети по настан",
        "До 5 настани",
        "Сите 8 типа активности",
        "Резултати во живо"
      ],
      button: "Започни бесплатно",
      color: "bg-white text-slate-900 border-2 border-slate-100",
      btnColor: "bg-slate-900 text-white",
      tag: "БЕЗ КАРТИЧКА",
    },
    {
      code: teacher.code,
      name: "Наставник",
      price: String(teacher.amount),
      period: annual ? "/год" : "/мес",
      target: "За еден наставник или предавач",
      features: [
        "До 500 учесници",
        "Неограничени настани и анкети",
        "AI генерирање на прашања",
        "Напредна аналитика",
        "Извоз во CSV и PDF",
        "Ко-домаќин и вградување",
        "Сопствени бои"
      ],
      button: "Избери план",
      color: "bg-white text-slate-900 border-2 border-indigo-200 shadow-xl shadow-indigo-50",
      btnColor: "bg-indigo-600 text-white",
      tag: "ПОПУЛАРНО",
      popular: true,
    },
    {
      code: 'school',
      name: "Училиште / Организација",
      price: String(PLAN_CATALOG.school.amount),
      period: "/год",
      target: "За колектив, НВО и обуки",
      features: [
        "Сè од планот Наставник",
        "Места за целиот колектив",
        "Заедничка библиотека шаблони",
        "Фактура со ЕДБ за правно лице",
        "Приоритетна поддршка",
        "Воведна обука за колективот"
      ],
      button: "Побарај понуда",
      color: "bg-slate-900 text-white",
      btnColor: "bg-emerald-500 text-white",
      tag: "ЗА ИНСТИТУЦИИ",
      // Explicit, rather than the previous `plan.name === 'Годишен'` checks
      // scattered through the card — a plan rename silently unstyled the card.
      dark: true,
    },
  ];

  const comparison = [
    { feature: "Цена / година",          mkd: "€0–€36",  menti: "€300+",        mkdWins: true },
    { feature: "Учесници (бесплатен)",   mkd: "200",      menti: "2",            mkdWins: true },
    { feature: "Македонски јазик",       mkd: "✓",        menti: "✗",            mkdWins: true },
    { feature: "AI генерирање прашања",  mkd: "✓ Pro",    menti: "✗",            mkdWins: true },
    { feature: "Анонимно гласање",       mkd: "✓",        menti: "✓",            mkdWins: false },
    { feature: "Реално-временски резулт", mkd: "✓",       menti: "✓",            mkdWins: false },
    { feature: "Рангирање & Рејтинг",    mkd: "✓",        menti: "✓ Pro",        mkdWins: true },
    { feature: "Извоз на податоци",      mkd: "✓ Pro",    menti: "✓ Pro",        mkdWins: false },
    { feature: "Локална поддршка (МК)",  mkd: "✓",        menti: "✗",            mkdWins: true },
    { feature: "Податоци во ЕУ",         mkd: "✓ Supabase EU", menti: "✗ US",    mkdWins: true },
    { feature: "Поврат во 14 дена",      mkd: "✓",        menti: "✗",            mkdWins: true },
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
          className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 font-semibold text-xs uppercase tracking-widest px-5 py-2.5 rounded-full mb-6 border border-emerald-200"
        >
          <Gift size={14} />
          Бесплатен план засекогаш — 200 учесници, без кредитна картичка
        </motion.div>
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6">Едноставни цени за секого</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
          Започнете бесплатно, без временско ограничување и без картичка. Надградете на Pro само кога ќе ви затребаат AI генерирање, напредна аналитика или брендирање.
        </p>
      </div>

      {/* Billing cycle — the saving is computed from the catalogue, so the
          badge can never advertise a discount the prices do not give. */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center gap-1 p-1.5 bg-white border-2 border-slate-100 rounded-2xl" role="group" aria-label="Период на плаќање">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            aria-pressed={!annual}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${!annual ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Месечно
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            aria-pressed={annual}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${annual ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Годишно
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${annual ? 'bg-emerald-400 text-slate-900' : 'bg-emerald-50 text-emerald-700'}`}>
              −{yearlySavingPercent()}%
            </span>
          </button>
        </div>
      </div>

      {/* Plans grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-8 rounded-[2rem] flex flex-col transition-all hover:scale-[1.02] ${plan.color}`}
          >
            {/* The tag used to be absolutely positioned at top-right, which at
                five columns on a 1440px screen sat directly on top of the plan
                name. It is part of the flow now, so it can never collide. */}
            {plan.tag && (
              <span className={`self-start mb-4 text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest ${plan.popular ? 'bg-indigo-600 text-white' : plan.dark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-200 text-slate-600'}`}>
                {plan.tag}
              </span>
            )}
            <h3 className="text-2xl font-black mb-1">{plan.name}</h3>
            <p className={`font-semibold text-xs mb-8 uppercase tracking-widest ${plan.dark ? 'text-slate-400' : 'text-slate-500'}`}>{plan.target}</p>

            <div className="flex items-baseline gap-1 mb-2">
              <span className={`text-5xl font-black ${plan.dark ? 'text-emerald-400' : 'text-slate-900'}`}>€{plan.price}</span>
              <span className={`text-lg font-semibold ${plan.dark ? 'text-slate-400' : 'text-slate-500'}`}>{plan.period}</span>
            </div>
            <p className={`text-xs font-medium mb-8 h-4 ${plan.dark ? 'text-slate-400' : 'text-slate-500'}`}>
              {plan.code === PLAN_CATALOG.teacher_yearly.code
                ? `Заштедуваш €${yearlySavingAmount()} наспроти месечно плаќање`
                : plan.code === PLAN_CATALOG.teacher_monthly.code
                  ? `€${PLAN_CATALOG.teacher_monthly.amount * 12} годишно · откажи кога сакаш`
                  : ''}
            </p>

            <ul className="space-y-4 mb-10 flex-1">
              {plan.features.map((feat, j) => (
                <li key={j} className="flex items-start gap-3 text-sm font-medium leading-snug">
                  <ShieldCheck aria-hidden="true" className={`${plan.dark ? 'text-emerald-400' : 'text-indigo-500'} shrink-0 mt-0.5`} size={18} />
                  <span className={plan.dark ? 'text-slate-300' : 'text-slate-600'}>{feat}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => goToCheckout(plan)}
              className={`w-full py-5 rounded-2xl font-semibold uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95 ${plan.btnColor}`}
            >
              {plan.button}
            </button>
          </motion.div>
        ))}
      </div>

      {/* One-off event — deliberately a different shape from the subscription
          cards. An NGO running three donor-funded webinars a year does not
          want a subscription at all, and until now the page had nothing to
          sell them: they either overpaid for a year or used the free tier and
          hit the 200-participant ceiling live, in front of an audience. */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="max-w-6xl mx-auto mt-6"
        aria-labelledby="event-plan-heading"
      >
        <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-8 flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="flex-1">
            <span className="inline-block mb-3 text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest bg-amber-100 text-amber-800">
              Без претплата
            </span>
            <h2 id="event-plan-heading" className="text-2xl font-black text-slate-900 mb-2">
              Само еден настан?
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed max-w-2xl">
              За вебинар, конференција или обука што ја правите еднаш. Ги отклучува сите Pro
              можности за 7 дена околу вашиот настан — доволно за подготовка, изведба и извоз на
              резултатите. Без обврска и без обновување.
            </p>
          </div>

          <div className="lg:w-72 shrink-0 lg:border-l lg:border-slate-100 lg:pl-8">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-black text-slate-900">€{PLAN_CATALOG.event.amount}</span>
              <span className="text-base font-semibold text-slate-500">еднократно</span>
            </div>
            <p className="text-xs font-medium text-slate-500 mb-5">
              До 500 учесници · важи 7 дена
            </p>
            <button
              onClick={() => navigate(`/checkout/${PLAN_CATALOG.event.code}`)}
              className="w-full py-4 rounded-2xl font-semibold uppercase tracking-widest text-xs bg-amber-500 text-white shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all active:scale-95"
            >
              Резервирај настан
            </button>
          </div>
        </div>
      </motion.section>

      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="max-w-3xl mx-auto mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          { icon: RotateCcw, title: "Поврат во 14 дена", sub: "Ако планот не е искористен, средствата се враќаат." },
          { icon: Gift, title: "Бесплатно засекогаш", sub: "Основниот план нема рок и не бара картичка." },
          { icon: Zap, title: "Откажи кога сакаш", sub: "Без договор. Откажувањето е со еден клик." },
        ].map(({ icon: Icon, title, sub }, i) => (
          <div key={i} className="flex items-start gap-4 bg-white rounded-3xl px-6 py-5 border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
              <Icon className="text-indigo-600" size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{title}</p>
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
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Зошто MKD Slidea?</p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900">MKD Slidea наспроти Mentimeter</h2>
          <p className="text-slate-500 font-medium mt-3">Иста функционалност. 15× пониска цена. На македонски.</p>
        </div>

        <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-100/50">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto] bg-slate-50 border-b border-slate-100">
            <div className="px-8 py-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Функција</div>
            <div className="px-8 py-5 text-xs font-semibold uppercase tracking-widest text-indigo-600 text-center min-w-[120px]">MKD Slidea</div>
            <div className="px-8 py-5 text-xs font-semibold uppercase tracking-widest text-slate-400 text-center min-w-[120px]">Mentimeter</div>
          </div>

          {comparison.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-[1fr_auto_auto] items-center border-b border-slate-50 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
            >
              <div className="px-8 py-4 text-sm font-bold text-slate-700">{row.feature}</div>
              <div className={`px-8 py-4 text-sm font-bold text-center min-w-[120px] ${row.mkdWins ? 'text-emerald-600' : 'text-slate-500'}`}>
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

      {/* FAQ — same source as the FAQPage JSON-LD above */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
        className="max-w-3xl mx-auto mt-20"
        aria-labelledby={`${faqId}-heading`}
      >
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Прашања</p>
          <h2 id={`${faqId}-heading`} className="text-3xl md:text-4xl font-black text-slate-900">
            Често поставувани прашања
          </h2>
        </div>

        <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-100/50">
          {FAQS.map(({ q, a }, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={i} className="border-b border-slate-50 last:border-0">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`${faqId}-panel-${i}`}
                    id={`${faqId}-trigger-${i}`}
                    className="w-full flex items-center justify-between gap-6 px-8 py-6 text-left hover:bg-slate-50/60 transition-colors"
                  >
                    <span className="font-black text-slate-900 text-base leading-snug">{q}</span>
                    <ChevronDown
                      size={20}
                      aria-hidden="true"
                      className={`shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </h3>
                <div
                  id={`${faqId}-panel-${i}`}
                  role="region"
                  aria-labelledby={`${faqId}-trigger-${i}`}
                  // Collapsed panels stay in the DOM: the answers are the
                  // FAQPage structured data's visible counterpart, and content
                  // removed from the DOM is not content Google can see.
                  hidden={!isOpen}
                  className="px-8 pb-6 -mt-1 text-slate-500 font-medium leading-relaxed"
                >
                  {a}
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

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
