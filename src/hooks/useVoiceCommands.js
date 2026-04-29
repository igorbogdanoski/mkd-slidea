import { useCallback, useEffect, useRef, useState } from 'react';

// Lightweight Web Speech API wrapper. Free, on-device when supported.
// Macedonian primary, English fallback. Commands map is keyword-based so we
// tolerate partial matches and minor recognition errors.
//
// Usage:
//   const { supported, listening, lastHeard, start, stop } = useVoiceCommands({
//     'next':  () => goNext(),
//     'prev':  () => goPrev(),
//     'lock':  () => toggleLock(true),
//   });
//
// Built-in keyword sets (Macedonian + English):
const KEYWORD_SETS = {
  next:    ['следна', 'следно', 'напред', 'продолжи', 'next', 'forward'],
  prev:    ['претходна', 'претходно', 'назад', 'previous', 'prev', 'back'],
  lock:    ['заклучи', 'заклучено', 'lock'],
  unlock:  ['отклучи', 'отклучено', 'unlock'],
  show:    ['прикажи', 'покажи', 'show'],
  hide:    ['скриј', 'скриено', 'hide'],
  reset:   ['ресетирај', 'reset', 'clear'],
  start:   ['почни', 'старт', 'start', 'begin'],
  stopCmd: ['стоп', 'запри', 'stop'],
};

const matchAction = (transcript) => {
  const text = transcript.toLowerCase();
  for (const [action, words] of Object.entries(KEYWORD_SETS)) {
    if (words.some((w) => text.includes(w))) return action;
  }
  return null;
};

export function useVoiceCommands(handlers = {}, { lang = 'mk-MK' } = {}) {
  const [listening, setListening] = useState(false);
  const [lastHeard, setLastHeard] = useState('');
  const [error, setError] = useState(null);
  const recRef = useRef(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const SR =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const supported = !!SR;

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!SR) return;
    try {
      const rec = new SR();
      rec.lang = lang;
      rec.interimResults = false;
      rec.continuous = true;
      rec.maxAlternatives = 2;

      rec.onresult = (e) => {
        const last = e.results[e.results.length - 1];
        const heard = last?.[0]?.transcript?.trim() || '';
        if (!heard) return;
        setLastHeard(heard);
        const action = matchAction(heard);
        if (action && typeof handlersRef.current[action] === 'function') {
          handlersRef.current[action]();
        }
      };
      rec.onerror = (e) => {
        if (e.error === 'no-speech' || e.error === 'aborted') return;
        setError(e.error || 'recognition-error');
      };
      rec.onend = () => {
        // Auto-restart while user keeps "listening" toggled on.
        if (recRef.current === rec && listening) {
          try { rec.start(); } catch { /* ignored */ }
        }
      };

      recRef.current = rec;
      rec.start();
      setListening(true);
      setError(null);
    } catch (e) {
      setError(e.message || 'recognition-failed');
      setListening(false);
    }
  }, [SR, lang, listening]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => () => stop(), [stop]);

  return { supported, listening, lastHeard, error, start, stop, toggle };
}
