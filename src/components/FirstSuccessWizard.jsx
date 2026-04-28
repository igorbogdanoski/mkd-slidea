import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles, Rocket, Clock, Check } from 'lucide-react';
import { STARTER_TEMPLATES, TEMPLATE_SUBJECTS } from '../lib/starterTemplates';

const STORAGE_KEY = 'mkd_first_success_seen';

export function shouldShowFirstSuccess({ user, hasEvents, loadingEvents }) {
  if (!user?.id || loadingEvents) return false;
  if (hasEvents) return false;
  if (localStorage.getItem(`${STORAGE_KEY}_${user.id}`)) return false;
  return true;
}

export function dismissFirstSuccess(userId) {
  if (!userId) return;
  try { localStorage.setItem(`${STORAGE_KEY}_${userId}`, '1'); } catch { /* quota */ }
}

export default function FirstSuccessWizard({ user, onClose, onLaunch }) {
  const [step, setStep] = useState(0);
  const [subject, setSubject] = useState('');
  const [templateId, setTemplateId] = useState('');

  const subjects = TEMPLATE_SUBJECTS.filter((s) => s !== 'Сите');

  const filteredTemplates = useMemo(() => {
    if (!subject) return [];
    return STARTER_TEMPLATES.filter((t) => t.subject === subject).slice(0, 6);
  }, [subject]);

  const selectedTemplate = STARTER_TEMPLATES.find((t) => t.id === templateId);

  const dismiss = () => {
    dismissFirstSuccess(user?.id);
    onClose();
  };

  const launch = () => {
    if (!selectedTemplate) return;
    dismissFirstSuccess(user?.id);
    onLaunch(selectedTemplate);
  };

  const canNext = (step === 0 && subject) || (step === 1 && templateId);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[700] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={dismiss}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-[2.5rem] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Твојот прв квиз за 60 секунди</h2>
                  <p className="text-white/70 font-bold text-xs flex items-center gap-1.5">
                    <Clock size={12} /> Без AI · без чекање · готов час одма
                  </p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="p-2 hover:bg-white/10 rounded-xl transition-all"
                aria-label="Затвори"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Progress bar */}
            <div className="flex gap-2 mt-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-white' : 'bg-white/20'}`}
                />
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8">
            {step === 0 && (
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Што предаваш?</h3>
                <p className="text-slate-400 font-bold text-sm mb-6">Избери предмет за да ти препорачаме готов час</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {subjects.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className={`px-4 py-4 rounded-2xl font-black text-sm transition-all border-2 ${
                        subject === s
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                          : 'border-slate-100 text-slate-500 hover:border-indigo-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Избери готов час</h3>
                <p className="text-slate-400 font-bold text-sm mb-6">{filteredTemplates.length} шаблони за <strong>{subject}</strong></p>
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-bold">
                    Нема готови шаблони за {subject}. Врати се назад и пробај друг предмет.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredTemplates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTemplateId(t.id)}
                        className={`p-5 rounded-2xl text-left transition-all border-2 relative ${
                          templateId === t.id
                            ? 'border-indigo-600 bg-indigo-50/50'
                            : 'border-slate-100 hover:border-indigo-200'
                        }`}
                      >
                        {templateId === t.id && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-2xl mb-3`}>
                          {t.icon}
                        </div>
                        <h4 className="font-black text-slate-900 text-sm mb-1 line-clamp-1">{t.title}</h4>
                        <p className="text-xs text-slate-400 font-bold mb-2 line-clamp-2">{t.description}</p>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                          {t.polls.length} активности · {t.grade}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 2 && selectedTemplate && (
              <div className="text-center py-6">
                <div className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br ${selectedTemplate.color} flex items-center justify-center text-4xl mb-6`}>
                  {selectedTemplate.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">{selectedTemplate.title}</h3>
                <p className="text-slate-500 font-bold mb-6">{selectedTemplate.description}</p>
                <div className="inline-flex items-center gap-4 px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Активности</p>
                    <p className="font-black text-slate-900">{selectedTemplate.polls.length}</p>
                  </div>
                  <div className="w-px h-10 bg-slate-200" />
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ниво</p>
                    <p className="font-black text-slate-900">{selectedTemplate.grade}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-bold mt-6 flex items-center justify-center gap-1.5">
                  <Sparkles size={12} className="text-indigo-500" />
                  Кликни „Пушти го часот" за да отвориш Host со готови активности
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <button
              onClick={dismiss}
              className="text-slate-400 font-black text-sm hover:text-slate-600 transition-colors"
            >
              Прескокни
            </button>
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black text-sm hover:border-slate-400 transition-all flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Назад
                </button>
              )}
              {step < 2 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canNext}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  Следно <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={launch}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-sm hover:from-indigo-700 hover:to-violet-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                >
                  Пушти го часот <Rocket size={16} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
