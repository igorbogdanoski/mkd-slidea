import { useEffect, useRef, useState, useCallback } from 'react';

// Sprint 4.5 — Live captions / 4.3 transcription via Web Speech API.
// Browser-only, zero cost, runs locally. Falls back gracefully when
// SpeechRecognition isn't available (Firefox, Safari iOS).
export function useLiveCaptions({ lang = 'mk-MK', enabled = false, onFinal } = {}) {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);
  const [interim, setInterim] = useState('');
  const [finalText, setFinalText] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const stopRequestedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    if (typeof window === 'undefined') return undefined;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('unsupported');
      return undefined;
    }

    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => { setActive(true); setError(null); };
    rec.onerror = (e) => {
      const code = e?.error || 'error';
      // 'no-speech' and 'aborted' are normal during continuous mode.
      if (code !== 'no-speech' && code !== 'aborted') setError(code);
    };
    rec.onend = () => {
      setActive(false);
      // Auto-restart unless the consumer asked to stop.
      if (!stopRequestedRef.current) {
        try { rec.start(); } catch { /* ignore */ }
      }
    };
    rec.onresult = (event) => {
      let interimChunk = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalChunk += r[0].transcript;
        else interimChunk += r[0].transcript;
      }
      if (interimChunk) setInterim(interimChunk.trim());
      if (finalChunk) {
        const trimmed = finalChunk.trim();
        setFinalText(trimmed);
        setInterim('');
        if (typeof onFinal === 'function') {
          try { onFinal(trimmed); } catch { /* ignore */ }
        }
      }
    };

    recognitionRef.current = rec;
    stopRequestedRef.current = false;
    try { rec.start(); } catch { /* may already be running */ }

    return () => {
      stopRequestedRef.current = true;
      try { rec.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
      setActive(false);
      setInterim('');
    };
  }, [enabled, lang, onFinal]);

  const reset = useCallback(() => {
    setInterim('');
    setFinalText('');
    setError(null);
  }, []);

  return { supported, active, interim, finalText, error, reset };
}
