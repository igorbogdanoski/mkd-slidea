import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
].join(',');

export function useFocusTrap(active, { onEscape } = {}) {
  const containerRef = useRef(null);
  const prevFocusRef = useRef(null);

  // Every caller passes `{ onEscape: onClose }` — a fresh object literal, and
  // usually an inline arrow behind it. Depending on that identity re-ran this
  // whole effect on every render, and each run moved focus to the first
  // focusable element in the dialog: the ✕ button. Typing one character
  // re-rendered the modal and the caret vanished mid-word.
  //
  // The handler goes in a ref so its identity is irrelevant, and the effect
  // that moves focus is keyed on `active` alone — the one thing that should
  // ever cause focus to move.
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;

  const focusablesIn = (node) =>
    Array.from(node.querySelectorAll(FOCUSABLE)).filter(
      (el) => !el.hasAttribute('aria-hidden') && el.offsetParent !== null
    );

  // Initial focus — runs when the dialog opens, and never again while it is
  // open.
  useEffect(() => {
    if (!active) return undefined;
    const node = containerRef.current;
    if (!node) return undefined;

    prevFocusRef.current = document.activeElement;

    const initial = focusablesIn(node);
    if (initial.length) {
      initial[0].focus({ preventScroll: true });
    } else {
      node.setAttribute('tabindex', '-1');
      node.focus({ preventScroll: true });
    }

    return () => {
      const prev = prevFocusRef.current;
      if (prev && typeof prev.focus === 'function') {
        try { prev.focus({ preventScroll: true }); } catch { /* ignore */ }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Tab containment and Escape — a listener, so re-running it would be
  // harmless, but it is kept off render-identity anyway.
  useEffect(() => {
    if (!active) return undefined;
    const node = containerRef.current;
    if (!node) return undefined;

    const focusables = () => focusablesIn(node);

    const onKey = (e) => {
      if (e.key === 'Escape' && typeof escapeRef.current === 'function') {
        e.stopPropagation();
        escapeRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const list = focusables();
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const current = document.activeElement;

      if (e.shiftKey) {
        if (current === first || !node.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else if (current === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);

  return containerRef;
}
