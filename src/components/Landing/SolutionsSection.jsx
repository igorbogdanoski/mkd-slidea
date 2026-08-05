import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MotionButton = motion.button;

// ─── Solutions Grid ───────────────────────────────────────────────────────────
// Each card was a click-only motion.div with no role, tabIndex or key handler,
// so four calls to action existed for mouse users and for nobody else. They
// also all went to /pricing while promising "Дознај повеќе" — the one place
// that answers nothing about the solution you just clicked. Cards are buttons
// now, and each one carries its own destination.
const SolutionsSection = ({ solutions, setView }) => {
  const navigate = useNavigate();

  const go = (sol) => {
    if (sol.path) navigate(sol.path);
    else if (sol.anchor) {
      const el = document.querySelector(sol.anchor);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else navigate(`/${sol.anchor}`);
    } else setView('pricing');
  };

  return (
    <section id="solutions" className="bg-white py-32 border-t border-slate-100" aria-labelledby="solutions-heading">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center space-y-4 mb-20">
          <h2 id="solutions-heading" className="text-4xl font-black text-slate-900">Едно решение за сите ваши потреби</h2>
          <p className="text-slate-500 font-bold max-w-2xl mx-auto">
            MKD Slidea е дизајнирана да биде вашата десна рака без разлика дали предавате во училница или водите глобален вебинар.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {solutions.map((sol, i) => (
            <MotionButton
              key={i}
              type="button"
              whileHover={{ y: -8, boxShadow: '0 24px 48px -12px rgba(99,102,241,0.18)' }}
              onClick={() => go(sol)}
              className="text-left bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 group cursor-pointer hover:bg-white transition-all"
            >
              <span className={`${sol.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {sol.icon}
              </span>
              <span className="block text-lg font-black text-slate-900 mb-3">{sol.title}</span>
              {/* Was text-slate-400 — roughly 3:1 on white, under the 4.5:1 body
                  text needs. */}
              <span className="block text-sm text-slate-500 font-medium leading-relaxed mb-6">
                {sol.desc}
              </span>
              <span className="flex items-center gap-1 text-indigo-600 font-semibold text-xs uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                Дознај повеќе <ChevronRight size={14} aria-hidden="true" />
              </span>
            </MotionButton>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionsSection;
