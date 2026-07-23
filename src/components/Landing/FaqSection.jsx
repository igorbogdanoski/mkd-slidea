import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FaqSection = ({ faqItems }) => {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <section id="faq" className="bg-white py-28 border-t border-slate-100">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-black text-xs uppercase tracking-widest">
            <Sparkles size={14} /> Чести прашања
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900">Сѐ што им треба на новите корисници за да одлучат побрзо</h2>
          <p className="text-slate-500 font-bold max-w-2xl mx-auto">
            Јасни одговори за платформата, приклучувањето на учесници и типовите интеракции што можете да ги користите.
          </p>
        </div>

        <div className="grid gap-3">
          {faqItems.map((item, i) => {
            const isOpen = openFaq === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={`border rounded-[1.75rem] overflow-hidden transition-all duration-300 ${isOpen ? 'bg-white border-indigo-200 shadow-md shadow-indigo-50' : 'bg-slate-50 border-slate-200 hover:border-indigo-200'}`}
              >
                <button
                  className="w-full flex items-center justify-between gap-4 text-left px-7 py-5 cursor-pointer"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                >
                  <span className="text-base md:text-lg font-black text-slate-900">{item.question}</span>
                  <span className={`text-indigo-600 text-2xl leading-none transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-45' : ''}`}>+</span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="px-7 pb-6 text-slate-500 font-medium leading-relaxed text-[15px]">{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
