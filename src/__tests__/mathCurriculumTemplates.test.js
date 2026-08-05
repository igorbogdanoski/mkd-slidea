import { describe, it, expect } from 'vitest';
import { MATH_CURRICULUM_TEMPLATES as TEMPLATES } from '../lib/mathCurriculumTemplates';
import { looksUnclean } from '../lib/textCleanup';
import { blankIds } from '../lib/fillBlanks';

// The questions themselves were written and reviewed elsewhere — two reviewers
// plus the author. What is unreviewed is the *transformation*: mapping a
// letter key like "A" onto the right option, stripping prefixes, turning a run
// of underscores into a gap, cleaning hyphenation. A mistake there silently
// marks a correct answer wrong, in front of a class, and no amount of upstream
// review would catch it. These tests check the transformation, not the maths.

describe('the generated set', () => {
  it('has templates for every grade the export covers', () => {
    const grades = new Set(TEMPLATES.map((t) => t.grade));
    expect(grades).toContain('6 одделение');
    expect(grades).toContain('7 одделение');
    expect(grades).toContain('8 одделение');
    expect(grades).toContain('9 одделение');
  });

  it('names every grade explicitly — "Основно" is not a search term', () => {
    for (const t of TEMPLATES) {
      expect(t.grade, `${t.id} has a vague grade`).toMatch(/^\d одделение$/);
    }
  });

  it('gives every template a unique id and title within its grade', () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);

    // Distinct titles per grade are the point of grouping by title: two pages
    // with one name compete for the same phrase and neither ranks.
    const perGrade = {};
    for (const t of TEMPLATES) (perGrade[t.grade] ||= []).push(t.title);
    for (const [grade, titles] of Object.entries(perGrade)) {
      expect(new Set(titles).size, `${grade} has duplicate titles`).toBe(titles.length);
    }
  });

  it('carries no PDF hyphenation into a public title', () => {
    const dirty = TEMPLATES.filter((t) => looksUnclean(t.title) || looksUnclean(t.description));
    expect(dirty.map((t) => t.title)).toEqual([]);
  });
});

describe('every activity is answerable', () => {
  const polls = TEMPLATES.flatMap((t) => t.polls.map((p) => ({ ...p, _id: t.id })));

  it('produced a meaningful number of activities', () => {
    expect(polls.length).toBeGreaterThan(1000);
  });

  it('every quiz has exactly one correct option', () => {
    for (const p of polls.filter((x) => x.type === 'quiz')) {
      const correct = p.options.filter((o) => o.is_correct).length;
      expect(correct, `${p._id}: "${p.question.slice(0, 50)}" has ${correct} correct options`).toBe(1);
    }
  });

  it('every quiz has at least two options, none of them empty', () => {
    for (const p of polls.filter((x) => x.type === 'quiz')) {
      expect(p.options.length, p._id).toBeGreaterThanOrEqual(2);
      for (const o of p.options) expect(String(o.text).trim(), `${p._id} has a blank option`).not.toBe('');
    }
  });

  // The bank stores choices as "A) …" with correctAnswer "A". If the prefix
  // survived into the option text, the letter would show up twice on screen
  // and the answer key would be ambiguous.
  it('stripped the letter prefixes from option text', () => {
    const withPrefix = polls
      .filter((x) => x.type === 'quiz')
      .flatMap((p) => p.options.filter((o) => /^[A-DА-Г]\)\s/.test(o.text)).map((o) => `${p._id}: ${o.text}`));
    expect(withPrefix.slice(0, 5)).toEqual([]);
  });

  it('every open question carries the answer it is meant to reveal', () => {
    for (const p of polls.filter((x) => x.type === 'open')) {
      expect(String(p.correct_answer || '').trim(), p._id).not.toBe('');
    }
  });

  it('every fill_blanks question has a gap in the text and an answer for it', () => {
    for (const p of polls.filter((x) => x.type === 'fill_blanks')) {
      const ids = blankIds(p.question);
      expect(ids.length, `${p._id} has no {{gap}} in its text`).toBeGreaterThan(0);
      for (const id of ids) {
        const blank = p.blanks.find((b) => b.id === id);
        expect(blank, `${p._id} gap ${id} has no answer`).toBeTruthy();
        expect(blank.accept.filter(Boolean).length, `${p._id} gap ${id} accepts nothing`).toBeGreaterThan(0);
      }
    }
  });

  it('left no underscore runs behind when converting a gap', () => {
    const leftovers = polls
      .filter((x) => x.type === 'fill_blanks' && /_{2,}/.test(x.question))
      .map((p) => p._id);
    expect(leftovers.slice(0, 5)).toEqual([]);
  });

  it('uses only activity types this app can render', () => {
    const types = new Set(polls.map((p) => p.type));
    expect([...types].sort()).toEqual(['fill_blanks', 'open', 'quiz']);
  });
});
