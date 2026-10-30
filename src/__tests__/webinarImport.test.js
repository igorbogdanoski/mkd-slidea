// The webinar deck has to survive the exact path the UI takes it through:
//   docs/webinar-vovden.json → importTemplate() → the { _aiPoll } adaptation
//   in ImportPPTXModal → handlePPTXImport's insert payload.
//
// This test does not touch the database or the browser. It pins the two things
// that broke silently before: an answer key being dropped in transit, and a
// quiz arriving with no correct option marked.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { importTemplate } from '../lib/templateImport';

const doc = JSON.parse(
  readFileSync(resolve(__dirname, '../../docs/webinar-vovden.json'), 'utf8'),
);

// Mirrors the mapping in ImportPPTXModal.handleFile for a .json file.
const toSlides = (template) =>
  template.polls.map((p, i) => ({
    index: i + 1,
    title: p.question,
    body: (p.options || []).map((o) => o.text).join(' · ').slice(0, 200),
    allText: [p.question],
    _aiPoll: {
      question: p.question,
      type: p.type,
      is_quiz: !!p.is_quiz,
      options: (p.options || []).map((o) => ({ text: o.text, is_correct: !!o.is_correct })),
    },
    _key: p.correct_answer || null,
    _explanation: p.answer_explanation || null,
    _blanks: p.blanks || null,
  }));

describe('webinar deck — import', () => {
  it('imports all seven questions with nothing skipped', () => {
    const r = importTemplate(doc);
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.skipped).toEqual([]);
    expect(r.imported).toBe(7);
  });

  it('keeps the two quizzes with exactly one correct answer each', () => {
    const quizzes = importTemplate(doc).template.polls.filter((p) => p.type === 'quiz');
    expect(quizzes).toHaveLength(2);
    for (const q of quizzes) {
      expect(q.options.filter((o) => o.is_correct)).toHaveLength(1);
    }
  });

  it('carries every presenter note through as an explanation', () => {
    const polls = importTemplate(doc).template.polls;
    for (const p of polls) {
      expect(p.answer_explanation).toBeTruthy();
    }
  });

  it('adapts into slides that handlePPTXImport can insert', () => {
    const slides = toSlides(importTemplate(doc).template);
    expect(slides).toHaveLength(7);
    for (const s of slides) {
      expect(s._aiPoll.question).toBeTruthy();
      expect(s._explanation).toBeTruthy();
      expect(['poll', 'quiz', 'open', 'wordcloud', 'rating', 'scale', 'ranking', 'fill_blanks'])
        .toContain(s._aiPoll.type);
    }
  });

  it('gives every multiple-choice activity at least two options to vote on', () => {
    const slides = toSlides(importTemplate(doc).template);
    for (const s of slides) {
      if (['poll', 'quiz', 'ranking'].includes(s._aiPoll.type)) {
        expect(s._aiPoll.options.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
