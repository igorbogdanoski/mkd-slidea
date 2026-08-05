import { describe, it, expect } from 'vitest';
import { importTemplate, mathTaskToActivities, readOutcomes, IMPORT_VERSION } from '../lib/templateImport';

const valid = {
  slidea_import: 1,
  title: 'Дропки — вежби',
  subject: 'Математика',
  grade: '6 одделение',
  source: { app: 'MathDigitizer', url: 'https://example.mk/lesson' },
  activities: [
    { type: 'quiz', question: 'Колку е $1/2 + 1/4$?', options: [{ text: '3/4', correct: true }, { text: '2/6' }], explanation: 'Заеднички именител.' },
    { type: 'open', question: 'Објасни што е дропка.', answer: 'Дел од целина' },
  ],
};

describe('importTemplate — a good file', () => {
  it('imports every activity', () => {
    const r = importTemplate(valid);
    expect(r.ok).toBe(true);
    expect(r.imported).toBe(2);
    expect(r.skipped).toEqual([]);
    expect(r.template.polls).toHaveLength(2);
  });

  it('keeps provenance with the content', () => {
    // A teacher deciding whether to trust a question deserves to know where it
    // came from, and a wrong answer needs a trail back to the tool.
    const r = importTemplate(valid);
    expect(r.template.source).toBe('MathDigitizer');
    expect(r.template.source_url).toBe('https://example.mk/lesson');
  });

  it('accepts the document as a JSON string too', () => {
    expect(importTemplate(JSON.stringify(valid)).ok).toBe(true);
  });

  it('marks the correct option on a quiz', () => {
    const quiz = importTemplate(valid).template.polls[0];
    expect(quiz.is_quiz).toBe(true);
    expect(quiz.options.filter((o) => o.is_correct)).toHaveLength(1);
    expect(quiz.options.find((o) => o.is_correct).text).toBe('3/4');
  });
});

describe('importTemplate — refusing to guess', () => {
  // The failure that reaches a whole class at once.
  it('drops a quiz with no correct option rather than picking one', () => {
    const r = importTemplate({
      ...valid,
      activities: [{ type: 'quiz', question: 'Колку?', options: [{ text: 'A' }, { text: 'Б' }] }],
    });
    expect(r.ok).toBe(false);
    expect(r.skipped.join(' ')).toMatch(/точно еден точен одговор/);
  });

  it('drops a quiz with two correct options', () => {
    const r = importTemplate({
      ...valid,
      activities: [{ type: 'quiz', question: 'Колку?', options: [{ text: 'A', correct: true }, { text: 'Б', correct: true }] }],
    });
    expect(r.skipped.join(' ')).toMatch(/има 2/);
  });

  it('drops a fill_blanks whose gap has no answer', () => {
    const r = importTemplate({
      ...valid,
      activities: [{ type: 'fill_blanks', question: 'Два и два се {{b1}}.', blanks: [] }],
    });
    expect(r.skipped.join(' ')).toMatch(/нема прифатен одговор/);
  });

  it('drops a type this app cannot render', () => {
    // Reaching a projector as a blank is worse than not arriving at all.
    const r = importTemplate({ ...valid, activities: [{ type: 'matching', question: 'Спарувај ги' }] });
    expect(r.skipped.join(' ')).toMatch(/непознат тип/);
  });
});

describe('importTemplate — partial import', () => {
  it('imports the good activities and reports the rest', () => {
    // Refusing a whole file for one bad row teaches people to fix their
    // exporter by deleting content.
    const r = importTemplate({
      ...valid,
      activities: [
        valid.activities[0],
        { type: 'quiz', question: 'Скршено', options: [{ text: 'само една' }] },
        valid.activities[1],
      ],
    });
    expect(r.ok).toBe(true);
    expect(r.imported).toBe(2);
    expect(r.skipped).toHaveLength(1);
    expect(r.skipped[0]).toMatch(/активност 2/);
  });
});

