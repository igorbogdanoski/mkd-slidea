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
//
// `gaps` is [{ id, size }] from participant_blanks(), not poll.blanks. The
// stored gaps carry an accept[] array, and that array IS the answer — it used to
// ship to every participant along with the activity. The width is now computed
// in the database from those answers and clamped to the same 6–16 character
// range this component applied itself, so the field still does not spell out how
// long the answer is (a three-character box is a hint) and nothing else leaks.
const FillBlanksInput = ({ poll, gaps = [], onSubmit, disabled }) => {
  const [answers, setAnswers] = useState({});
  const parts = parsePrompt(poll?.question || '');

  const set = (id, value) => setAnswers((a) => ({ ...a, [id]: value }));
  const filled = gaps.filter((b) => String(answers[b.id] || '').trim()).length;
  const ready = gaps.length > 0 && filled === gaps.length;

  // Already clamped server-side. A gap the function did not return falls back to
  // the narrowest box rather than to a width derived from an answer.
  const widthFor = (id) => `${gaps.find((g) => g.id === id)?.size ?? 6}ch`;

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
              aria-label={`Празнина ${gaps.findIndex((b) => b.id === part.id) + 1} од ${gaps.length}`}
              style={{ width: widthFor(part.id) }}
              className="mx-1 px-2 py-1 border-b-2 border-indigo-300 focus:border-indigo-600 bg-indigo-50/40 focus:bg-white rounded-t-md text-center font-bold text-indigo-900 outline-none transition-colors disabled:opacity-60"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          )
        )}
      </p>

      {gaps.length > 1 && (
        <p className="text-xs font-semibold text-slate-500" aria-live="polite">
          Пополнети {filled} од {gaps.length}
        </p>
      )}

      <button
        onClick={() => onSubmit(answers)}
        disabled={disabled || !ready}
        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
      >
        {ready ? 'Испрати' : `Пополни ги сите празнини (${filled}/${gaps.length})`}
      </button>
    </div>
  );
};

export default FillBlanksInput;
