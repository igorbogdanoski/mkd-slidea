import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Wand2, ArrowRight, Check, Loader2 } from 'lucide-react';

const AIAssistantModal = ({ isOpen, onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [generating, setLoading] = useState(false);
  const [type, setType] = useState('quiz');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    
    // Симулираме повикување на AI (Gemini/OpenAI)
    // Во реална верзија овде ќе се повика API
    setTimeout(() => {
      const mockResult = {
        question: `AI Генерирано: ${prompt}`,
        type: type,
        is_quiz: type === 'quiz',
        options: type === 'quiz' || type === 'poll' ? [
          { text: 'Опција А (Точна)', is_correct: true },
          { text: 'Опција Б', is_correct: false },
          { text: 'Опција В', is_correct: false },
        ] : []
      };
      
      onGenerate(mockResult);
      setLoading(false);
      setPrompt('');
      onClose();
    }, 2000);
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
                <label className="block text-sm font-black text-slate-700 mb-4">Што сакате да генерирате денес?</label>
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
