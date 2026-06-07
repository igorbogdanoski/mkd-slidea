import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Save, CheckCircle2, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MathSymbolPicker from './MathSymbolPicker';
import { applyInsertion } from '../lib/insertAtCursor';

const CreateQuizModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [question, setQuestion] = useState('');
  const questionRef = useRef(null);
  const optionRefs = useRef({});
  const activeFieldRef = useRef({ kind: 'question' });
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
    if (options.length < 8) {
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
    const target = activeFieldRef.current || { kind: 'question' };
    if (target.kind === 'option' && typeof target.index === 'number') {
      const idx = target.index;
      const input = optionRefs.current[idx];
      const current = options[idx]?.text ?? '';
      const { next, caret } = applyInsertion(current, symbol, input);
      const newOpts = [...options];
      newOpts[idx] = { ...newOpts[idx], text: next };
      setOptions(newOpts);
      requestAnimationFrame(() => {
        try { input?.focus(); input?.setSelectionRange(caret, caret); } catch { /* ignore */ }
      });
      return;
    }
    const input = questionRef.current;
    const { next, caret } = applyInsertion(question, symbol, input);
    setQuestion(next);
    requestAnimationFrame(() => {
      try { input?.focus(); input?.setSelectionRange(caret, caret); } catch { /* ignore */ }
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
            role="dialog" aria-modal="true" aria-label="Создај квиз"
            className="relative bg-white rounded-2xl max-w-xl w-full shadow-2xl flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                  <Trophy className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black">{initialData ? 'Измени квиз прашање' : 'Ново квиз прашање'}</h3>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-7 py-5 space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Прашање</label>
                <textarea
                  ref={questionRef}
                  rows={2}
                  placeholder="Пр. Ако x² + 4 = 13, колку е x?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onFocus={() => { activeFieldRef.current = { kind: 'question' }; }}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-sm focus:border-indigo-600 focus:bg-white outline-none transition-all resize-none"
                />
                <div className="mt-3">
                  <MathSymbolPicker onInsert={insertSymbol} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Опции — клик на ✓ за точен одговор</label>
                  <span className="text-xs font-bold text-slate-300">{options.length}/8</span>
                </div>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <button
                        onClick={() => setCorrectOption(i)}
                        className={`p-2 rounded-xl transition-all shrink-0 ${opt.isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-300 hover:text-slate-400'}`}
                        title={opt.isCorrect ? 'Точен одговор' : 'Означи како точен'}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <input
                        type="text"
                        ref={(el) => { if (el) optionRefs.current[i] = el; else delete optionRefs.current[i]; }}
                        placeholder={`Опција ${i + 1}`}
                        value={opt.text}
                        onChange={(e) => handleOptionChange(i, e.target.value)}
                        onFocus={() => { activeFieldRef.current = { kind: 'option', index: i }; }}
                        className={`flex-1 border-2 rounded-xl px-4 py-2.5 font-bold text-sm outline-none transition-all ${opt.isCorrect ? 'border-emerald-300 bg-emerald-50/40' : 'bg-slate-50 border-slate-100 focus:border-indigo-600 focus:bg-white'}`}
                      />
                      {options.length > 2 && (
                        <button onClick={() => removeOption(i)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {options.length < 8 && (
                  <button onClick={addOption} className="mt-3 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 px-1">
                    <Plus className="w-4 h-4" /> Додај опција
                  </button>
                )}
              </div>
            </div>

            {/* Footer — sticky save */}
            <div className="px-7 py-4 border-t border-slate-100 shrink-0">
              <button
                onClick={handleSave}
                disabled={isSaving || !question.trim() || options.some(opt => !opt.text.trim())}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-base flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-200 active:scale-[0.98]"
              >
                <Save className="w-5 h-5" /> {isSaving ? 'Се зачувува...' : initialData ? 'Зачувај промени' : 'Зачувај квиз'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateQuizModal;
