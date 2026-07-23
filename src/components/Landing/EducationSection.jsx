import { motion } from 'framer-motion';
import {
  Cloud, PieChart, MessageSquare, Trophy, CheckCircle2,
  BookOpen, GraduationCap, School, BarChart2,
} from 'lucide-react';

// ─── Education Section (incl. activity type showcase) ─────────────────────────
const EducationSection = () => (
  <section id="education" className="py-32 bg-gradient-to-b from-indigo-50 to-white">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs uppercase tracking-widest">
          <GraduationCap size={14} /> За образование
        </div>
        <h2 className="text-5xl font-black text-slate-900 leading-tight">
          Ангажирај ги твоите<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">ученици и студенти</span>
        </h2>
        <p className="text-slate-500 font-bold max-w-2xl mx-auto text-lg">
          Совршена за основни и средни училишта, факултети и обуки. Направи ја секоја лекција незаборавна.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        {/* Left: big feature card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-indigo-700 to-violet-800 rounded-[3rem] p-12 shadow-2xl shadow-indigo-200 flex flex-col gap-8"
        >
          <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center">
            <School className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white mb-4">Секој ученик добива глас</h3>
            <p className="text-indigo-200 font-medium leading-relaxed mb-6 text-[15px]">
              Анонимното гласање ги охрабрува поплашливите ученици да учествуваат. Сите се чувствуваат безбедно да одговорат — без страв од грешка.
            </p>
            <ul className="space-y-3">
              {[
                'Анонимни одговори — без притисок',
                'Квизови со бодување и ранг листа',
                'Q&A: учениците поставуваат прашања анонимно',
                'Работи на секој уред — без апликација',
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-bold text-white/90">
                  <div className="bg-white/20 p-1 rounded-full flex-shrink-0">
                    <CheckCircle2 size={14} className="text-emerald-300" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Right: 2 smaller cards */}
        <div className="flex flex-col gap-8">
          {[
            {
              icon: <BookOpen className="w-6 h-6 text-violet-600" />,
              bg: 'bg-violet-50',
              title: 'Провери го знаењето — веднаш',
              desc: 'Брза анкета или квиз по секоја лекција ти покажува кој концепт не е разбран — пред испитот, не после.',
            },
            {
              icon: <BarChart2 className="w-6 h-6 text-amber-600" />,
              bg: 'bg-amber-50',
              title: 'Резултати во реално време',
              desc: 'Графиконите се ажурираат пред очите на сите. Учениците го гледаат мислењето на целото одделение инстантно.',
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex gap-6 items-start"
            >
              <div className={`${card.bg} w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0`}>
                {card.icon}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{card.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Activity type showcase — Show don't tell */}
      <div className="mt-8">
        <p className="text-center text-slate-400 font-black text-xs uppercase tracking-widest mb-8">Типови активности — изберете го вистинскиот формат</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              type: 'Word Cloud',
              color: 'from-indigo-500 to-violet-500',
              icon: <Cloud size={18} className="text-white" />,
              desc: 'Учесниците внесуваат зборови — се гради облак во живо',
              preview: (
                <div className="flex flex-wrap gap-1.5 justify-center items-center h-20 overflow-hidden">
                  {['Учење','Квиз','Забава','Знаење','Тим'].map((w,i)=>(
                    <span key={i} style={{fontSize: [18,14,20,12,16][i]}} className="font-black text-indigo-600/80">{w}</span>
                  ))}
                </div>
              ),
            },
            {
              type: 'Анкета',
              color: 'from-emerald-500 to-teal-500',
              icon: <PieChart size={18} className="text-white" />,
              desc: 'Повеќекратен избор со резултати во реално време',
              preview: (
                <div className="space-y-1.5 w-full">
                  {[['Да, веднаш', 64], ['Можеби', 24], ['Не', 12]].map(([l,v])=>(
                    <div key={l} className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{width:`${v}%`}} />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 w-6">{v}%</span>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              type: 'Квиз',
              color: 'from-amber-500 to-orange-500',
              icon: <Trophy size={18} className="text-white" />,
              desc: 'Натпревар со точни одговори и ранг листа',
              preview: (
                <div className="space-y-1.5 w-full">
                  {[['Python','✓',true],['Java','✗',false],['C++','✗',false]].map(([l,m,c])=>(
                    <div key={l} className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-black ${c ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      <span>{l}</span><span>{m}</span>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              type: 'Q&A',
              color: 'from-rose-500 to-pink-500',
              icon: <MessageSquare size={18} className="text-white" />,
              desc: 'Анонимни прашања со upvote од публиката',
              preview: (
                <div className="space-y-1.5 w-full">
                  {[['Кога следен квиз?',12],['Може ли повторување?',8]].map(([q,v])=>(
                    <div key={q} className="flex items-center justify-between bg-slate-100 rounded-lg px-3 py-1.5">
                      <span className="text-[10px] font-bold text-slate-600 truncate flex-1">{q}</span>
                      <span className="text-[10px] font-black text-rose-600 ml-2">▲{v}</span>
                    </div>
                  ))}
                </div>
              ),
            },
          ].map((act, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-all"
            >
              <div className={`bg-gradient-to-r ${act.color} px-5 py-4 flex items-center gap-2`}>
                <div className="bg-white/20 w-7 h-7 rounded-lg flex items-center justify-center">{act.icon}</div>
                <span className="font-black text-white text-sm">{act.type}</span>
              </div>
              <div className="p-5">
                <div className="mb-4">{act.preview}</div>
                <p className="text-[11px] text-slate-400 font-bold leading-snug">{act.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default EducationSection;
