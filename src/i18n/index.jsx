import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import mk from './locales/mk.js';
import hr from './locales/hr.js';
import sr from './locales/sr.js';
import bg from './locales/bg.js';
import sq from './locales/sq.js';
import ro from './locales/ro.js';

export const LOCALES = {
  mk: { name: 'Македонски', flag: '🇲🇰', dict: mk, htmlLang: 'mk' },
  hr: { name: 'Hrvatski',   flag: '🇭🇷', dict: hr, htmlLang: 'hr' },
  sr: { name: 'Српски',     flag: '🇷🇸', dict: sr, htmlLang: 'sr' },
  bg: { name: 'Български',  flag: '🇧🇬', dict: bg, htmlLang: 'bg' },
  sq: { name: 'Shqip',      flag: '🇦🇱', dict: sq, htmlLang: 'sq' },
  ro: { name: 'Română',     flag: '🇷🇴', dict: ro, htmlLang: 'ro' },
};

export const DEFAULT_LOCALE = 'mk';
const STORAGE_KEY = 'mkd_locale';

function detect() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LOCALES[stored]) return stored;
  } catch { /* ignore */ }
  const browser = (navigator.language || '').slice(0, 2).toLowerCase();
  if (LOCALES[browser]) return browser;
  return DEFAULT_LOCALE;
}

function lookup(dict, key) {
  if (!key) return '';
  const parts = String(key).split('.');
  let cur = dict;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
    else return null;
  }
  return typeof cur === 'string' ? cur : null;
}

const I18nContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (k) => k,
});

export const I18nProvider = ({ children }) => {
  const [locale, setLocaleState] = useState(() => detect());

  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('lang', LOCALES[locale]?.htmlLang || 'mk');
      }
    } catch { /* ignore */ }
  }, [locale]);

  const setLocale = useCallback((next) => {
    if (!LOCALES[next]) return;
    setLocaleState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }, []);

  const t = useCallback(
    (key, fallback) => {
      const dict = LOCALES[locale]?.dict || LOCALES[DEFAULT_LOCALE].dict;
      const val = lookup(dict, key);
      if (val !== null) return val;
      const def = lookup(LOCALES[DEFAULT_LOCALE].dict, key);
      return def !== null ? def : (fallback ?? key);
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
