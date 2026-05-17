import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PATHS = [
  {
    id: 'templates',
    emoji: '🎨',
    title: '35 готови шаблони',
    desc: 'Избери шаблон за твојот предмет и почни за 30 секунди',
    action: 'templates',
    color: 'from-amber-500 to-orange-500',
    bg: 'hover:bg-amber-50 border-amber-200 hover:border-amber-400',
  },
  {
    id: 'ai',
    emoji: '✨',
    title: 'AI генерирај квиз',
    desc: 'Опиши ја темата и AI ќе ти создаде прашања',
    action: 'ai',
    color: 'from-indigo-500 to-violet-500',
    bg: 'hover:bg-indigo-50 border-indigo-200 hover:border-indigo-400',
  },
  {
    id: 'import',
    emoji: '📎',
    title: 'Увези PowerPoint',
    desc: 'Претвори ги постоечките слајдови во интерактивни прашања',
    action: 'import',
    color: 'from-violet-500 to-pink-500',
    bg: 'hover:bg-violet-50 border-violet-200 hover:border-violet-400',
  },
  {
    id: 'blank',
    emoji: '➕',
    title: 'Почни со празен',
    desc: 'Додај прашања рачно, во твое темпо',
    action: null,
    color: 'from-slate-400 to-slate-500',
    bg: 'hover:bg-slate-50 border-slate-200 hover:border-slate-400',
  },
];

const Onboarding = ({ user }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const firstName = user?.name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'Наставник';

  const choose = (action) => {
    localStorage.setItem('onboarding_v1_done', 'true');
    if (action) localStorage.setItem('pending_host_action', action);
    navigate('/host');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {step === 1 ? (
          <div className="text-center">
            <div className="text-8xl mb-8 animate-bounce">👋</div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
              Здраво, {firstName}!
            </h1>
            <p className="text-xl text-slate-500 font-bold mb-12 max-w-md mx-auto">
              Ајде да го создадеме твојот прв интерактивен час за помалку од 2 минути.
            </p>
            <button
              onClick={() => setStep(2)}
              className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 active:scale-95"
            >
              Продолжи →
            </button>
            <p className="mt-6 text-sm text-slate-400 font-bold">Без кредитна картичка · Бесплатно засекогаш</p>
          </div>
        ) : (
          <div>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-slate-900 mb-2">Како сакаш да започнеш?</h2>
              <p className="text-slate-500 font-bold">Секогаш можеш да ги промениш активностите подоцна</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PATHS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => choose(p.action)}
                  className={`group flex flex-col items-start gap-3 p-6 bg-white rounded-[1.5rem] border-2 transition-all text-left shadow-sm hover:shadow-md active:scale-95 ${p.bg}`}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center text-2xl shadow-sm`}>
                    {p.emoji}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-lg">{p.title}</p>
                    <p className="text-slate-500 font-bold text-sm mt-0.5">{p.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="mt-8 mx-auto block text-sm text-slate-400 font-bold hover:text-slate-600 transition-colors"
            >
              ← Назад
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
