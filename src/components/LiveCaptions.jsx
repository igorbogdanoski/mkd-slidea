import React, { useEffect, useRef, useState } from 'react';
import { Captions, CaptionsOff, X, AlertCircle } from 'lucide-react';
import { useLiveCaptions } from '../hooks/useLiveCaptions';

// High-contrast WCAG AA subtitle bar pinned to bottom of screen.
// Accessible: role="status" + aria-live="polite" so screen readers
// announce final transcripts without spamming on interim updates.
const LiveCaptions = ({ lang = 'mk-MK', defaultEnabled = false, onTranscript }) => {
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [history, setHistory] = useState([]);
  const containerRef = useRef(null);

  const { supported, active, interim, error, reset } = useLiveCaptions({
    lang,
    enabled,
    onFinal: (text) => {
      setHistory((prev) => {
        const next = [...prev, text];
        return next.length > 6 ? next.slice(next.length - 6) : next;
      });
      if (typeof onTranscript === 'function') {
        try { onTranscript(text); } catch { /* ignore */ }
      }
    },
  });

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history, interim]);

  const toggle = () => {
    if (!supported) return;
    setEnabled((v) => {
      const next = !v;
      if (!next) reset();
      return next;
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={enabled}
        aria-label={enabled ? 'Исклучи титлови' : 'Вклучи титлови во живо'}
        title={supported ? (enabled ? 'Исклучи титлови (CC)' : 'Вклучи титлови во живо (CC)') : 'Прелистувачот не поддржува препознавање на говор'}
        disabled={!supported}
        className={`fixed bottom-6 right-6 z-[60] p-3.5 rounded-2xl shadow-2xl border-2 transition-all backdrop-blur-md ${
          !supported
            ? 'bg-slate-800/70 border-slate-700 text-slate-500 cursor-not-allowed'
            : enabled
              ? 'bg-emerald-500 border-emerald-400 text-white hover:bg-emerald-600 active:scale-95'
              : 'bg-slate-900/80 border-slate-700 text-white hover:bg-slate-800 active:scale-95'
        }`}
      >
        {enabled ? <Captions className="w-5 h-5" /> : <CaptionsOff className="w-5 h-5" />}
        {active && enabled && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 animate-pulse" aria-hidden="true" />
        )}
      </button>

      {enabled && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="false"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[55] w-[min(95vw,900px)] pointer-events-none"
        >
          <div
            ref={containerRef}
            className="bg-black/85 backdrop-blur-md border-2 border-white/10 rounded-2xl px-6 py-4 max-h-40 overflow-y-auto shadow-2xl pointer-events-auto"
            style={{ scrollBehavior: 'smooth' }}
          >
            {error === 'unsupported' && (
              <p className="text-amber-300 font-bold flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                Прелистувачот не поддржува препознавање на говор.
              </p>
            )}
            {error === 'not-allowed' && (
              <p className="text-rose-300 font-bold flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                Дозволи микрофон за титлови.
              </p>
            )}
            {!error && history.length === 0 && !interim && (
              <p className="text-slate-300 font-bold text-base text-center">
                {active ? 'Слушам... зборувај природно.' : 'Се поврзува со микрофонот...'}
              </p>
            )}
            {history.map((line, i) => (
              <p
                key={i}
                className={`text-white font-black tracking-wide leading-snug ${
                  i === history.length - 1 ? 'text-2xl md:text-3xl' : 'text-lg opacity-60'
                }`}
              >
                {line}
              </p>
            ))}
            {interim && (
              <p className="text-amber-200 italic text-xl md:text-2xl font-bold leading-snug mt-1">
                {interim}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default LiveCaptions;
