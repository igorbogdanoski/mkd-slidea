import { useState, useEffect } from 'react';
import { Mic, MicOff, Globe2 } from 'lucide-react';
import { useLiveCaptions } from '../hooks/useLiveCaptions';

// Sprint 7.A — multilingual dictation control.
// Uses Web Speech API via useLiveCaptions. Zero cost, browser-only.
// Persists last-chosen language in localStorage.
const LANGS = [
  { code: 'mk-MK', label: 'МК', name: 'Македонски' },
  { code: 'sq-AL', label: 'AL', name: 'Shqip' },
  { code: 'en-US', label: 'EN', name: 'English' },
];
const STORAGE_KEY = 'mkd_dictate_lang';

const DictateButton = ({ onTranscript, className = '' }) => {
  const [enabled, setEnabled] = useState(false);
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || 'mk-MK'; } catch { return 'mk-MK'; }
  });
  const [showLangs, setShowLangs] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
  }, [lang]);

  const { supported, active, interim, error } = useLiveCaptions({
    lang,
    enabled,
    onFinal: (text) => {
      if (typeof onTranscript === 'function') {
        try { onTranscript(text); } catch { /* ignore */ }
      }
    },
  });

  const toggle = () => {
    if (!supported) return;
    setEnabled((v) => !v);
  };

  const current = LANGS.find((l) => l.code === lang) || LANGS[0];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        disabled={!supported}
        aria-pressed={enabled}
        aria-label={enabled ? 'Запри диктирање' : `Започни диктирање на ${current.name}`}
        title={
          !supported ? 'Прелистувачот не поддржува препознавање на говор' :
          enabled ? 'Запри диктирање' : `Диктирај на ${current.name}`
        }
        className={`relative flex items-center gap-2 px-3 py-2 rounded-xl font-black text-xs border-2 transition-all ${
          !supported ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' :
          enabled ? 'bg-rose-500 border-rose-400 text-white hover:bg-rose-600' :
          'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'
        }`}
      >
        {enabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        {enabled ? 'Снимам...' : 'Диктирај'}
        {active && enabled && (
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" aria-hidden="true" />
        )}
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowLangs((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={showLangs}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-black text-xs hover:border-indigo-400 hover:text-indigo-600 transition-all"
        >
          <Globe2 className="w-3.5 h-3.5" />
          {current.label}
        </button>
        {showLangs && (
          <ul
            role="listbox"
            className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden min-w-[140px]"
          >
            {LANGS.map((l) => (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={l.code === lang}
                  onClick={() => { setLang(l.code); setShowLangs(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-black transition-all ${
                    l.code === lang ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="inline-block w-7">{l.label}</span> {l.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {enabled && interim && (
        <span className="text-xs font-bold text-slate-400 italic truncate max-w-[200px]" aria-live="polite">
          „{interim}"
        </span>
      )}
      {error === 'not-allowed' && (
        <span className="text-xs font-bold text-rose-500">Дозволи микрофон</span>
      )}
    </div>
  );
};

export default DictateButton;
