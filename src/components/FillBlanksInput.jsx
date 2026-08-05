import React, { useState } from 'react';
import { parsePrompt } from '../lib/fillBlanks';
import MathText from './MathText';

// Answering a fill-in-the-blanks question.
//
// The gaps are rendered where they occur in the sentence rather than as a
// numbered list underneath it. A blank read in context is a different, easier
// task than "answer 1, answer 2, answer 3" — the sentence is most of the
// scaffolding, and taking it away turns a comprehension question into a
// recall one.
const FillBlanksInput = ({ poll, onSubmit, disabled }) => {
  const [answers, setAnswers] = useState({});
  const parts = parsePrompt(poll?.question || '');
  const blanks = Array.isArray(poll?.blanks) ? poll.blanks : [];

  const set = (id, value) => setAnswers((a) => ({ ...a, [id]: value }));
  const filled = blanks.filter((b) => String(answers[b.id] || '').trim()).length;
  const ready = blanks.length > 0 && filled === blanks.length;

  // A gap is sized from the longest answer it accepts, so the field itself
  // does not leak how long the answer is — a three-character box is a hint.
  const widthFor = (id) => {
    const b = blanks.find((x) => x.id === id);
    const longest = Math.max(6, ...(b?.accept || []).map((a) => String(a).length));
    return `${Math.min(16, Math.max(6, longest + 3))}ch`;
  };

  return (
    <div className="space-y-6">
      <p className="text-lg leading-loose text-slate-800 font-medium">
        {parts.map((part, i) =>
          part.type === 'text' ? (
            <MathText key={i}>{part.value}</MathText>
          ) : (
            <input
              key={i}
              type="text"
              value={answers[part.id] || ''}
              onChange={(e) => set(part.id, e.target.value)}
              disabled={disabled}
              aria-label={`Празнина ${blanks.findIndex((b) => b.id === part.id) + 1} од ${blanks.length}`}
              style={{ width: widthFor(part.id) }}
              className="mx-1 px-2 py-1 border-b-2 border-indigo-300 focus:border-indigo-600 bg-indigo-50/40 focus:bg-white rounded-t-md text-center font-bold text-indigo-900 outline-none transition-colors disabled:opacity-60"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          )
        )}
      </p>

      {blanks.length > 1 && (
        <p className="text-xs font-semibold text-slate-500" aria-live="polite">
          Пополнети {filled} од {blanks.length}
        </p>
      )}

      <button
        onClick={() => onSubmit(answers)}
        disabled={disabled || !ready}
        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
      >
        {ready ? 'Испрати' : `Пополни ги сите празнини (${filled}/${blanks.length})`}
      </button>
    </div>
  );
};

export default FillBlanksInput;
