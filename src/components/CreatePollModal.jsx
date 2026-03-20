import React, { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CreatePollModal = ({ isOpen, onClose, onSave, type = 'poll' }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const getTitle = () => {
    switch (type) {
      case 'wordcloud': return 'Нов облак со зборови';
      case 'rating': return 'Ново оценување';
      case 'open': return 'Нов отворен текст';
      case 'ranking': return 'Ново рангирање';
      default: return 'Нова анкета';
    }
  };

  const hasOptions = ['poll', 'ranking'].includes(type);

  const handleSave = () => {
    if (!question.trim()) return;
    if (hasOptions && options.some(opt => !opt.trim())) return;

    onSave({
      question,
      options: hasOptions ? options.map(text => ({ text, votes: 0 })) : [],
      type,
      active: true
    });
    setQuestion('');
    setOptions(['', '']);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
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

            <h3 className="text-2xl font-black mb-8">{getTitle()}</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Прашање</label>
                <input 
                  type="text" 
                  placeholder="Што сакате да прашате?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                />
              </div>

              {hasOptions && (
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Опции</label>
                  <div className="space-y-3">
                    {options.map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder={`Опција ${i + 1}`}
                          value={opt}
                          onChange={(e) => handleOptionChange(i, e.target.value)}
                          className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-3 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
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
                      <Plus className="w-4 h-4" /> Додај уште една опција
                    </button>
                  )}
                </div>
              )}

              <button 
                onClick={handleSave}
                disabled={!question.trim() || (hasOptions && options.some(opt => !opt.trim()))}
                className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-200 active:scale-[0.98] mt-4"
              >
                <Save className="w-6 h-6" /> Зачувај активност
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreatePollModal;
