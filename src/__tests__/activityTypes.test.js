import { describe, it, expect } from 'vitest';
import { normaliseActivityType, templateActivities, optionsForType, carriedActivityFields, RENDERABLE_TYPES } from '../lib/activityTypes';

// Two failures this guards against, both silent. A type nothing matches falls
// through to the multiple-choice branch and renders that activity's options —
// and a word cloud has none, so the projector shows an empty panel. And a
// template whose `polls` is a JSON string gets walked character by character.
describe('normaliseActivityType', () => {
  it('folds the spelling that reached the database', () => {
    // Nine seeded activities carry word_cloud; every branch matches wordcloud.
    expect(normaliseActivityType('word_cloud')).toBe('wordcloud');
    expect(normaliseActivityType('wordcloud')).toBe('wordcloud');
  });

  it('accepts the names other tools use', () => {
    expect(normaliseActivityType('multiple_choice')).toBe('poll');
    expect(normaliseActivityType('free_text')).toBe('open');
    expect(normaliseActivityType('ordering')).toBe('ranking');
  });

  it('leaves a known type alone', () => {
    for (const t of RENDERABLE_TYPES) expect(normaliseActivityType(t)).toBe(t);
  });

  it('falls back to a plain poll rather than passing through something unrenderable', () => {
    expect(normaliseActivityType('matching')).toBe('poll');
    expect(normaliseActivityType('')).toBe('poll');
    expect(normaliseActivityType(null)).toBe('poll');
    expect(normaliseActivityType(undefined)).toBe('poll');
  });
});

describe('templateActivities', () => {
  const activities = [{ question: 'A', type: 'quiz' }, { question: 'Б', type: 'open' }];

  it('reads a normal array', () => {
    expect(templateActivities({ polls: activities })).toHaveLength(2);
  });

  it('parses the eighteen templates that hold a JSON string', () => {
    // for…of over a string yields characters, and each character became an
    // activity with no question — a row of garbage instead of a lesson.
    const parsed = templateActivities({ polls: JSON.stringify(activities) });
    expect(parsed).toHaveLength(2);
    expect(parsed[0].question).toBe('A');
  });

  it('returns nothing rather than throwing on junk', () => {
    for (const junk of [null, undefined, {}, { polls: '{ not json' }, { polls: 42 }]) {
      expect(templateActivities(junk)).toEqual([]);
    }
  });

  it('drops entries that are not activities', () => {
    expect(templateActivities({ polls: [null, 'x', 7, activities[0]] })).toHaveLength(1);
  });
});

describe('optionsForType', () => {
  // A rating maps a tapped star onto options[star - 1]. With no option rows
  // the index is -1, the lookup misses and tapping does nothing — no error and
  // no feedback. Seven live rating activities were in exactly that state,
  // because the paths that create polls skipped option insertion whenever the
  // author supplied an empty array, which is the shape a rating always has.
  it('supplies the fixed scale when the author supplied none', () => {
    expect(optionsForType('rating', []).map((o) => o.text)).toEqual(['1', '2', '3', '4', '5']);
    expect(optionsForType('scale', undefined)).toHaveLength(10);
  });

  it('supplies it for the alias spelling too', () => {
    expect(optionsForType('word_cloud', [])).toEqual([]);
    expect(optionsForType('rating', null)).toHaveLength(5);
  });

  it('keeps authored labels when there are some', () => {
    const authored = [{ text: 'Слабо' }, { text: 'Одлично' }];
    expect(optionsForType('rating', authored)).toEqual(authored);
  });

  it('leaves types that legitimately have no options empty', () => {
    for (const t of ['open', 'wordcloud', 'fill_blanks', 'survey']) {
      expect(optionsForType(t, []), t).toEqual([]);
    }
  });

  it('drops entries with no text rather than creating blank choices', () => {
    // A blank choice on a projector is an unpressable button with no label.
    expect(optionsForType('poll', [{ text: 'A' }, {}, null, { text: '' }])).toHaveLength(1);
  });

  it('accepts plain strings as options', () => {
    expect(optionsForType('poll', ['A', 'Б'])).toEqual(['A', 'Б']);
  });
});

describe('carriedActivityFields', () => {
  // Three separate paths built a poll row by listing fields by hand — applying
  // a template, duplicating an activity, importing slides — and each listed a
  // different subset. Every omission is silent and each breaks something
  // specific: no `blanks` means no gaps to fill, no `survey_questions` means
  // no questions, and the activity is simply unanswerable.
  const source = {
    question: 'Колку е $1/2 + 1/4$?',
    type: 'fill_blanks',
    correct_answer: '3/4',
    answer_explanation: 'Прво заеднички именител.',
    blanks: [{ id: 'b1', accept: ['3/4'] }],
    survey_questions: null,
    curriculum_tags: ['МА.6.2.3'],
    presenter_notes: 'Потсети на именител',
    cover_url: 'https://example.mk/a.png',
    cover_meta: { author: 'x' },
    needs_moderation: true,
    answer_revealed: true,
    votes: 99,
  };

  it('carries every field that defines the activity', () => {
    const carried = carriedActivityFields(source);
    expect(carried.blanks).toEqual(source.blanks);
    expect(carried.correct_answer).toBe('3/4');
    expect(carried.answer_explanation).toBe('Прво заеднички именител.');
    expect(carried.curriculum_tags).toEqual(['МА.6.2.3']);
    expect(carried.presenter_notes).toBe('Потсети на именител');
    expect(carried.cover_url).toBe('https://example.mk/a.png');
    expect(carried.needs_moderation).toBe(true);
  });

  it('starts the copy unrevealed', () => {
    // The reveal belongs to the round it was made in, not to the copy.
    expect(carriedActivityFields(source).answer_revealed).toBe(false);
  });

  it('does not carry results or identity', () => {
    const carried = carriedActivityFields(source);
    for (const k of ['votes', 'id', 'event_id', 'position', 'question', 'type']) {
      expect(carried, k).not.toHaveProperty(k);
    }
  });

  it('produces explicit nulls rather than undefined for a bare source', () => {
    // undefined is dropped by the client and leaves the column at its default;
    // null is the value actually intended.
    const carried = carriedActivityFields({});
    expect(carried.blanks).toBe(null);
    expect(carried.correct_answer).toBe(null);
    expect(Object.values(carried).every((v) => v !== undefined)).toBe(true);
  });

  it('survives null and undefined input', () => {
    expect(() => carriedActivityFields(null)).not.toThrow();
    expect(carriedActivityFields(undefined).blanks).toBe(null);
  });
});