describe('importTemplate — bad input', () => {
  it('explains a malformed file instead of throwing', () => {
    const r = importTemplate('{ not json');
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/не е валиден JSON/);
  });

  it('rejects a file that is not an interchange document', () => {
    expect(importTemplate({ foo: 'bar' }).errors.join(' ')).toMatch(/slidea_import/);
  });

  it('needs a title and at least one activity', () => {
    expect(importTemplate({ slidea_import: 1, activities: [] }).errors.join(' ')).toMatch(/наслов/);
  });

  it('accepts a newer file rather than refusing it outright', () => {
    // A future version usually still holds activities this one understands.
    const r = importTemplate({ ...valid, slidea_import: IMPORT_VERSION + 1 });
    expect(r.ok).toBe(true);
    expect(r.skipped.join(' ')).toMatch(/верзија/);
  });

  it('survives null and nonsense', () => {
    for (const junk of [null, undefined, 42, [], '']) {
      expect(() => importTemplate(junk)).not.toThrow();
      expect(importTemplate(junk).ok).toBe(false);
    }
  });
});

// The whole point of the shared vocabulary: four tools, one word for "this is
// about percentages in grade six", and it is the state's word, not ours.
describe('БРО outcome codes — the join key between the tools', () => {
  it('reads outcomes from any of the three spellings a tool might use', () => {
    expect(readOutcomes({ outcomes: ['МА.6.2.3'] })).toEqual(['МА.6.2.3']);
    expect(readOutcomes({ curriculum: { outcomes: ['МА.6.2.3'] } })).toEqual(['МА.6.2.3']);
    expect(readOutcomes({ curriculum_tags: ['МА.6.2.3'] })).toEqual(['МА.6.2.3']);
  });

  it('normalises case and whitespace, and drops duplicates', () => {
    expect(readOutcomes({ outcomes: [' ма.6.2.3 ', 'МА.6.2.3'] })).toEqual(['МА.6.2.3']);
  });

  it('ignores anything that is not an outcome code', () => {
    // A free-text topic is not a join key — silently keeping it would make
    // two tools believe they agree when they do not.
    expect(readOutcomes({ outcomes: ['проценти', '', null, 'I-A.1', 42] })).toEqual([]);
  });

  it('tags every activity with the document outcomes', () => {
    const r = importTemplate({ ...valid, curriculum: { outcomes: ['МА.6.2.3'] } });
    expect(r.template.curriculum_tags).toEqual(['МА.6.2.3']);
    for (const p of r.template.polls) expect(p.curriculum_tags).toEqual(['МА.6.2.3']);
  });

  it('lets an activity override the document', () => {
    const r = importTemplate({
      ...valid,
      outcomes: ['МА.6.2.3'],
      activities: [{ ...valid.activities[1], outcomes: ['МА.6.4.1'] }],
    });
    expect(r.template.polls[0].curriculum_tags).toEqual(['МА.6.4.1']);
  });

  it('leaves the tags empty rather than inventing one', () => {
    const r = importTemplate(valid);
    expect(r.template.curriculum_tags).toBe(null);
    expect(r.template.polls[0].curriculum_tags).toBe(null);
  });
});

describe('mathTaskToActivities', () => {
  // The reason this mapping is worth writing down: MathDigitizer records the
  // mistakes students actually make, which are exactly the distractors a
  // multiple-choice question wants — wrong answers that mean something.
  it('turns recorded misconceptions into the wrong answers', () => {
    const [activity] = mathTaskToActivities([{
      title: 'Собери $1/2 + 1/4$',
      solution_steps: ['Заеднички именител 4', '3/4'],
      misconceptions: [
        { mistake: '2/6', teacher_reaction: 'Собрал именители' },
        { mistake: '1/6', teacher_reaction: '…' },
      ],
    }]);

    expect(activity.type).toBe('quiz');
    expect(activity.options[0]).toEqual({ text: '3/4', correct: true });
    expect(activity.options.map((o) => o.text)).toContain('2/6');
  });

  it('falls back to an open question when there are too few misconceptions', () => {
    const [activity] = mathTaskToActivities([{
      title: 'Објасни што е дропка',
      solution_steps: ['Дел од целина'],
      misconceptions: [{ mistake: 'Само цел број' }],
    }]);
    expect(activity.type).toBe('open');
    expect(activity.answer).toBe('Дел од целина');
  });

  it('skips a task with no usable text', () => {
    expect(mathTaskToActivities([{ solution_steps: ['x'] }])).toEqual([]);
  });

  it('round-trips through the importer', () => {
    const activities = mathTaskToActivities([{
      title: 'Собери $1/2 + 1/4$',
      solution_steps: ['3/4'],
      misconceptions: [{ mistake: '2/6' }, { mistake: '1/6' }],
    }]);
    const r = importTemplate({ slidea_import: 1, title: 'Од MathDigitizer', activities });
    expect(r.ok).toBe(true);
    expect(r.imported).toBe(1);
  });
});
