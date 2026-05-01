import React, { useEffect, useRef, useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { useI18n, LOCALES } from '../i18n';

const LanguageSwitcher = () => {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const current = LOCALES[locale] || LOCALES.mk;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('nav.language')}
        title={t('nav.language')}
        className="flex items-center gap-1.5 p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-indigo-300 dark:hover:bg-slate-800 transition-all text-sm font-bold"
      >
        <Globe size={18} />
        <span className="text-base leading-none">{current.flag}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 z-[200]">
          {Object.entries(LOCALES).map(([code, info]) => (
            <button
              key={code}
              onClick={() => { setLocale(code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors ${
                locale === code ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              <span className="text-lg leading-none">{info.flag}</span>
              <span className="flex-1 text-left">{info.name}</span>
              {locale === code && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
