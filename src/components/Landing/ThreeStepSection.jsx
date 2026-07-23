import { motion } from 'framer-motion';
import { BarChart2, MousePointerClick, Layout } from 'lucide-react';

// ─── 3-Step Process ───────────────────────────────────────────────────────────
const ThreeStepSection = () => (
  <section id="how-it-works" className="bg-white py-24 border-t border-slate-100">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center space-y-3 mb-16">
        <h2 className="text-4xl font-black text-slate-900">Едноставно како 1 — 2 — 3</h2>
        <p className="text-slate-500 font-bold max-w-xl mx-auto">Од идеја до интерактивна презентација за помалку од 2 минути.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {/* Connector line */}
        <div className="hidden md:block absolute top-12 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-0.5 bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-200" />
        {[
          {
            step: '01',
            icon: <Layout className="w-7 h-7" />,
            title: 'Креирај',
            desc: 'Додај прашања — анкети, квизови, облак со зборови, Q&A. Без инсталација, директно во прелистувачот.',
            color: 'bg-indigo-600',
            light: 'bg-indigo-50',
          },
          {
            step: '02',
            icon: <MousePointerClick className="w-7 h-7" />,
            title: 'Прикажи и собери одговори',
            desc: 'Учесниците се приклучуваат со код. Одговорите пристигнуваат во реално време — без апликација.',
            color: 'bg-violet-600',
            light: 'bg-violet-50',
          },
          {
            step: '03',
            icon: <BarChart2 className="w-7 h-7" />,
            title: 'Анализирај',
            desc: 'Извези ги резултатите во Excel, PDF или погледни ги статистиките директно по настанот.',
            color: 'bg-emerald-600',
            light: 'bg-emerald-50',
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="relative bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 flex flex-col gap-6"
          >
            <div className="flex items-center gap-4">
              <div className={`${item.color} text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                {item.icon}
              </div>
              <span className="text-5xl font-black text-slate-100">{item.step}</span>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ThreeStepSection;
