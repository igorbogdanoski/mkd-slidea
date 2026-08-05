import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import mk from './locales/mk.js';
import hr from './locales/hr.js';
import sr from './locales/sr.js';
import bg from './locales/bg.js';
import sq from './locales/sq.js';
import ro from './locales/ro.js';
import en from './locales/en.js';

export const LOCALES = {
  mk: { name: 'Македонски', flag: '🇲🇰', dict: mk, htmlLang: 'mk' },
  hr: { name: 'Hrvatski',   flag: '🇭🇷', dict: hr, htmlLang: 'hr' },
  sr: { name: 'Српски',     flag: '🇷🇸', dict: sr, htmlLang: 'sr' },
  bg: { name: 'Български',  flag: '🇧🇬', dict: bg, htmlLang: 'bg' },
  sq: { name: 'Shqip',      flag: '🇦🇱', dict: sq, htmlLang: 'sq' },
  ro: { name: 'Română',     flag: '🇷🇴', dict: ro, htmlLang: 'ro' },
  en: { name: 'English',    flag: '🇬🇧', dict: en, htmlLang: 'en' },
};

export const DEFAULT_LOCALE = 'mk';
const STORAGE_KEY = 'mkd_locale';

// `?lang=xx` is what every hreflang alternate, the sitemap and index.html
// advertise, so it has to win over both the stored choice and the browser
// language — a visitor arriving on the Albanian alternate must get Albanian
// even if they once clicked Македонски here.
function fromQuery() {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    const code = (q || '').slice(0, 2).toLowerCase();
    return LOCALES[code] ? code : null;
  } catch {
    return null;
  }
}

function detect() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const fromUrl = fromQuery();
  if (fromUrl) return fromUrl;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LOCALES[stored]) return stored;
  } catch { /* ignore */ }
  // Deliberately NOT falling back to navigator.language.
  //
  // Translation coverage is nav, footer and a handful of common strings —
  // everything else (landing copy, Participant, Presenter, Host, Dashboard,
  // every modal) is Macedonian. Auto-switching on browser language therefore
  // does not produce an English page, it produces a Macedonian page wearing an
  // English hat, and it would do that to the largest single group of real
  // users: Macedonian teachers running Chrome in English. Until a locale is
  // actually complete, the language changes only when someone asks for it —
  // via ?lang= (which is what hreflang points at, so search traffic still
  // lands correctly) or the switcher.
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

  // Landing on a `?lang=` alternate is a deliberate choice, so remember it —
  // otherwise in-app navigation (which drops the query) would silently fall
  // back to the stored/browser locale on the very next page.
  useEffect(() => {
    const fromUrl = fromQuery();
    if (fromUrl) {
      try { localStorage.setItem(STORAGE_KEY, fromUrl); } catch { /* ignore */ }
    }
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
