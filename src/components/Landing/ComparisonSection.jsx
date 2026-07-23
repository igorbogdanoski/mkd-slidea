import { motion } from 'framer-motion';
import { Zap, CheckCircle2, XCircle } from 'lucide-react';

// ─── Comparison Section (vs. competitors) ─────────────────────────────────────
const ComparisonSection = () => (
  <section className="py-24 bg-white border-t border-slate-100">
    <div className="max-w-5xl mx-auto px-6">
      <div className="text-center space-y-3 mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-xs uppercase tracking-widest">
          <Zap size={13} /> Зошто MKD Slidea?
        </div>
        <h2 className="text-4xl font-black text-slate-900">Споредба со конкурентите</h2>
        <p className="text-slate-500 font-bold max-w-xl mx-auto">Направена специјално за македонскиот пазар — со функции кои другите ги немаат.</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[2rem] border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left p-5 font-black text-slate-500 text-xs uppercase tracking-widest w-[38%]">Функционалност</th>
              <th className="p-5 text-center w-[20%]">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center"><Zap size={14} className="text-white" /></div>
                  <span className="font-black text-indigo-600 text-sm">MKD Slidea</span>
                </div>
              </th>
              <th className="p-5 text-center w-[20%]">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 font-black text-xs">M</div>
                  <span className="font-black text-slate-400 text-sm">Mentimeter</span>
                </div>
              </th>
              <th className="p-5 text-center w-[20%]">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 font-black text-xs">K</div>
                  <span className="font-black text-slate-400 text-sm">Kahoot</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              { feature: 'Целосно на македонски јазик', mkd: true, menti: false, kahoot: false, highlight: true },
              { feature: 'Бесплатно до 200 учесници', mkd: true, menti: false, kahoot: 'partial' },
              { feature: 'Без апликација за учесниците', mkd: true, menti: true, kahoot: true },
              { feature: 'Word Cloud активност', mkd: true, menti: true, kahoot: false },
              { feature: 'Отворени прашања (Open Q)', mkd: true, menti: true, kahoot: false },
              { feature: 'Q&A со upvote од учесниците', mkd: true, menti: true, kahoot: false },
              { feature: 'Квизови со ранг листа', mkd: true, menti: false, kahoot: true },
              { feature: 'Модерација на одговори', mkd: true, menti: false, kahoot: false, highlight: true },
              { feature: 'Офлајн резервна копија (гласови)', mkd: true, menti: false, kahoot: false },
              { feature: 'CSV / PDF извоз на резултати', mkd: true, menti: 'partial', kahoot: 'partial' },
              { feature: 'Поддршка на македонски јазик', mkd: true, menti: false, kahoot: false, highlight: true },
            ].map((row, i) => {
              const Cell = ({ val }) => val === true
                ? <CheckCircle2 size={20} className="text-emerald-500 mx-auto" />
                : val === 'partial'
                ? <span className="text-amber-500 font-black text-xs mx-auto block text-center">Делумно</span>
                : <XCircle size={20} className="text-slate-300 mx-auto" />;
              return (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className={`border-b border-slate-100 last:border-0 ${row.highlight ? 'bg-indigo-50/60' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                >
                  <td className="p-4 pl-5 font-bold text-slate-700 text-[13px]">
                    {row.highlight && <span className="inline-block w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2 mb-0.5" />}
                    {row.feature}
                  </td>
                  <td className="p-4 text-center"><Cell val={row.mkd} /></td>
                  <td className="p-4 text-center"><Cell val={row.menti} /></td>
                  <td className="p-4 text-center"><Cell val={row.kahoot} /></td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-center text-slate-400 text-xs font-bold mt-5">* Споредбата е базирана на јавно достапните бесплатни планови (јуни 2026)</p>
    </div>
  </section>
);

export default ComparisonSection;
