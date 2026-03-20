import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Wand2, ArrowRight, Check, Loader2, Brain, ListTree, Lock } from 'lucide-react';

const AIAssistantModal = ({ isOpen, onClose, onGenerate, user }) => {
  const [prompt, setPrompt] = useState('');
  const [generating, setLoading] = useState(false);
  const [type, setType] = useState('quiz');
  const [strategy, setStrategy] = useState('default');

  const isPro = user?.plan === 'pro' || user?.plan === 'semester' || user?.role === 'admin';

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, type, strategy }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate');
      }

      const result = await response.json();
      
      onGenerate(result);
      setLoading(false);
      setPrompt('');
      onClose();
    } catch (err) {
      console.error("AI Generation failed:", err);
      alert(err.message || "Грешка при генерирање со AI. Проверете го вашиот клуч.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl overflow-hidden"
          >
            {/* Background Sparkles */}
            <div className="absolute top-0 right-0 p-12 -z-10 opacity-10">
              <Sparkles size={200} className="text-indigo-600 animate-pulse" />
            </div>

            <button
              onClick={onClose}
              className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100">
                <Wand2 className="text-white w-6 h-6" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900">AI Асистент</h3>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Магија во една секунда</p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <label className="block text-sm font-black text-slate-700 mb-4">Избери Мод на Разум (Prompt Strategy)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'default', label: 'Стандарден', icon: <Sparkles size={16} />, locked: false },
                    { id: 'cot', label: 'CoT (Чекор-по-чекор)', icon: <Brain size={16} />, locked: !isPro },
                    { id: 'tot', label: 'ToT (Длабока Анализа)', icon: <ListTree size={16} />, locked: !isPro },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => !s.locked && setStrategy(s.id)}
                      className={`relative py-4 px-4 rounded-2xl font-black text-xs transition-all border-2 flex items-center justify-center gap-2 ${
                        strategy === s.id 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                          : s.locked ? 'border-slate-50 bg-slate-50 text-slate-300 cursor-not-allowed' : 'border-slate-100 text-slate-400 hover:border-indigo-200'
                      }`}
                    >
                      {s.icon}
                      {s.label}
                      {s.locked && <Lock size={12} className="absolute top-2 right-2" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-700 mb-4">Тип на активност</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'quiz', label: 'Квиз' },
                    { id: 'poll', label: 'Анкета' },
                    { id: 'wordcloud', label: 'Word Cloud' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setType(t.id)}
                      className={`py-3 px-4 rounded-2xl font-black text-sm transition-all border-2 ${
                        type === t.id 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                          : 'border-slate-100 text-slate-400 hover:border-indigo-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-700 mb-4">Внесете тема или концепт</label>
                <textarea 
                  placeholder="Пр: Главни градови во Европа, Основи на вештачка интелигенција, Фидбек за состанок..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-6 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all min-h-[150px] resize-none text-lg"
                />
              </div>

              <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="bg-white p-2 rounded-xl shadow-sm text-indigo-600">
                  <Sparkles size={20} />
                </div>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                  Нашиот AI модел ќе ги креира најдобрите прашања и опции за вашата публика на македонски јазик.
                </p>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={!prompt.trim() || generating}
                className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl shadow-indigo-200"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Генерирам магија...
                  </>
                ) : (
                  <>
                    Креирај веднаш <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AIAssistantModal;
