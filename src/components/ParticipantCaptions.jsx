import React, { useEffect, useRef, useState } from 'react';
import { Captions, CaptionsOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Sprint 4.3 — receives presenter's caption broadcasts and renders an
// accessible high-contrast bar at the bottom of participant screens.
// Toggle persists in localStorage; default OFF (data + battery friendly).
const ParticipantCaptions = ({ eventCode }) => {
  const STORAGE_KEY = 'mkd_pc_enabled';
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
  });
  const [history, setHistory] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !eventCode) return undefined;
    const code = String(eventCode).toUpperCase();
    const ch = supabase
      .channel(`captions:${code}`, { config: { broadcast: { self: false, ack: false } } })
      .on('broadcast', { event: 'caption' }, (msg) => {
        const text = String(msg?.payload?.text || '').trim();
        if (!text) return;
        setHistory((prev) => {
          const next = [...prev, text];
          return next.length > 5 ? next.slice(next.length - 5) : next;
        });
      });
    ch.subscribe();
    return () => { try { supabase.removeChannel(ch); } catch { /* ignore */ } };
  }, [enabled, eventCode]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

  const toggle = () => {
    setEnabled((v) => {
      const next = !v;
      try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch { /* ignore */ }
      if (!next) setHistory([]);
      return next;
    });
  };

  if (!eventCode) return null;

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={enabled}
        aria-label={enabled ? 'Исклучи титлови од наставникот' : 'Вклучи титлови од наставникот'}
        title={enabled ? 'Исклучи титлови (CC)' : 'Вклучи титлови во живо (CC)'}
        className={`fixed bottom-6 right-6 z-[60] p-3 rounded-2xl shadow-xl border-2 transition-all backdrop-blur-md ${
          enabled
            ? 'bg-emerald-500 border-emerald-400 text-white hover:bg-emerald-600 active:scale-95'
            : 'bg-white/90 border-slate-200 text-slate-700 hover:bg-white active:scale-95'
        }`}
      >
        {enabled ? <Captions className="w-5 h-5" /> : <CaptionsOff className="w-5 h-5" />}
      </button>

      {enabled && history.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="false"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[55] w-[min(95vw,720px)] pointer-events-none"
        >
          <div
            ref={containerRef}
            className="bg-black/85 backdrop-blur-md border-2 border-white/10 rounded-2xl px-5 py-3 max-h-32 overflow-y-auto shadow-2xl pointer-events-auto"
            style={{ scrollBehavior: 'smooth' }}
          >
            {history.map((line, i) => (
              <p
                key={i}
                className={`text-white font-black tracking-wide leading-snug ${
                  i === history.length - 1 ? 'text-xl md:text-2xl' : 'text-base opacity-60'
                }`}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ParticipantCaptions;
