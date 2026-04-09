import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Save, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MathSymbolPicker from './MathSymbolPicker';

const SURVEY_Q_TYPES = [
  { value: 'open',   label: 'Отворен текст' },
  { value: 'scale',  label: 'Скала 1–10' },
  { value: 'choice', label: 'Избор (повеќе)' },
];

const newSurveyQ = () => ({ id: crypto.randomUUID(), text: '', type: 'open', options: ['', ''], min: '', max: '' });

const CreatePollModal = ({ isOpen, onClose, onSave, type = 'poll', initialData = null }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const questionRef = useRef(null);

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
  const [surveyQuestions, setSurveyQuestions] = useState([newSurveyQ()]);

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
      case 'survey':   return 'Нов анкетен формулар';
      default:         return 'Нова анкета';
    }
  };

  const hasOptions = ['poll', 'ranking'].includes(type);
  const isScale = type === 'scale';
  const isSurvey = type === 'survey';
  const [isSaving, setIsSaving] = useState(false);

  const updateSurveyQ = (id, patch) =>
    setSurveyQuestions(qs => qs.map(q => q.id === id ? { ...q, ...patch } : q));
  const updateSurveyQOption = (qId, optIdx, val) =>
    setSurveyQuestions(qs => qs.map(q => q.id === qId
      ? { ...q, options: q.options.map((o, i) => i === optIdx ? val : o) }
      : q));
  const addSurveyQOption = (qId) =>
    setSurveyQuestions(qs => qs.map(q => q.id === qId && q.options.length < 6
      ? { ...q, options: [...q.options, ''] } : q));
  const removeSurveyQOption = (qId, optIdx) =>
    setSurveyQuestions(qs => qs.map(q => q.id === qId && q.options.length > 2
      ? { ...q, options: q.options.filter((_, i) => i !== optIdx) } : q));

  const handleSave = async () => {
    if (!question.trim()) return;
    if (hasOptions && options.some(opt => !opt.trim())) return;
    if (isSurvey && surveyQuestions.some(q => !q.text.trim())) return;
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
        active: true,
        needs_moderation: false,
        survey_questions: isSurvey ? surveyQuestions.map(q => ({
          id: q.id,
          text: q.text.slice(0, 300),
          type: q.type,
          options: q.type === 'choice' ? q.options.filter(Boolean).map(o => o.slice(0, 150)) : [],
          min: q.min || '',
          max: q.max || '',
        })) : undefined,
      });
    } finally {
      setIsSaving(false);
      setQuestion('');
      setOptions(['', '']);
      setSurveyQuestions([newSurveyQ()]);
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

            <h3 className="text-2xl font-black mb-8">{getTitle()}</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Прашање</label>
                <textarea
                  ref={questionRef}
                  rows={3}
                  placeholder="Што сакате да прашате? Можете и: x² + y² = r²"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  maxLength={300}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all resize-none"
                />
                <div className="mt-3">
                  <MathSymbolPicker onInsert={insertSymbol} />
                </div>
              </div>

              {isSurvey && (
                <div className="space-y-4">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1">Прашања во формуларот</label>
                  {surveyQuestions.map((sq, qIdx) => (
                    <div key={sq.id} className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 bg-green-100 text-green-700 rounded-lg font-black text-sm flex items-center justify-center flex-shrink-0">{qIdx + 1}</span>
                        <input
                          type="text"
                          placeholder="Текст на прашањето..."
                          value={sq.text}
                          onChange={e => updateSurveyQ(sq.id, { text: e.target.value })}
                          maxLength={300}
                          className="flex-1 bg-white border-2 border-slate-100 rounded-xl px-4 py-2.5 font-bold text-sm focus:border-green-500 focus:bg-white outline-none transition-all"
                        />
                        {surveyQuestions.length > 1 && (
                          <button onClick={() => setSurveyQuestions(qs => qs.filter(q => q.id !== sq.id))}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {SURVEY_Q_TYPES.map(t => (
                          <button key={t.value} onClick={() => updateSurveyQ(sq.id, { type: t.value })}
                            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all ${sq.type === t.value ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-green-400'}`}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                      {sq.type === 'scale' && (
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="Ознака за 1" value={sq.min}
                            onChange={e => updateSurveyQ(sq.id, { min: e.target.value })} maxLength={40}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-xs focus:border-green-500 outline-none" />
                          <input type="text" placeholder="Ознака за 10" value={sq.max}
                            onChange={e => updateSurveyQ(sq.id, { max: e.target.value })} maxLength={40}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-xs focus:border-green-500 outline-none" />
                        </div>
                      )}
                      {sq.type === 'choice' && (
                        <div className="space-y-2">
                          {sq.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex gap-2">
                              <input type="text" placeholder={`Опција ${oIdx + 1}`} value={opt}
                                onChange={e => updateSurveyQOption(sq.id, oIdx, e.target.value)} maxLength={150}
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-xs focus:border-green-500 outline-none" />
                              {sq.options.length > 2 && (
                                <button onClick={() => removeSurveyQOption(sq.id, oIdx)}
                                  className="p-2 text-slate-300 hover:text-red-400 rounded-lg transition-all">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                          {sq.options.length < 6 && (
                            <button onClick={() => addSurveyQOption(sq.id)}
                              className="flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-700 px-1">
                              <Plus className="w-3.5 h-3.5" /> Додај опција
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {surveyQuestions.length < 10 && (
                    <button onClick={() => setSurveyQuestions(qs => [...qs, newSurveyQ()])}
                      className="flex items-center gap-2 text-sm font-bold text-green-600 hover:text-green-700 px-1">
                      <Plus className="w-4 h-4" /> Додај прашање
                    </button>
                  )}
                </div>
              )}

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
                disabled={isSaving || !question.trim() || (hasOptions && options.some(opt => !opt.trim())) || (isSurvey && surveyQuestions.some(q => !q.text.trim()))}
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
