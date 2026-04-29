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

  useEffect(() => {
    if (!active) return undefined;

    prevFocusRef.current = document.activeElement;

    const node = containerRef.current;
    if (!node) return undefined;

    const focusables = () =>
      Array.from(node.querySelectorAll(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('aria-hidden') && el.offsetParent !== null
      );

    const initial = focusables();
    if (initial.length) {
      initial[0].focus({ preventScroll: true });
    } else {
      node.setAttribute('tabindex', '-1');
      node.focus({ preventScroll: true });
    }

    const onKey = (e) => {
      if (e.key === 'Escape' && typeof onEscape === 'function') {
        e.stopPropagation();
        onEscape();
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

    return () => {
      document.removeEventListener('keydown', onKey);
      const prev = prevFocusRef.current;
      if (prev && typeof prev.focus === 'function') {
        try { prev.focus({ preventScroll: true }); } catch { /* ignore */ }
      }
    };
  }, [active, onEscape]);

  return containerRef;
}
