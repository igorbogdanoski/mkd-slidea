import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CreatePollModal = ({ isOpen, onClose, onSave, type = 'poll', initialData = null }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  useEffect(() => {
    if (initialData) {
      setQuestion(initialData.question || '');
      if (initialData.options && initialData.options.length > 0) {
        setOptions(initialData.options.map(opt => opt.text || opt));
      } else {
        setOptions(['', '']);
      }
    } else {
      setQuestion('');
      setOptions(['', '']);
    }
  }, [initialData, isOpen]);

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

  const [scaleMin, setScaleMin] = useState('');
  const [scaleMax, setScaleMax] = useState('');

  useEffect(() => {
    if (!initialData) { setScaleMin(''); setScaleMax(''); }
    else {
      const opts = initialData.options || [];
      setScaleMin(opts[0]?.label || '');
      setScaleMax(opts[opts.length - 1]?.label || '');
    }
  }, [initialData, isOpen]);

  const getTitle = () => {
    if (initialData) return 'Измени активност';
    switch (type) {
      case 'wordcloud': return 'Нов облак со зборови';
      case 'rating':   return 'Ново оценување';
      case 'open':     return 'Нов отворен текст';
      case 'ranking':  return 'Ново рангирање';
      case 'scale':    return 'Нова скала 1–10';
      default:         return 'Нова анкета';
    }
  };

  const hasOptions = ['poll', 'ranking'].includes(type);
  const isScale = type === 'scale';
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!question.trim()) return;
    if (hasOptions && options.some(opt => !opt.trim())) return;
    setIsSaving(true);
    try {
      const scaleOptions = isScale
        ? Array.from({ length: 10 }, (_, i) => ({
            text: String(i + 1),
            votes: 0,
            label: i === 0 ? scaleMin : i === 9 ? scaleMax : '',
          }))
        : [];
      await onSave({
        question: question.slice(0, 300),
        options: hasOptions ? options.map(text => ({ text: text.slice(0, 150), votes: 0 })) : scaleOptions,
        type,
        active: true
      });
    } finally {
      setIsSaving(false);
      setQuestion('');
      setOptions(['', '']);
    }
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

            <h3 className="text-2xl font-black mb-8">{getTitle()}</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Прашање</label>
                <input 
                  type="text" 
                  placeholder="Што сакате да прашате?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  maxLength={300}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                />
              </div>

              {isScale && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-2xl px-5 py-3">
                    <div className="flex gap-1">
                      {Array.from({length:10},(_,i)=>(
                        <div key={i} className="w-5 h-5 rounded-md text-[9px] font-black flex items-center justify-center text-white"
                          style={{backgroundColor:`hsl(${i*12},80%,50%)`}}>{i+1}</div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Ознака за 1 (необ.)</label>
                      <input type="text" placeholder="пр. Воопшто не" value={scaleMin}
                        onChange={e => setScaleMin(e.target.value)} maxLength={40}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 font-bold text-sm focus:border-teal-500 focus:bg-white outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Ознака за 10 (необ.)</label>
                      <input type="text" placeholder="пр. Апсолутно да" value={scaleMax}
                        onChange={e => setScaleMax(e.target.value)} maxLength={40}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 font-bold text-sm focus:border-teal-500 focus:bg-white outline-none transition-all" />
                    </div>
                  </div>
                </div>
              )}

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
                          maxLength={150}
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
                disabled={isSaving || !question.trim() || (hasOptions && options.some(opt => !opt.trim()))}
                className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-200 active:scale-[0.98] mt-4"
              >
                <Save className="w-6 h-6" /> {isSaving ? 'Се зачувува...' : initialData ? 'Зачувај промени' : 'Зачувај активност'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreatePollModal;
