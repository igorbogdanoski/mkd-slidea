import { describe, it, expect } from 'vitest';
import { MATURA_TEMPLATES as TEMPLATES } from '../lib/maturaTemplates';
import { looksUnclean } from '../lib/textCleanup';

// The questions are real state exam papers. What is unreviewed is the
// transformation — resolving a letter key onto the right choice, and three
// filters that each keep something out of a classroom.

const polls = TEMPLATES.flatMap((t) => t.polls.map((p) => ({ ...p, _t: t.title })));

describe('the matura set', () => {
  it('produced a usable number of templates', () => {
    expect(TEMPLATES.length).toBeGreaterThan(50);
    expect(polls.length).toBeGreaterThan(300);
  });

  it('gives every template a distinct id and title', () => {
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
    expect(new Set(TEMPLATES.map((t) => t.title)).size).toBe(TEMPLATES.length);
  });

  it('names the topic in the title — the search term is the topic, not the exam', () => {
    for (const t of TEMPLATES) {
      expect(t.title).toMatch(/^Матура: .+/);
      expect(t.title.replace('Матура: ', '').length).toBeGreaterThan(2);
    }
  });

  it('carries no PDF hyphenation into a public title', () => {
    expect(TEMPLATES.filter((t) => looksUnclean(t.title)).map((t) => t.title)).toEqual([]);
  });

  it('never publishes a template with fewer than three questions', () => {
    for (const t of TEMPLATES) expect(t.polls.length, t.title).toBeGreaterThanOrEqual(3);
  });
});

// The bank holds 1,574 Macedonian, 706 Albanian and 706 Turkish questions in
// one collection. Unfiltered, Albanian questions appear in Macedonian
// templates — and the `language` field is the only thing separating them.
describe('language filtering', () => {
  // LaTeX commands are Latin letters, so \frac and \sqrt make a maths-heavy
  // Macedonian question look foreign to a naive script check. Strip the maths
  // before judging, or this test fails on correct content.
  const stripMath = (t) => String(t).replace(/\$[^$]*\$/g, ' ').replace(/\\[a-zA-Z]+/g, ' ');

  it('every question reads as Macedonian once the maths is removed', () => {
    const foreign = polls.filter((p) => {
      const s = stripMath(p.question);
      const latin = (s.match(/[a-zA-Z]/g) || []).length;
      const cyrillic = (s.match(/[а-шѓѕјљњќџ]/gi) || []).length;
      return latin > cyrillic && latin > 5;
    });
    expect(foreign.map((p) => `${p._t}: ${p.question.slice(0, 60)}`)).toEqual([]);
  });
});

describe('every activity is answerable', () => {
  it('every quiz has exactly one correct choice', () => {
    for (const p of polls.filter((x) => x.type === 'quiz')) {
      const correct = p.options.filter((o) => o.is_correct).length;
      expect(correct, `${p._t}: "${p.question.slice(0, 50)}"`).toBe(1);
    }
  });

  it('no choice is blank', () => {
    for (const p of polls.filter((x) => x.type === 'quiz')) {
      for (const o of p.options) expect(String(o.text).trim(), p._t).not.toBe('');
    }
  });

  it('every open question carries the answer it will reveal', () => {
    for (const p of polls.filter((x) => x.type === 'open')) {
      expect(String(p.correct_answer || '').trim(), p._t).not.toBe('');
    }
  });

  // 106 questions in the bank depend on a figure that is not in the export.
  // Shown without it they cannot be answered at all.
  it('no question refers to a figure that was not exported', () => {
    const referencing = polls.filter((p) => /на\s+сликата|дадена\s+слика|види\s+слика/i.test(p.question));
    expect(referencing.map((p) => p._t)).toEqual([]);
  });

  it('uses only activity types this app can render', () => {
    expect([...new Set(polls.map((p) => p.type))].sort()).toEqual(['open', 'quiz']);
  });
});
