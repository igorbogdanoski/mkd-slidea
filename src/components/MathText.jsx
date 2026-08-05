import React, { useEffect, useState } from 'react';
import { hasMath, splitMath, toSpokenText } from '../lib/mathText';

// Renders question and option text that may contain $…$ LaTeX.
//
// Two things drive the design:
//
// 1. KaTeX loads only when a string actually contains math. Most events on
//    this platform are not maths lessons, and a language teacher's poll should
//    not pay ~270KB on a school phone for a feature it never uses. Strings
//    without a math span take the plain-text path and never touch the import.
//
// 2. KaTeX output is decorative markup — spans positioned to look like
//    mathematics. A screen reader given that says nothing useful, and given
//    raw TeX says "backslash in". So the accessible name is built separately
//    from the spoken forms in lib/mathText.js, and the visual output is hidden
//    from assistive tech.

let katexPromise = null;
const loadKatex = () => {
  if (!katexPromise) {
    katexPromise = Promise.all([
      import('katex'),
      import('katex/dist/katex.min.css'),
    ]).then(([mod]) => mod.default || mod);
  }
  return katexPromise;
};

const MathText = ({ children, className = '', as: Tag = 'span' }) => {
  const text = typeof children === 'string' ? children : String(children ?? '');
  const containsMath = hasMath(text);
  const [katex, setKatex] = useState(null);

  useEffect(() => {
    if (!containsMath) return;
    let alive = true;
    loadKatex().then((k) => { if (alive) setKatex(k); }).catch(() => { /* fall back to source text */ });
    return () => { alive = false; };
  }, [containsMath]);

  if (!containsMath) return <Tag className={className}>{text}</Tag>;

  const spoken = toSpokenText(text);

  // Before KaTeX arrives — and if it never does, e.g. the chunk fails on a bad
  // connection — show the readable spoken form rather than raw TeX. A student
  // seeing "припаѓа на" is inconvenienced; one seeing "$\in$" thinks the app
  // is broken.
  if (!katex) {
    return <Tag className={className}>{spoken}</Tag>;
  }

  const html = splitMath(text)
    .map((part) => {
      if (part.type === 'text') {
        return part.value
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      try {
        // trust:false keeps \href and \url out of the output — this is
        // curriculum content, but it still arrives from the database.
        return katex.renderToString(part.value, {
          throwOnError: false,
          trust: false,
          strict: false,
          displayMode: false,
        });
      } catch {
        return part.value;
      }
    })
    .join('');

  return (
    <Tag className={className} aria-label={spoken}>
      <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
    </Tag>
  );
};

export default MathText;
