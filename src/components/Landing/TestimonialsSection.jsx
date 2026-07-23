import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TestimonialsSection = ({ testimonials }) => (
  <section className="bg-slate-50 py-24 border-t border-slate-100">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center space-y-3 mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-black text-xs uppercase tracking-widest">
          <Star size={13} className="fill-amber-400 text-amber-400" /> Искуства на корисници
        </div>
        <h2 className="text-4xl font-black text-slate-900">Наставниците веруваат во MKD Slidea</h2>
        <p className="text-slate-500 font-bold max-w-xl mx-auto">Погледнете зошто педагозите и тренерите ширум Македонија ја избираат нашата платформа.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
            className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col gap-6 hover:shadow-md transition-shadow"
          >
            {/* Stars */}
            <div className="flex gap-1">
              {Array.from({ length: t.stars }).map((_, s) => (
                <Star key={s} size={16} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            {/* Quote */}
            <p className="text-slate-700 font-medium leading-relaxed flex-1 text-[15px]">
              „{t.text}"
            </p>
            {/* Author */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 ${t.color}`}>
                {t.initials}
              </div>
              <div>
                <div className="font-black text-slate-900 text-sm">{t.name}</div>
                <div className="text-xs font-bold text-slate-400">{t.role}</div>
                <div className="text-xs font-bold text-indigo-500">{t.school}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
