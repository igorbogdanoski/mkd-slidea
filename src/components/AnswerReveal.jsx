import React from 'react';
import { CheckCircle2, Lightbulb } from 'lucide-react';
import MathText from './MathText';

// Shown once the host reveals the answer to an open or fill-in-the-blanks
// question.
//
// It deliberately does not tell the student whether *they* were right. For an
// open question nothing has marked them, and for blanks the check is advisory
// — Macedonian inflects, and a confident "неточно" in front of a class for an
// answer a teacher would have accepted is the failure mode worth avoiding. The
// student sees the answer and judges their own against it, which is also the
// better learning moment.
const AnswerReveal = ({ poll, given }) => {
  const answer = poll?.correct_answer;
  const explanation = poll?.answer_explanation;
  const blanks = Array.isArray(poll?.blanks) ? poll.blanks : [];

  if (!answer && !explanation && !blanks.length) return null;

  return (
    <div className="mt-6 rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-6 space-y-4" role="region" aria-label="Точен одговор">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Точен одговор</span>
      </div>

      {blanks.length > 0 ? (
        <ul className="space-y-2">
          {blanks.map((b, i) => (
            <li key={b.id} className="flex flex-wrap items-baseline gap-2 text-slate-800">
              <span className="text-xs font-semibold text-slate-500">{i + 1}.</span>
              <MathText className="font-bold text-emerald-800">{(b.accept || [])[0] || ''}</MathText>
              {/* Alternates go through MathText too. Left as plain strings a
                  student reads "\in" — the source, not the symbol — which is
                  the exact failure the renderer exists to prevent. */}
              {(b.accept || []).length > 1 && (
                <span className="text-xs text-slate-500">
                  (се прифаќа и:{' '}
                  {(b.accept || []).slice(1).map((alt, k) => (
                    <React.Fragment key={k}>
                      {k > 0 && ', '}
                      <MathText>{/^\\[a-zA-Z]/.test(alt) ? `$${alt}$` : alt}</MathText>
                    </React.Fragment>
                  ))}
                  )
                </span>
              )}
              {given?.[b.id] != null && String(given[b.id]).trim() !== '' && (
                <span className="text-xs text-slate-500">· ти напиша: „{String(given[b.id])}"</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <MathText as="p" className="text-lg font-bold text-emerald-900">{answer}</MathText>
      )}

      {explanation && (
        <div className="flex gap-2 pt-2 border-t border-emerald-200">
          <Lightbulb size={16} className="text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
          <MathText as="p" className="text-sm text-slate-700 leading-relaxed">{explanation}</MathText>
        </div>
      )}
    </div>
  );
};

export default AnswerReveal;
