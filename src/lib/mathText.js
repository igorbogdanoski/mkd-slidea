// Helpers for question text that may contain LaTeX.
//
// The curriculum quiz bank is 95% LaTeX — "Симболот $\in$ означува…",
// options like "A) $A = \{2, 4, 6, 8\}$". Rendered as plain text a student
// sees the source, which reads as a broken app in front of a whole class.
//
// This module answers two questions the UI needs: does this string contain
// math at all (so the renderer can stay out of the way when it does not), and
// what should a screen reader say (KaTeX's own output is decorative markup).

// $…$ inline math. Escaped \$ is a literal dollar sign, not a delimiter, so a
// price like "\$5" does not open a math span.
const MATH_SPAN = /(?<!\\)\$([^$]+?)(?<!\\)\$/g;

/** Cheap check so non-math polls never pay for the renderer. */
export function hasMath(text) {
  if (!text || typeof text !== 'string') return false;
  MATH_SPAN.lastIndex = 0;
  return MATH_SPAN.test(text);
}

/**
 * Splits a string into alternating plain and math segments, in order.
 * Returns [{ type: 'text' | 'math', value }].
 */
export function splitMath(text) {
  const input = String(text ?? '');
  const parts = [];
  let last = 0;
  MATH_SPAN.lastIndex = 0;
  let m;
  while ((m = MATH_SPAN.exec(input)) !== null) {
    if (m.index > last) parts.push({ type: 'text', value: input.slice(last, m.index) });
    parts.push({ type: 'math', value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < input.length) parts.push({ type: 'text', value: input.slice(last) });
  return parts.length ? parts : [{ type: 'text', value: input }];
}

// Spoken forms for the symbols this curriculum actually uses. A screen reader
// given raw TeX says "backslash in", and given KaTeX's HTML says nothing
// useful at all, so the accessible name is built from this instead.
const SPOKEN = [
  [/\\in\b/g, ' припаѓа на '],
  [/\\notin\b/g, ' не припаѓа на '],
  [/\\subset\b/g, ' е подмножество на '],
  [/\\subseteq\b/g, ' е подмножество или еднакво на '],
  [/\\cup\b/g, ' унија '],
  [/\\cap\b/g, ' пресек '],
  [/\\emptyset\b/g, ' празно множество '],
  [/\\neq\b/g, ' не е еднакво на '],
  [/\\leq\b/g, ' помало или еднакво на '],
  [/\\geq\b/g, ' поголемо или еднакво на '],
  [/\\times\b/g, ' пати '],
  [/\\cdot\b/g, ' пати '],
  [/\\div\b/g, ' поделено со '],
  [/\\pm\b/g, ' плус минус '],
  [/\\sim\b/g, ' е истобројно со '],
  [/\\infty\b/g, ' бесконечност '],
  [/\\pi\b/g, ' пи '],
  [/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, ' $1 поделено со $2 '],
  [/\\sqrt\{([^{}]+)\}/g, ' квадратен корен од $1 '],
  [/\\text\{([^{}]*)\}/g, '$1'],
  [/\\mathbb\{([^{}]*)\}/g, '$1'],
  [/\\mid\b/g, ' такви што '],
  [/\\ldots|\\dots/g, ' и така натаму '],
];

/** A plain-language rendering of one math segment, for aria-label. */
export function mathToSpoken(tex) {
  let out = String(tex ?? '');
  for (const [pattern, replacement] of SPOKEN) out = out.replace(pattern, replacement);
  return out
    // Escaped literals — \{ \} \% \$ \& \# \_ — keep the character, drop the
    // backslash. Set notation is full of \{…\}, and leaving these to the
    // unknown-command sweep below strips the letters but not the slashes.
    .replace(/\\([{}%$&#_])/g, '$1')
    .replace(/\\[a-zA-Z]+/g, ' ')  // anything still unmapped: drop the command
    .replace(/[{}]/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')  // the substitutions leave space before punctuation
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * The whole string as something worth reading aloud — plain parts kept,
 * math parts spoken. Used for aria-label and for the live announcer.
 */
export function toSpokenText(text) {
  return splitMath(text)
    .map((p) => (p.type === 'math' ? mathToSpoken(p.value) : p.value))
    .join('')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
