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

// A command is a short utterance that is *only* the command. Anything longer
// is someone teaching.
//
// This used to be `text.includes(w)` over the whole transcript, with the
// microphone continuously open in front of a person who talks for a living.
// "Ајде да продолжиме" contains продолжи. "Одиме напред" contains напред.
// "Врати се назад" contains назад. Every other sentence of an ordinary lesson
// was a slide command, so the deck ran away forward and going back was
// impossible: you stepped back, said one more thing to the class, and the
// sentence threw you forward again.
//
// Three rules now, and a command has to pass all three:
//   1. whole words only — no matching inside a longer word;
//   2. at most MAX_COMMAND_WORDS words in the utterance, so a sentence that
//      merely contains the keyword is not a command;
//   3. every word must belong to the command (filler like "оди" aside), so
//      "следна недела имаме тест" cannot pass on length alone.
const MAX_COMMAND_WORDS = 3;

// Words allowed to accompany a keyword without making it a sentence.
const FILLER = new Set(['оди', 'одиме', 'ајде', 'се', 'на', 'го', 'ја', 'слајд', 'слајдот', 'please', 'go', 'the', 'slide']);

export const normaliseTranscript = (t) =>
  String(t || '')
    .toLowerCase()
    .replace(/[.,!?;:„"“”'()-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

export const matchAction = (transcript) => {
  const words = normaliseTranscript(transcript);
  if (words.length === 0 || words.length > MAX_COMMAND_WORDS) return null;

  let found = null;
  for (const word of words) {
    let isKeyword = false;
    for (const [action, keywords] of Object.entries(KEYWORD_SETS)) {
      if (keywords.includes(word)) {
        // Two different commands in one utterance is ambiguous, not a command.
        if (found && found !== action) return null;
        found = action;
        isKeyword = true;
        break;
      }
    }
    if (!isKeyword && !FILLER.has(word)) return null;
  }
  return found;
};

const COMMAND_COOLDOWN_MS = 1500;
const MIN_CONFIDENCE = 0.6;

export function useVoiceCommands(handlers = {}, { lang = 'mk-MK' } = {}) {
  const lastActionAtRef = useRef(0);
  const [listening, setListening] = useState(false);
  const [lastHeard, setLastHeard] = useState('');
  const [error, setError] = useState(null);
  const recRef = useRef(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  // Tracks the intended listening state via a ref, not the `listening` state
  // value — `onend` is a closure captured at `start()`-time, so reading the
  // `listening` state there would always see the stale value from that
  // render (false, since `start()` runs before `setListening(true)` commits),
  // permanently disabling auto-restart. A ref is always current.
  const listeningRef = useRef(false);

  const SR =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const supported = !!SR;

  const stop = useCallback(() => {
    listeningRef.current = false;
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
        const alt = last?.[0];
        const heard = alt?.transcript?.trim() || '';
        if (!heard) return;
        setLastHeard(heard);

        // Speech recognition reports how sure it is; acting on a guess moves
        // the slide in front of a room. Some engines report 0 for every
        // result, so an absent or zero score is not treated as a rejection.
        if (typeof alt.confidence === 'number' && alt.confidence > 0 && alt.confidence < MIN_CONFIDENCE) return;

        const action = matchAction(heard);
        if (!action) return;

        // One command at a time. Recognition can emit several finals in quick
        // succession for one phrase, and without this the deck skips three
        // activities on a single "следна".
        const now = Date.now();
        if (now - lastActionAtRef.current < COMMAND_COOLDOWN_MS) return;
        lastActionAtRef.current = now;

        if (typeof handlersRef.current[action] === 'function') {
          handlersRef.current[action]();
        }
      };
      rec.onerror = (e) => {
        if (e.error === 'no-speech' || e.error === 'aborted') return;
        setError(e.error || 'recognition-error');
      };
      rec.onend = () => {
        // Auto-restart while user keeps "listening" toggled on.
        if (recRef.current === rec && listeningRef.current) {
          try { rec.start(); } catch { /* ignored */ }
        }
      };

      recRef.current = rec;
      listeningRef.current = true;
      rec.start();
      setListening(true);
      setError(null);
    } catch (e) {
      listeningRef.current = false;
      setError(e.message || 'recognition-failed');
      setListening(false);
    }
  }, [SR, lang]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => () => stop(), [stop]);

  return { supported, listening, lastHeard, error, start, stop, toggle };
}
