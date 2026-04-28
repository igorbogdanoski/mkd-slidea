import { useEffect } from 'react';

// Global keyboard shortcut handler.
// Skips when user is typing in input/textarea/contenteditable.
export function useKeyboardShortcuts(handlers) {
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
      const handler = handlers[key];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers]);
}
