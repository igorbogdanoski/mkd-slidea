import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// Sprint 4.1 WCAG — Global ARIA live region announcer.
// Provides imperative `announce(text, { assertive })` for any component to
// push text to screen-reader users without visually changing the UI.
// Uses two regions (polite + assertive) per W3C ARIA APG guidance, and clears
// after a short delay so repeated identical strings still get announced.
// Implemented with React.createElement to keep the file `.js` (no JSX transform needed).

const LiveAnnouncerContext = createContext({ announce: () => {} });

export const useLiveAnnouncer = () => useContext(LiveAnnouncerContext);

export const LiveAnnouncerProvider = ({ children }) => {
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');
  const politeTimer = useRef(null);
  const assertiveTimer = useRef(null);

  useEffect(() => () => {
    if (politeTimer.current) clearTimeout(politeTimer.current);
    if (assertiveTimer.current) clearTimeout(assertiveTimer.current);
  }, []);

  const announce = useCallback((text, opts = {}) => {
    const msg = String(text || '').trim();
    if (!msg) return;
    if (opts.assertive) {
      setAssertive('');
      requestAnimationFrame(() => setAssertive(msg));
      if (assertiveTimer.current) clearTimeout(assertiveTimer.current);
      assertiveTimer.current = setTimeout(() => setAssertive(''), 1500);
    } else {
      setPolite('');
      requestAnimationFrame(() => setPolite(msg));
      if (politeTimer.current) clearTimeout(politeTimer.current);
      politeTimer.current = setTimeout(() => setPolite(''), 1500);
    }
  }, []);

  return React.createElement(
    LiveAnnouncerContext.Provider,
    { value: { announce } },
    children,
    React.createElement(
      'div',
      { 'aria-live': 'polite', 'aria-atomic': 'true', role: 'status', className: 'sr-only' },
      polite
    ),
    React.createElement(
      'div',
      { 'aria-live': 'assertive', 'aria-atomic': 'true', role: 'alert', className: 'sr-only' },
      assertive
    )
  );
};

export default useLiveAnnouncer;
