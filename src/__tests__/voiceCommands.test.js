import { describe, it, expect } from 'vitest';
import { matchAction, normaliseTranscript } from '../hooks/useVoiceCommands';

// The microphone sits open in front of someone who talks for a living. The
// old matcher asked "does the transcript contain this word anywhere", which
// made most ordinary teaching sentences a slide command: the deck ran away
// forward, and stepping back was impossible because the next thing said threw
// it forward again.
describe('a command is a command, a sentence is not', () => {
  it('accepts the bare command', () => {
    expect(matchAction('следна')).toBe('next');
    expect(matchAction('назад')).toBe('prev');
    expect(matchAction('заклучи')).toBe('lock');
    expect(matchAction('next')).toBe('next');
  });

  it('accepts a command with harmless filler around it', () => {
    expect(matchAction('оди следна')).toBe('next');
    expect(matchAction('ајде назад')).toBe('prev');
    expect(matchAction('следен слајд')).toBe(null); // "следен" is not a keyword
  });

  it('ignores ordinary teaching speech that merely contains a keyword', () => {
    // Every one of these fired a slide change before.
    for (const sentence of [
      'ајде да продолжиме со задачата',
      'одиме напред кон следниот дел од лекцијата',
      'врати се назад на она што го учевме минатиот час',
      'следна недела имаме тест по математика',
      'сега ќе почни да работи секој сам',
      'кој сака да продолжи наместо мене',
    ]) {
      expect(matchAction(sentence), sentence).toBe(null);
    }
  });

  it('refuses an utterance that names two different commands', () => {
    // Ambiguous is not a command — acting on a guess moves the slide in front
    // of a room.
    expect(matchAction('назад следна')).toBe(null);
  });

  it('matches whole words only', () => {
    // "напредни" contains "напред"; substring matching fired on it.
    expect(matchAction('напредни ученици')).toBe(null);
    expect(matchAction('заклучок')).toBe(null);
  });

  it('survives punctuation and case', () => {
    expect(matchAction('Следна!')).toBe('next');
    expect(matchAction('  НАЗАД.  ')).toBe('prev');
  });

  it('ignores empty or noise-only input', () => {
    for (const junk of ['', '   ', '...', null, undefined]) {
      expect(matchAction(junk)).toBe(null);
    }
  });

  it('normalises to words', () => {
    expect(normaliseTranscript('Ајде, следна!')).toEqual(['ајде', 'следна']);
  });
});
