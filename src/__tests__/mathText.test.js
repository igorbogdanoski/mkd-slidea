import { describe, it, expect } from 'vitest';
import { hasMath, splitMath, mathToSpoken, toSpokenText } from '../lib/mathText';

// Strings taken verbatim from the exported curriculum quiz bank.
const REAL = 'Симболот $\\in$ означува дека еден елемент НЕ му припаѓа на дадено множество.';
const OPTION = 'A) $A = \\{2, 4, 6, 8\\}$';

describe('hasMath', () => {
  it('detects a math span', () => {
    expect(hasMath(REAL)).toBe(true);
    expect(hasMath(OPTION)).toBe(true);
  });

  it('is false for ordinary text, so non-maths polls never load the renderer', () => {
    expect(hasMath('Кој е главниот град на Македонија?')).toBe(false);
    expect(hasMath('')).toBe(false);
    expect(hasMath(null)).toBe(false);
    expect(hasMath(undefined)).toBe(false);
  });

  it('does not treat an escaped dollar as a delimiter', () => {
    // A price, not maths.
    expect(hasMath('Чини \\$5 по ученик')).toBe(false);
  });

  it('needs a closing delimiter', () => {
    expect(hasMath('Цената е $5 денари')).toBe(false);
  });
});

describe('splitMath', () => {
  it('keeps plain and math segments in order', () => {
    expect(splitMath('пред $x$ потоа')).toEqual([
      { type: 'text', value: 'пред ' },
      { type: 'math', value: 'x' },
      { type: 'text', value: ' потоа' },
    ]);
  });

  it('handles several spans in one string', () => {
    const parts = splitMath('Нека $A$ и $B$ се множества');
    expect(parts.filter((p) => p.type === 'math').map((p) => p.value)).toEqual(['A', 'B']);
  });

  it('returns the whole string when there is no math', () => {
    expect(splitMath('обичен текст')).toEqual([{ type: 'text', value: 'обичен текст' }]);
  });
});

// The accessibility half. KaTeX emits positioned spans that convey nothing to
// a screen reader, and raw TeX is read as "backslash in" — so the name has to
// be built separately.
describe('mathToSpoken', () => {
  it('speaks set-theory symbols the curriculum actually uses', () => {
    expect(mathToSpoken('\\in')).toBe('припаѓа на');
    expect(mathToSpoken('\\notin')).toBe('не припаѓа на');
    expect(mathToSpoken('\\emptyset')).toBe('празно множество');
    expect(mathToSpoken('A \\cup B')).toBe('A унија B');
    expect(mathToSpoken('A \\cap B')).toBe('A пресек B');
  });

  it('speaks fractions and roots as words', () => {
    expect(mathToSpoken('\\frac{1}{2}')).toBe('1 поделено со 2');
    expect(mathToSpoken('\\sqrt{16}')).toBe('квадратен корен од 16');
  });

  it('unwraps \\text and \\mathbb rather than reading the command', () => {
    expect(mathToSpoken('\\text{е парен број}')).toBe('е парен број');
    expect(mathToSpoken('x \\in \\mathbb{N}')).toBe('x припаѓа на N');
  });

  it('drops commands it does not know instead of reading them aloud', () => {
    expect(mathToSpoken('\\someunknownmacro{5}')).toBe('5');
  });
});

describe('toSpokenText', () => {
  it('turns a real question into something readable', () => {
    expect(toSpokenText(REAL)).toBe(
      'Симболот припаѓа на означува дека еден елемент НЕ му припаѓа на дадено множество.'
    );
  });

  it('turns a real option into something readable', () => {
    expect(toSpokenText(OPTION)).toBe('A) A = 2, 4, 6, 8');
  });

  it('leaves plain text alone', () => {
    const plain = 'Кој е главниот град?';
    expect(toSpokenText(plain)).toBe(plain);
  });
});
