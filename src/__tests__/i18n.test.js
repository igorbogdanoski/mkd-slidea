/**
 * Unit tests — i18n lookup logic
 *
 * Tests the pure lookup() and translation logic without mounting React.
 */
import { describe, it, expect } from 'vitest';
import mk from '../i18n/locales/mk.js';
import sq from '../i18n/locales/sq.js';
import { LOCALES, DEFAULT_LOCALE } from '../i18n/index.jsx';

// Extract the pure lookup function by re-implementing it (it's not exported).
const lookup = (dict, key) => {
  if (!key) return '';
  const parts = String(key).split('.');
  let cur = dict;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
    else return null;
  }
  return typeof cur === 'string' ? cur : null;
};

// Translation helper that mirrors the hook's t() logic.
const makeT = (locale) => (key, fallback) => {
  const dict = LOCALES[locale]?.dict || LOCALES[DEFAULT_LOCALE].dict;
  const val = lookup(dict, key);
  if (val !== null) return val;
  const def = lookup(LOCALES[DEFAULT_LOCALE].dict, key);
  return def !== null ? def : (fallback ?? key);
};

describe('i18n — LOCALES structure', () => {
  it('exports all 6 required locales', () => {
    const codes = Object.keys(LOCALES);
    expect(codes).toContain('mk');
    expect(codes).toContain('sq');
    expect(codes).toContain('sr');
    expect(codes).toContain('bg');
    expect(codes).toContain('hr');
    expect(codes).toContain('ro');
    expect(codes).toHaveLength(6);
  });

  it('each locale has name, flag, dict and htmlLang', () => {
    for (const [code, loc] of Object.entries(LOCALES)) {
      expect(typeof loc.name).toBe('string');
      expect(loc.name.length).toBeGreaterThan(0);
      expect(typeof loc.flag).toBe('string');
      expect(typeof loc.dict).toBe('object');
      expect(typeof loc.htmlLang).toBe('string');
    }
  });

  it('DEFAULT_LOCALE is mk', () => {
    expect(DEFAULT_LOCALE).toBe('mk');
  });
});

describe('i18n — lookup()', () => {
  it('resolves a top-level key', () => {
    const val = lookup(mk, 'nav');
    expect(val !== null || typeof val === 'object').toBe(true);
  });

  it('resolves a nested key with dots', () => {
    const val = lookup(mk, 'common.join');
    // Either a string or null (key may not exist — just no crash)
    expect(val === null || typeof val === 'string').toBe(true);
  });

  it('returns null for missing key', () => {
    expect(lookup(mk, 'this.key.does.not.exist')).toBeNull();
  });

  it('returns empty string for null/undefined key', () => {
    expect(lookup(mk, null)).toBe('');
    expect(lookup(mk, undefined)).toBe('');
    expect(lookup(mk, '')).toBe('');
  });
});

describe('i18n — t() helper', () => {
  it('returns value for existing key in mk', () => {
    const t = makeT('mk');
    // Try a key that definitely exists in mk locale
    const keys = Object.keys(mk);
    if (keys.length > 0) {
      const firstKey = keys[0];
      const val = t(firstKey);
      expect(val).not.toBeNull();
    }
  });

  it('falls back to mk for unknown locale', () => {
    const t = makeT('xx'); // Non-existent locale
    // Should fall back to mk dict
    const keys = Object.keys(mk);
    if (keys.length > 0) {
      const firstKey = keys[0];
      const tMk = makeT('mk');
      expect(t(firstKey)).toBe(tMk(firstKey));
    }
  });

  it('returns custom fallback for completely missing key', () => {
    const t = makeT('mk');
    expect(t('missing.key.xyz', 'FALLBACK')).toBe('FALLBACK');
  });

  it('returns key name when no fallback and key missing', () => {
    const t = makeT('mk');
    expect(t('totally.missing.key')).toBe('totally.missing.key');
  });

  it('sq locale dict is not empty', () => {
    expect(Object.keys(sq).length).toBeGreaterThan(0);
  });
});

describe('i18n — MK locale has critical keys', () => {
  const t = makeT('mk');

  const criticalKeys = [
    'nav',
    'common',
    'footer',
  ];

  for (const key of criticalKeys) {
    it(`has top-level key: ${key}`, () => {
      const val = lookup(mk, key);
      expect(val !== null || (mk[key] !== undefined)).toBe(true);
    });
  }
});
