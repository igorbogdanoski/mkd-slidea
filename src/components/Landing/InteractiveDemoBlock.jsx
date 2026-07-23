import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, PieChart, Trophy } from 'lucide-react';
import { demoPollData, demoQuizOptions } from '../../data/landingContent';

// ─── Interactive hero demo (word cloud / poll / quiz tabs) ────────────────────
const InteractiveDemoBlock = () => {
  const [activeDemo, setActiveDemo] = useState('wordcloud');
  const [demoValue, setDemoValue] = useState('');
  const autoWords = [
    'Интеракција', 'Учење', 'Квиз', 'Забава', 'Скопје', 'Дигитално',
    'Анкета', 'Тимска работа', 'Иновација', 'Едукација', 'Резултати',
    'Презентација', 'Активност', 'Знаење', 'Соработка', 'Напредок',
  ];
  const [demoWords, setDemoWords] = useState(
    autoWords.slice(0, 6).map((text, i) => ({ text, size: [40, 30, 25, 35, 20, 28][i] }))
  );

  useEffect(() => {
    const remaining = [...autoWords.slice(6)];
    let idx = 0;
    const timer = setInterval(() => {
      const word = remaining[idx % remaining.length];
      idx++;
      setDemoWords(prev => {
        if (prev.find(w => w.text === word)) return prev;
        const updated = [...prev, { text: word, size: Math.random() * 18 + 20 }];
        return updated.length > 14 ? updated.slice(1) : updated;
      });
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  const addWord = (e) => {
    if (e.key === 'Enter' && demoValue.trim()) {
      setDemoWords(prev => [...prev, { text: demoValue.trim(), size: Math.random() * 20 + 20 }]);
      setDemoValue('');
    }
  };

  const demoTitle = {
    wordcloud: 'Демо: Облак со зборови',
    poll: 'Демо: Анкета во живо',
    quiz: 'Демо: Квиз прашање',
  }[activeDemo];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      className="relative"
      id="interactive-demo"
    >
      <div className="bg-white p-2 rounded-[4rem] shadow-[0_32px_64px_-16px_rgba(79,70,229,0.15)] border border-slate-100">
        <div className="bg-slate-50 rounded-[3.5rem] overflow-hidden p-8 md:p-12 relative min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                {activeDemo === 'wordcloud' ? <Cloud size={20} /> : activeDemo === 'poll' ? <PieChart size={20} /> : <Trophy size={20} />}
              </div>
              <span className="font-black text-slate-400 uppercase tracking-widest text-xs">{demoTitle}</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-slate-200" />)}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: 'wordcloud', label: 'Word Cloud' },
              { id: 'poll', label: 'Анкета' },
              { id: 'quiz', label: 'Квиз' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveDemo(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-black transition-all ${activeDemo === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeDemo === 'wordcloud' && (
            <>
              <div className="flex-1 flex flex-wrap items-center justify-center gap-4 py-8 content-center">
                <AnimatePresence>
                  {demoWords.map((word, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ fontSize: word.size, fontWeight: 900 }}
                      className="text-indigo-600/80 hover:text-indigo-600 cursor-default transition-colors"
                    >
                      {word.text}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>

              <div className="mt-auto bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/50 shadow-xl">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Пробај: Внеси збор и притисни Enter</p>
                <input
                  type="text"
                  placeholder="Вашиот збор..."
                  value={demoValue}
                  onChange={(e) => setDemoValue(e.target.value)}
                  onKeyDown={addWord}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                />
              </div>
            </>
          )}

          {activeDemo === 'poll' && (
            <div className="flex-1 flex flex-col justify-center gap-5 py-8">
              <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Прашање</p>
                <h3 className="text-2xl font-black text-slate-900 mb-6">Дали би користеле интерактивни анкети на следната презентација?</h3>
                <div className="space-y-4">
                  {demoPollData.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-2 text-sm font-black text-slate-700">
                        <span>{item.label}</span>
                        <span>{item.value}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-5 text-sm font-bold text-indigo-700">
                Одговорите пристигнуваат веднаш и се прикажуваат пред целата публика во живо.
              </div>
            </div>
          )}

          {activeDemo === 'quiz' && (
            <div className="flex-1 flex flex-col justify-center py-8">
              <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm max-w-xl mx-auto w-full">
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Квиз прашање</p>
                <h3 className="text-2xl font-black text-slate-900 mb-6">Кој програмски јазик најчесто се користи во AI/ML проекти?</h3>
                <div className="space-y-3">
                  {demoQuizOptions.map((option) => (
                    <div
                      key={option.label}
                      className={`rounded-2xl border px-5 py-4 font-black text-sm ${option.correct ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 text-center text-sm font-bold text-slate-500">
                Квизови со точни одговори, рангирање и моментални резултати.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Elements */}
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute -top-10 -right-10 bg-white p-6 rounded-3xl shadow-xl border border-slate-50 z-20"
      >
        <PieChart size={32} className="text-emerald-500" />
      </motion.div>
      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        className="absolute -bottom-6 -left-10 bg-white p-6 rounded-3xl shadow-xl border border-slate-50 z-20"
      >
        <Trophy size={32} className="text-amber-500" />
      </motion.div>
    </motion.div>
  );
};

export default InteractiveDemoBlock;
