import { describe, it, expect } from 'vitest';
import { normaliseActivityType, templateActivities, RENDERABLE_TYPES } from '../lib/activityTypes';

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
