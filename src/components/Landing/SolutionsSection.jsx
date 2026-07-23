import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

// ─── Solutions Grid ───────────────────────────────────────────────────────────
const SolutionsSection = ({ solutions, setView }) => (
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
);

export default SolutionsSection;
