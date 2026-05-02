import React, { useState } from 'react';
import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Wand2, ArrowRight, Check, Loader2, Brain, ListTree, Lock, TrendingUp, ImagePlus, Trash2 } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import MathSymbolPicker from './MathSymbolPicker';
import DictateButton from './DictateButton';
import { applyInsertion } from '../lib/insertAtCursor';

const BLOOM_LEVELS = [
  { id: 'remember',   label: 'Запомнување' },
  { id: 'understand', label: 'Разбирање' },
  { id: 'apply',      label: 'Примена' },
  { id: 'analyze',    label: 'Анализа' },
  { id: 'evaluate',   label: 'Евалуација' },
  { id: 'create',     label: 'Создавање' },
];

const AIAssistantModal = ({ isOpen, onClose, onGenerate, user, adaptiveSuggestion = null }) => {
  const [prompt, setPrompt] = useState('');
  const [generating, setLoading] = useState(false);
  const [type, setType] = useState('quiz');
  const [strategy, setStrategy] = useState('default');
  const [bloom, setBloom] = useState(adaptiveSuggestion?.bloom || '');
  const [image, setImage] = useState(null); // { base64, mime, preview, sizeKB }
  const [imageError, setImageError] = useState('');
  const promptRef = useRef(null);
  const fileRef = useRef(null);

  const isPro = user?.plan === 'pro' || user?.plan === 'semester' || user?.role === 'admin';
  const trapRef = useFocusTrap(isOpen, { onEscape: onClose });

  const insertSymbol = (symbol) => {
    const input = promptRef.current;
    const { next, caret } = applyInsertion(prompt, symbol, input);
    setPrompt(next);
    requestAnimationFrame(() => {
      try { input?.focus(); input?.setSelectionRange(caret, caret); } catch { /* ignore */ }
    });
  };

  const appendDictation = (text) => {
    if (!text) return;
    setPrompt((current) => {
      const sep = current && !/\s$/.test(current) ? ' ' : '';
      return `${current}${sep}${text}`;
    });
  };

  const readImageFile = (file) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
      setImageError('Поддржани се PNG, JPG, WEBP или GIF.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setImageError('Сликата е поголема од 3MB.');
      return;
    }
    setImageError('');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.split(',')[1] || '';
      setImage({
        base64,
        mime: file.type || 'image/png',
        preview: dataUrl,
        sizeKB: Math.round(file.size / 1024),
      });
    };
    reader.onerror = () => setImageError('Не успеа читање на сликата.');
    reader.readAsDataURL(file);
  };

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (f) readImageFile(f);
    e.target.value = '';
  };

  const onPaste = (e) => {
    const items = e.clipboardData?.items || [];
    for (const it of items) {
      if (it.type?.startsWith('image/')) {
        const f = it.getAsFile();
        if (f) {
          e.preventDefault();
          readImageFile(f);
          return;
        }
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setImage(null);
      setImageError('');
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!prompt.trim() && !image) return;
    setLoading(true);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          type,
          strategy,
          bloom: bloom || undefined,
          imageBase64: image?.base64,
          imageMime: image?.mime,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate');
      }

      const result = await response.json();
      
      onGenerate(result);
      setLoading(false);
      setPrompt('');
      setImage(null);
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
        <div className="fixed inset-0 z-[110] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-assistant-title"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 max-w-2xl w-full shadow-2xl max-h-[92vh] overflow-y-auto my-auto"
          >
            {/* Background Sparkles */}
            <div className="absolute top-0 right-0 p-12 -z-10 opacity-10">
              <Sparkles size={200} className="text-indigo-600 animate-pulse" />
            </div>

            <button
              onClick={onClose}
              aria-label="Затвори AI Асистент"
              className="sticky top-0 float-right -mt-2 -mr-2 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all z-10 bg-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100">
                <Wand2 className="text-white w-6 h-6" />
              </div>
              <div>
                <h3 id="ai-assistant-title" className="text-3xl font-black text-slate-900">AI Асистент</h3>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Магија во една секунда</p>
              </div>
            </div>

            <div className="space-y-6">
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

              {adaptiveSuggestion && (
                <button
                  type="button"
                  onClick={() => setBloom(adaptiveSuggestion.bloom)}
                  className="w-full text-left p-4 rounded-2xl border-2 border-emerald-100 bg-emerald-50/60 hover:border-emerald-400 transition-all flex items-center gap-3"
                >
                  <TrendingUp size={20} className="text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-0.5">
                      Адаптивна препорака · {Math.round(adaptiveSuggestion.accuracy * 100)}% точност
                    </p>
                    <p className="text-sm font-bold text-emerald-900">{adaptiveSuggestion.label}</p>
                  </div>
                </button>
              )}

              <div>
                <label className="block text-sm font-black text-slate-700 mb-4">Bloom-ова таксономија (опционално)</label>
                <div className="grid grid-cols-3 gap-2">
                  {BLOOM_LEVELS.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setBloom(bloom === b.id ? '' : b.id)}
                      className={`py-2 px-3 rounded-xl font-black text-xs transition-all border-2 ${
                        bloom === b.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                          : 'border-slate-100 text-slate-400 hover:border-indigo-200'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                  <label className="block text-sm font-black text-slate-700">Внесете тема или концепт</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <DictateButton onTranscript={appendDictation} />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-black text-xs hover:border-indigo-400 hover:text-indigo-600 transition-all"
                      aria-label="Прикачи слика како контекст за AI"
                      title="Прикачи слика (или Ctrl+V)"
                    >
                      <ImagePlus className="w-4 h-4" />
                      Слика
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={onPickFile}
                    />
                  </div>
                </div>
                <textarea 
                  ref={promptRef}
                  placeholder="Пр: Питагорова теорема со x² + y² = z², Сончев систем, Фидбек... (можете да залепите слика со Ctrl+V)"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onPaste={onPaste}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all min-h-[110px] resize-none text-base"
                />
                {image && (
                  <div className="mt-3 flex items-start gap-3 p-3 rounded-2xl bg-indigo-50/60 border-2 border-indigo-100">
                    <img
                      src={image.preview}
                      alt="Прикачена слика"
                      className="w-20 h-20 object-cover rounded-xl border border-indigo-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-1">
                        Vision активен · {image.sizeKB} KB
                      </p>
                      <p className="text-xs font-bold text-slate-600 leading-relaxed">
                        AI ќе ја прочита сликата (OCR + анализа) и ќе генерира прашање врз основа на содржината.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      aria-label="Отстрани слика"
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {imageError && (
                  <p className="mt-2 text-xs font-bold text-rose-600">{imageError}</p>
                )}
                <div className="mt-3">
                  <MathSymbolPicker onInsert={insertSymbol} compact />
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="bg-white p-2 rounded-xl shadow-sm text-indigo-600">
                  <Sparkles size={20} />
                </div>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                  Нашиот AI модел ќе ги креира најдобрите прашања и опции за вашата публика на македонски јазик.
                </p>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={(!prompt.trim() && !image) || generating}
                className="sticky bottom-0 w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl shadow-indigo-200"
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
