// Contrast helpers.
//
// The 1–10 scale buttons colour themselves by hue: hsl(hue, 75%, 50%) with
// white text, hardcoded. That is fine at hue 0 (red) and hue 240 (blue), but
// around hue 36–72 the same lightness is a bright yellow, where white text
// lands near 2:1 — students were being asked to read numbers that were barely
// there, on the one screen where speed matters. Rather than hand-tuning a
// palette, derive the readable foreground from the colour itself.

export function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.min(Math.max(s, 0), 100) / 100;
  const lig = Math.min(Math.max(l, 0), 100) / 100;

  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lig - c / 2;

  const [r, g, b] =
    hue < 60 ? [c, x, 0] :
    hue < 120 ? [x, c, 0] :
    hue < 180 ? [0, c, x] :
    hue < 240 ? [0, x, c] :
    hue < 300 ? [x, 0, c] :
    [c, 0, x];

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

// WCAG 2.x relative luminance.
export function relativeLuminance({ r, g, b }) {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE = { r: 255, g: 255, b: 255 };
// slate-900 — the app's darkest text colour.
const INK = { r: 15, g: 23, b: 42 };

export const TEXT_ON_LIGHT = '#0f172a';
export const TEXT_ON_DARK = '#ffffff';

// Returns whichever of the two app text colours reads better on `background`.
export function readableTextOn(background) {
  return contrastRatio(background, WHITE) >= contrastRatio(background, INK)
    ? TEXT_ON_DARK
    : TEXT_ON_LIGHT;
}

// Convenience for the scale buttons, which think in hue.
export function readableTextOnHsl(h, s = 75, l = 50) {
  return readableTextOn(hslToRgb(h, s, l));
}

/**
 * Picks a background/foreground pair for one step of the 1–10 hue ramp that
 * actually clears `target`.
 *
 * Choosing the better of white and ink is not sufficient on its own: around
 * hue 12 at 75% saturation and 50% lightness, white reaches 4.28:1 and ink
 * does worse — no text colour passes, because the problem is the background.
 * So the lightness moves too, as little as it can: darker while keeping white
 * text, or lighter while switching to ink, whichever needs the smaller
 * departure from the intended 50%. The hue ramp — the part that carries the
 * meaning — is never touched.
 */
export function accessibleScaleColor(hue, { s = 75, l = 50, target = 4.5 } = {}) {
  const base = hslToRgb(hue, s, l);
  const white = { color: TEXT_ON_DARK, rgb: WHITE };
  const ink = { color: TEXT_ON_LIGHT, rgb: INK };

  const best = contrastRatio(base, WHITE) >= contrastRatio(base, INK) ? white : ink;
  if (contrastRatio(base, best.rgb) >= target) {
    return { backgroundColor: `hsl(${hue},${s}%,${l}%)`, color: best.color, lightness: l };
  }

  for (let delta = 1; delta <= 60; delta++) {
    // Darker background keeps white text; lighter one takes dark ink.
    const darker = l - delta;
    if (darker >= 0 && contrastRatio(hslToRgb(hue, s, darker), WHITE) >= target) {
      return { backgroundColor: `hsl(${hue},${s}%,${darker}%)`, color: TEXT_ON_DARK, lightness: darker };
    }
    const lighter = l + delta;
    if (lighter <= 100 && contrastRatio(hslToRgb(hue, s, lighter), INK) >= target) {
      return { backgroundColor: `hsl(${hue},${s}%,${lighter}%)`, color: TEXT_ON_LIGHT, lightness: lighter };
    }
  }

  // Unreachable for any real hue, but never return something unreadable.
  return { backgroundColor: `hsl(${hue},${s}%,20%)`, color: TEXT_ON_DARK, lightness: 20 };
}
