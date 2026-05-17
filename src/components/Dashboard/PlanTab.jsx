import React from 'react';
import { motion } from 'framer-motion';
import AiUsageWidget from '../AiUsageWidget';

const PLAN_INFO = {
  free:      { name: 'Бесплатен',     price: '€0',  period: 'Засекогаш',  participants: '200', polls: '3', events: '5' },
  basic:     { name: 'Бесплатен',     price: '€0',  period: 'Засекогаш',  participants: '200', polls: '3', events: '5' },
  monthly:   { name: 'Месечен',       price: '€5',  period: '/месец',     participants: '∞',   polls: '∞', events: '∞' },
  quarterly: { name: 'Квартален',     price: '€10', period: '/квартал',   participants: '∞',   polls: '∞', events: '∞' },
  semester:  { name: 'Семестар',      price: '€15', period: '/семестар',  participants: '∞',   polls: '∞', events: '∞' },
  yearly:    { name: 'Годишен',       price: '€20', period: '/година',    participants: '∞',   polls: '∞', events: '∞' },
  pro:       { name: 'PRO',           price: '€20', period: '/година',    participants: '∞',   polls: '∞', events: '∞' },
  admin:     { name: 'Администратор', price: '—',   period: 'Интерен',    participants: '∞',   polls: '∞', events: '∞' },
};

const PlanTab = ({ user, setView, setActiveTab }) => {
  const currentPlan = PLAN_INFO[user?.plan] || PLAN_INFO.free;
  const isPro = !['basic', 'free', undefined, null].includes(user?.plan);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12 max-w-5xl mx-auto">
      <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Мој План</h2>

      <div className="bg-white rounded-[3rem] border-2 border-slate-100 p-12 relative overflow-hidden mb-12 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">Активен План</span>
            <h3 className="text-4xl font-black text-slate-900 mb-2">{currentPlan.name}</h3>
            <p className="text-slate-400 font-bold">
              {isPro ? 'Неограничен пристап до сите функции.' : 'Вашиот план е секогаш бесплатен за наставници.'}
            </p>
          </div>
          <div className="text-left md:text-right">
            <div className="text-5xl font-black text-slate-900 mb-2">{currentPlan.price}</div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{currentPlan.period}</p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[80px] -z-10 -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Учесници', value: currentPlan.participants },
          { label: 'Анкети',   value: currentPlan.polls },
          { label: 'Настани',  value: currentPlan.events },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{stat.label}</p>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-3xl font-black text-slate-900">{stat.value}</span>
              {stat.value !== '∞' && <span className="text-slate-300 font-bold">/ {stat.value}</span>}
            </div>
            <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${isPro ? 'bg-emerald-500 w-1/4' : 'bg-indigo-600 w-full'}`} />
            </div>
          </div>
        ))}
      </div>

      <AiUsageWidget user={user} onUpgrade={() => setView('pricing')} isPro={isPro} />

      {!isPro && (
        <div className="mt-8 bg-slate-900 p-12 rounded-[3.5rem] flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-2xl shadow-indigo-100">
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
      )}
    </motion.div>
  );
};

export default PlanTab;
