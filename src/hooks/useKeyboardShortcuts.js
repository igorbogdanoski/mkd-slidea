import { useEffect, useRef } from 'react';

// Global keyboard shortcut handler.
// Skips when user is typing in input/textarea/contenteditable.
export function useKeyboardShortcuts(handlers) {
  // Callers typically pass a fresh object literal every render (e.g.
  // `useKeyboardShortcuts({ '?': () => ... })`), which would otherwise
  // remove and re-add the window listener on every render. Read the latest
  // handlers via a ref instead, so the listener effect only needs to run once.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const onKey = (e) => {
      const target = e.target;
      const isEditable = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );
      if (isEditable) return;

      const key = e.key === ' ' ? 'Space' : e.key;
      const handler = handlersRef.current[key];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
