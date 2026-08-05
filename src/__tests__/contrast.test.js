import { describe, it, expect } from 'vitest';
import { hslToRgb, contrastRatio, readableTextOnHsl, accessibleScaleColor, TEXT_ON_DARK, TEXT_ON_LIGHT } from '../lib/contrast';

const WHITE = { r: 255, g: 255, b: 255 };
const INK = { r: 15, g: 23, b: 42 };
const hex = (h) => ({ r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) });

describe('hslToRgb', () => {
  it('converts the primaries', () => {
    expect(hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 });
    expect(hslToRgb(120, 100, 50)).toEqual({ r: 0, g: 255, b: 0 });
    expect(hslToRgb(240, 100, 50)).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('handles achromatic and out-of-range input', () => {
    expect(hslToRgb(0, 0, 100)).toEqual(WHITE);
    expect(hslToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
    expect(hslToRgb(360 + 120, 100, 50)).toEqual(hslToRgb(120, 100, 50));
  });
});

describe('contrastRatio', () => {
  it('matches the known bounds', () => {
    expect(contrastRatio(WHITE, { r: 0, g: 0, b: 0 })).toBeCloseTo(21, 1);
    expect(contrastRatio(WHITE, WHITE)).toBeCloseTo(1, 5);
  });
});

describe('readableTextOn', () => {
  it('still uses white where white is the better choice', () => {
    expect(readableTextOnHsl(240)).toBe(TEXT_ON_DARK);
  });

  it('picks dark ink on pale backgrounds', () => {
    expect(readableTextOnHsl(200, 75, 88)).toBe(TEXT_ON_LIGHT);
    expect(contrastRatio(hslToRgb(200, 75, 88), INK)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('accessibleScaleColor — the 1–10 scale buttons', () => {
  // The exact hues the component generates: i * 12 for i in 0..9.
  const HUES = Array.from({ length: 10 }, (_, i) => i * 12);

  it('every step clears 4.5:1', () => {
    for (const hue of HUES) {
      const { backgroundColor, color } = accessibleScaleColor(hue);
      const l = Number(backgroundColor.match(/,(\d+(?:\.\d+)?)%\)$/)[1]);
      expect(
        contrastRatio(hslToRgb(hue, 75, l), hex(color)),
        `hue ${hue} → ${backgroundColor} / ${color} is unreadable`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  // Guards against the fix being quietly weakened back into "just pick a text
  // colour": at hue 12 neither white nor ink passes at lightness 50, which is
  // why the lightness has to move at all.
  it('adjusts lightness where no text colour alone can pass', () => {
    const bothFail = HUES.filter((hue) => {
      const bg = hslToRgb(hue, 75, 50);
      return contrastRatio(bg, WHITE) < 4.5 && contrastRatio(bg, INK) < 4.5;
    });
    expect(bothFail).toContain(12);
    for (const hue of bothFail) {
      expect(accessibleScaleColor(hue).lightness).not.toBe(50);
    }
  });

  it('leaves the hue itself alone — the ramp carries the meaning', () => {
    for (const hue of HUES) {
      expect(accessibleScaleColor(hue).backgroundColor.startsWith(`hsl(${hue},`)).toBe(true);
    }
  });

  it('does not move lightness when the default already passes', () => {
    const { lightness } = accessibleScaleColor(240);
    expect(lightness).toBe(50);
  });
});
