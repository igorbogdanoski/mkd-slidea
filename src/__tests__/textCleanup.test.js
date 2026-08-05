import { describe, it, expect } from 'vitest';
import { fixHyphenation, looksUnclean } from '../lib/textCleanup';

// Real strings from the curriculum export, hyphenated by the PDF's right
// margin and kept by the extractor.
describe('fixHyphenation — PDF wrap artifacts', () => {
  it('repairs the words that actually appear in the source', () => {
    expect(fixHyphenation('елемент на множес-тво')).toBe('елемент на множество');
    expect(fixHyphenation('претста-вување на множества')).toBe('претставување на множества');
    expect(fixHyphenation('Операции со мно-жества')).toBe('Операции со множества');
    expect(fixHyphenation('апсо-лутна вредност')).toBe('апсолутна вредност');
    expect(fixHyphenation('комутативно и асоција-тивно својство')).toBe('комутативно и асоцијативно својство');
  });

  it('handles several breaks in one title', () => {
    const raw = 'Операции со мно-жества (унија, пресек, разлика, дис-јунктни множества)';
    expect(fixHyphenation(raw)).toBe('Операции со множества (унија, пресек, разлика, дисјунктни множества)');
  });

  it('leaves clean text untouched', () => {
    const clean = 'Питагорова теорема';
    expect(fixHyphenation(clean)).toBe(clean);
  });

  it('collapses the double spaces the extractor also leaves', () => {
    expect(fixHyphenation('Броеви  до  1 000 000')).toBe('Броеви до 1 000 000');
  });
});

// The failure mode that matters: a blunt replace(/-/g,'') would quietly
// corrupt real Macedonian compounds, and nobody would notice until a teacher
// read it.
describe('fixHyphenation — hyphens that must survive', () => {
  it('keeps genuine compounds', () => {
    expect(fixHyphenation('научно-истражувачки проект')).toContain('научно-истражувачки');
    expect(fixHyphenation('северно-западен ветер')).toContain('северно-западен');
  });

  it('keeps hyphens next to digits and uppercase, where a wrap cannot occur', () => {
    expect(fixHyphenation('1-ви степен')).toBe('1-ви степен');
    expect(fixHyphenation('G8-T01-L001')).toBe('G8-T01-L001');
    expect(fixHyphenation('K-9 програма')).toBe('K-9 програма');
  });

  it('keeps a dash used as punctuation between words', () => {
    // Spaces around it mean it is a dash, not a broken word.
    expect(fixHyphenation('Броеви - основни поими')).toBe('Броеви - основни поими');
  });
});

describe('looksUnclean', () => {
  it('flags text that still carries a wrap artifact', () => {
    expect(looksUnclean('множес-тво')).toBe(true);
  });

  it('does not flag repaired or clean text', () => {
    expect(looksUnclean(fixHyphenation('множес-тво'))).toBe(false);
    expect(looksUnclean('Питагорова теорема')).toBe(false);
    expect(looksUnclean('')).toBe(false);
  });
});
