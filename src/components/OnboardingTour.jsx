import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

const TOUR_DONE_KEY = 'mkd_tour_v1_done';

const STEPS = [
  {
    target: '[data-tour="sidebar-home"]',
    title: 'Почетна',
    body: 'Овде ги гледаш твоите настани и брзите статистики. Сè на едно место.',
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-presentations"]',
    title: 'Мои презентации',
    body: 'Создади нов настан со едно кликање. Секој настан добива уникатен код за учесници.',
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-analytics"]',
    title: 'Аналитика',
    body: 'Детални графикони, AI Увид и споредба на сесии. Гледај точно каде губиш учесниците.',
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-templates"]',
    title: 'Шаблони',
    body: 'Стотици готови активности — квизови, анкети, word cloud. Само клик и готово.',
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-profile"]',
    title: 'Профил и поставки',
    body: 'Постави јавно име, вклучи нотификации и преземи ги твоите податоци (GDPR).',
    placement: 'right',
  },
];

const TOOLTIP_WIDTH = 300;
const TOOLTIP_OFFSET = 16;

const getTargetRect = (selector) => {
  try {
    const el = document.querySelector(selector);
    if (!el) return null;
    return el.getBoundingClientRect();
  } catch {
    return null;
  }
};

const computeTooltipPosition = (rect, placement) => {
  if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  const scrollY = window.scrollY || 0;
  const scrollX = window.scrollX || 0;
  switch (placement) {
    case 'right':
      return {
        top: rect.top + scrollY + rect.height / 2,
        left: rect.right + scrollX + TOOLTIP_OFFSET,
        transform: 'translateY(-50%)',
      };
    case 'left':
      return {
        top: rect.top + scrollY + rect.height / 2,
        left: rect.left + scrollX - TOOLTIP_WIDTH - TOOLTIP_OFFSET,
        transform: 'translateY(-50%)',
      };
    case 'bottom':
      return {
        top: rect.bottom + scrollY + TOOLTIP_OFFSET,
        left: rect.left + scrollX + rect.width / 2,
        transform: 'translateX(-50%)',
      };
    case 'top':
    default:
      return {
        top: rect.top + scrollY - TOOLTIP_OFFSET,
        left: rect.left + scrollX + rect.width / 2,
        transform: 'translate(-50%, -100%)',
      };
  }
};

const OnboardingTour = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [visible, setVisible] = useState(true);

  const current = STEPS[step];

  const updateRect = useCallback(() => {
    setRect(getTargetRect(current.target));
  }, [current.target]);

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [updateRect]);

  // Scroll target into view
  useEffect(() => {
    const el = document.querySelector(current.target);
    el?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    setTimeout(updateRect, 300);
  }, [step, current.target, updateRect]);

  const finish = () => {
    try { localStorage.setItem(TOUR_DONE_KEY, '1'); } catch { /* ignore */ }
    setVisible(false);
    onDone?.();
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else finish();
  };

  const prev = () => step > 0 && setStep(s => s - 1);

  const tooltipStyle = computeTooltipPosition(rect, current.placement);

  // Spotlight box padding
  const PAD = 8;
  const spotlight = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null;

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="tour-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9000] pointer-events-none"
        style={{ isolation: 'isolate' }}
      >
        {/* Dark overlay with spotlight cutout */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-auto"
          onClick={finish}
          style={{ mixBlendMode: 'normal' }}
        >
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {spotlight && (
                <rect
                  x={spotlight.left}
                  y={spotlight.top}
                  width={spotlight.width}
                  height={spotlight.height}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(15,23,42,0.65)"
            mask="url(#tour-mask)"
          />
        </svg>

        {/* Spotlight border glow */}
        {spotlight && (
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute rounded-2xl ring-2 ring-indigo-400 ring-offset-0"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          key={`tooltip-${step}`}
          initial={{ opacity: 0, scale: 0.92, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="absolute pointer-events-auto"
          style={{
            ...tooltipStyle,
            width: TOOLTIP_WIDTH,
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-200/60 border border-indigo-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 bg-gradient-to-r from-indigo-600 to-violet-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-200" />
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">
                    {step + 1} / {STEPS.length}
                  </span>
                </div>
                <button
                  onClick={finish}
                  className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                  aria-label="Прескокни тур"
                >
                  <X size={14} />
                </button>
              </div>
              <h3 className="font-black text-white text-lg mt-2">{current.title}</h3>
            </div>

            {/* Body */}
            <div className="px-6 py-4">
              <p className="text-slate-600 font-bold text-sm leading-relaxed">{current.body}</p>
            </div>

            {/* Progress dots */}
            <div className="px-6 pb-2 flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? 'w-6 bg-indigo-500' : i < step ? 'w-1.5 bg-indigo-200' : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Footer buttons */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
              <button
                onClick={finish}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Прескокни
              </button>
              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={prev}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-xs hover:bg-slate-200 transition-all active:scale-95"
                  >
                    <ArrowLeft size={12} /> Назад
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all active:scale-95"
                >
                  {step === STEPS.length - 1 ? 'Готово!' : <><span>Следно</span> <ArrowRight size={12} /></>}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export { TOUR_DONE_KEY };
export default OnboardingTour;
