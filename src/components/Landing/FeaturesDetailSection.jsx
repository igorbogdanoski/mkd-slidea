import { PieChart, MessageSquare, Trophy, CheckCircle2, Star } from 'lucide-react';

// ─── Features Detail ──────────────────────────────────────────────────────────
const FeaturesDetailSection = ({ setView }) => (
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
);

export default FeaturesDetailSection;
