import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Save, CheckCircle2, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MathSymbolPicker from './MathSymbolPicker';

const CreateQuizModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [question, setQuestion] = useState('');
  const questionRef = useRef(null);
  const [options, setOptions] = useState([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false }
  ]);

  useEffect(() => {
    if (initialData) {
      setQuestion(initialData.question || '');
      if (initialData.options && initialData.options.length > 0) {
        setOptions(initialData.options.map(opt => ({
          text: opt.text || opt,
          isCorrect: opt.is_correct || false
        })));
      }
    } else {
      setQuestion('');
      setOptions([
        { text: '', isCorrect: true },
        { text: '', isCorrect: false }
      ]);
    }
  }, [initialData, isOpen]);

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, { text: '', isCorrect: false }]);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      // If we removed the correct one, make the first one correct
      if (options[index].isCorrect) {
        newOptions[0].isCorrect = true;
      }
      setOptions(newOptions);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index].text = value;
    setOptions(newOptions);
  };

  const setCorrectOption = (index) => {
    setOptions(options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index
    })));
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!question.trim() || options.some(opt => !opt.text.trim())) return;
    setIsSaving(true);
    try {
      await onSave({
        question: question.slice(0, 300),
        options: options.map(opt => ({ text: opt.text.slice(0, 150), votes: 0, is_correct: opt.isCorrect })),
        is_quiz: true,
        active: true
      });
    } finally {
      setIsSaving(false);
      setQuestion('');
      setOptions([{ text: '', isCorrect: true }, { text: '', isCorrect: false }]);
    }
  };

  const insertSymbol = (symbol) => {
    const input = questionRef.current;
    if (!input) {
      setQuestion((current) => `${current}${symbol}`);
      return;
    }

    const start = input.selectionStart ?? question.length;
    const end = input.selectionEnd ?? question.length;
    const next = `${question.slice(0, start)}${symbol}${question.slice(end)}`;
    setQuestion(next);

    requestAnimationFrame(() => {
      input.focus();
      const cursor = start + symbol.length;
      input.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black">{initialData ? 'Измени квиз прашање' : 'Ново Квиз Прашање'}</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Прашање</label>
                <textarea
                  ref={questionRef}
                  rows={3}
                  placeholder="Пр. Ако x² + 4 = 13, колку е x?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all resize-none"
                />
                <div className="mt-3">
                  <MathSymbolPicker onInsert={insertSymbol} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Опции (избери точен одговор)</label>
                <div className="space-y-3">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <button 
                        onClick={() => setCorrectOption(i)}
                        className={`p-3 rounded-xl transition-all ${opt.isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-300 hover:text-slate-400'}`}
                      >
                        <CheckCircle2 className="w-6 h-6" />
                      </button>
                      <input 
                        type="text" 
                        placeholder={`Опција ${i + 1}`}
                        value={opt.text}
                        onChange={(e) => handleOptionChange(i, e.target.value)}
                        className={`flex-1 border-2 rounded-2xl px-6 py-3 font-bold outline-none transition-all ${opt.isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'bg-slate-50 border-slate-100 focus:border-indigo-600 focus:bg-white'}`}
                      />
                      {options.length > 2 && (
                        <button 
                          onClick={() => removeOption(i)}
                          className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {options.length < 6 && (
                  <button 
                    onClick={addOption}
                    className="mt-4 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 px-1"
                  >
                    <Plus className="w-4 h-4" /> Додај опција
                  </button>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving || !question.trim() || options.some(opt => !opt.text.trim())}
                className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-200 active:scale-[0.98] mt-4"
              >
                <Save className="w-6 h-6" /> {isSaving ? 'Се зачувува...' : initialData ? 'Зачувај промени' : 'Зачувај квиз'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateQuizModal;
