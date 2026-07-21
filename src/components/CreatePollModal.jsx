import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Save, ChevronDown, Image as ImageIcon, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MathSymbolPicker from './MathSymbolPicker';
import IllustrationPickerModal from './IllustrationPickerModal';
import CurriculumTagPicker from './CurriculumTagPicker';
import { applyInsertion } from '../lib/insertAtCursor';

const SURVEY_Q_TYPES = [
  { value: 'open',   label: 'Отворен текст' },
  { value: 'scale',  label: 'Скала 1–10' },
  { value: 'choice', label: 'Избор (повеќе)' },
];

const newSurveyQ = () => ({ id: crypto.randomUUID(), text: '', type: 'open', options: ['', ''], min: '', max: '' });

const CreatePollModal = ({ isOpen, onClose, onSave, type = 'poll', initialData = null }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [coverUrl, setCoverUrl] = useState('');
  const [coverMeta, setCoverMeta] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [curriculumTags, setCurriculumTags] = useState([]);
  const [presenterNotes, setPresenterNotes] = useState('');
  const questionRef = useRef(null);
  const optionRefs = useRef({});
  const activeFieldRef = useRef({ kind: 'question' });

  useEffect(() => {
    if (initialData) {
      setQuestion(initialData.question || '');
      if (initialData.options && initialData.options.length > 0) {
        setOptions(initialData.options.map(opt => opt.text || opt));
      } else {
        setOptions(['', '']);
      }
      setCoverUrl(initialData.cover_url || '');
      setCoverMeta(initialData.cover_meta || null);
      setCurriculumTags(Array.isArray(initialData.curriculum_tags) ? initialData.curriculum_tags : []);
      setPresenterNotes(initialData.presenter_notes || '');
    } else {
      setQuestion('');
      setOptions(['', '']);
      setCoverUrl('');
      setCoverMeta(null);
      setCurriculumTags([]);
      setPresenterNotes('');
    }
  }, [initialData, isOpen]);

  const addOption = () => {
    if (options.length < 8) {
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
        cover_url: coverUrl || null,
        cover_meta: coverMeta || null,
        curriculum_tags: curriculumTags && curriculumTags.length ? curriculumTags : null,
        presenter_notes: presenterNotes ? presenterNotes.slice(0, 4000) : null,
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
      setCoverUrl('');
      setCoverMeta(null);
      setCurriculumTags([]);
      setPresenterNotes('');
    }
  };

  const insertSymbol = (symbol) => {
    const target = activeFieldRef.current || { kind: 'question' };
    if (target.kind === 'option' && typeof target.index === 'number') {
      const idx = target.index;
      const input = optionRefs.current[idx];
      const current = options[idx] ?? '';
      const { next, caret } = applyInsertion(current, symbol, input);
      const newOpts = [...options];
      newOpts[idx] = next;
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
            role="dialog" aria-modal="true" aria-label="Создај активност"
            className="relative bg-white rounded-2xl max-w-xl w-full shadow-2xl flex flex-col max-h-[92vh]"
          >
            {/* Header — fixed */}
            <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-slate-100 shrink-0">
              <h3 className="text-xl font-black">{getTitle()}</h3>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-7 py-5">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Прашање</label>
                <textarea
                  ref={questionRef}
                  rows={2}
                  placeholder="Што сакате да прашате? Можете и: x² + y² = r²"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onFocus={() => { activeFieldRef.current = { kind: 'question' }; }}
                  maxLength={300}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-sm focus:border-indigo-600 focus:bg-white outline-none transition-all resize-none"
                />
                <div className="mt-3">
                  <MathSymbolPicker onInsert={insertSymbol} />
                </div>
                <div className="mt-4">
                  <CurriculumTagPicker
                    questionText={question}
                    value={curriculumTags}
                    onChange={setCurriculumTags}
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                    Слика (необ.)
                  </label>
                  {coverUrl ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-slate-100 group">
                      <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setCoverUrl(''); setCoverMeta(null); }}
                        className="absolute top-2 right-2 p-1.5 bg-slate-900/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Отстрани слика"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-xs font-black text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                    >
                      <ImageIcon className="w-4 h-4" /> Додај слика
                    </button>
                  )}
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                    Белешки за презентер (само за хост)
                  </label>
                  <textarea
                    value={presenterNotes}
                    onChange={(e) => setPresenterNotes(e.target.value)}
                    placeholder="Напомени, поенти, точки за дискусија — невидливи за учесниците."
                    rows={2}
                    maxLength={4000}
                    className="w-full bg-amber-50/40 border-2 border-amber-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-amber-400 focus:bg-white outline-none transition-all resize-y"
                  />
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
                  <div className="flex items-center justify-between mb-2 px-1">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Опции</label>
                    <span className="text-xs font-bold text-slate-300">{options.length}/8</span>
                  </div>
                  <div className="space-y-2">
                    {options.map((opt, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-400 text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
                        <input
                          type="text"
                          ref={(el) => { if (el) optionRefs.current[i] = el; else delete optionRefs.current[i]; }}
                          placeholder={`Опција ${i + 1}`}
                          value={opt}
                          onChange={(e) => handleOptionChange(i, e.target.value)}
                          onFocus={() => { activeFieldRef.current = { kind: 'option', index: i }; }}
                          maxLength={150}
                          className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 font-bold text-sm focus:border-indigo-600 focus:bg-white outline-none transition-all"
                        />
                        {options.length > 2 && (
                          <button
                            onClick={() => removeOption(i)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {options.length < 8 && (
                    <button
                      onClick={addOption}
                      className="mt-3 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 px-1"
                    >
                      <Plus className="w-4 h-4" /> Додај уште една опција
                    </button>
                  )}
                </div>
              )}
            </div>
            </div>

            {/* Footer — sticky save button */}
            <div className="px-7 py-4 border-t border-slate-100 shrink-0">
              <button
                onClick={handleSave}
                disabled={isSaving || !question.trim() || (hasOptions && options.some(opt => !opt.trim())) || (isSurvey && surveyQuestions.some(q => !q.text.trim()))}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-base flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
              >
                <Save className="w-5 h-5" /> {isSaving ? 'Се зачувува...' : initialData ? 'Зачувај промени' : 'Зачувај активност'}
              </button>
            </div>
          </motion.div>
          <IllustrationPickerModal
            isOpen={pickerOpen}
            onClose={() => setPickerOpen(false)}
            initialQuery={question}
            onSelect={(url, meta) => { setCoverUrl(url); setCoverMeta(meta || null); setPickerOpen(false); }}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreatePollModal;
