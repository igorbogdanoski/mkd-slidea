import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, Zap, Star, Trophy, Users } from 'lucide-react';

const Pricing = ({ setView }) => {
  const plans = [
    {
      name: "Бесплатен",
      price: "0",
      period: "/засекогаш",
      target: "За наставници",
      features: [
        "До 50 учесници",
        "3 анкети по настан",
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
      button: "Избери Месечно",
      color: "bg-white text-slate-900 border-2 border-slate-100",
      btnColor: "bg-indigo-600 text-white",
      tag: "FLEX"
    },
    {
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
      button: "Избери Квартално",
      color: "bg-white text-slate-900 border-2 border-slate-100",
      btnColor: "bg-indigo-600 text-white",
      tag: "SAVER"
    },
    {
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
      button: "Избери Семестрално",
      color: "bg-white text-slate-900 border-2 border-indigo-100 shadow-xl shadow-indigo-50",
      btnColor: "bg-indigo-600 text-white",
      tag: "ПОПУЛАРНО",
      popular: true
    },
    {
      name: "Годишен",
      price: "20",
      period: "/год",
      target: "Професионален",
      features: [
        "Неограничени учесници",
        "Најдобра вредност",
        "Сопствено брендирање",
        "Експорт на податоци",
        "PowerPoint Додаток"
      ],
      button: "Активирај Годишно",
      color: "bg-slate-900 text-white",
      btnColor: "bg-emerald-500 text-white",
      tag: "НАЈДОБРА ПОНУДА"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-32 pb-24 px-6 min-h-screen bg-[#F8FAFC]"
    >
      <div className="max-w-7xl mx-auto text-center mb-20">
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6">Едноставни цени за секого</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
          Изберете го планот што најдобро одговара на вашите потреби. Од мали училници до големи конференции.
        </p>
      </div>

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
            <p className={`font-bold text-xs mb-8 uppercase tracking-widest ${plan.name === 'Годишен' ? 'text-slate-400' : 'text-slate-400'}`}>{plan.target}</p>
            
            <div className="flex items-baseline gap-1 mb-10">
              <span className={`text-5xl font-black ${plan.name === 'Годишен' ? 'text-emerald-400' : 'text-slate-900'}`}>€{plan.price}</span>
              <span className="text-lg font-bold opacity-40">{plan.period}</span>
            </div>

            <ul className="space-y-5 mb-12 flex-1">
              {plan.features.map((feat, j) => (
                <li key={j} className="flex items-start gap-3 text-sm font-bold leading-tight">
                  <ShieldCheck className={`${plan.name === 'Годишен' ? 'text-emerald-400' : 'text-indigo-500'} shrink-0`} size={18} />
                  <span className={plan.name === 'Годишен' ? 'text-slate-300' : 'text-slate-600'}>{feat}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => setView('host')}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95 ${plan.btnColor}`}
            >
              {plan.button}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Comparison Table Link */}
      <div className="mt-20 text-center">
        <p className="text-slate-400 font-bold mb-4 uppercase tracking-widest text-xs">Имате специфични потреби?</p>
        <button className="text-indigo-600 font-black flex items-center gap-2 mx-auto hover:gap-3 transition-all">
          Контактирајте нè за Enterprise решение <ArrowRight size={18} />
        </button>
      </div>
    </motion.div>
  );
};

export default Pricing;
