import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The CSV building algorithm mirrored from ProfileTab.jsx (downloadCSV)
const buildCsvString = (rows) =>
  rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');

describe('CSV export — string generation', () => {
  it('wraps every cell in double quotes', () => {
    const out = buildCsvString([['A', 'B'], ['1', '2']]);
    expect(out).toBe('"A","B"\n"1","2"');
  });

  it('escapes double quotes inside cell values', () => {
    const out = buildCsvString([['say "hello"']]);
    expect(out).toBe('"say ""hello"""');
  });

  it('coerces null to empty string', () => {
    const out = buildCsvString([[null, undefined]]);
    expect(out).toBe('"",""');
  });

  it('coerces numbers to strings', () => {
    const out = buildCsvString([[42, 0, -7]]);
    expect(out).toBe('"42","0","-7"');
  });

  it('handles Macedonian characters (UTF-8)', () => {
    const out = buildCsvString([['Настан', 'Код', 'Датум']]);
    expect(out).toBe('"Настан","Код","Датум"');
  });

  it('preserves multi-row structure with newlines between rows', () => {
    const out = buildCsvString([['H1', 'H2'], ['r1', 'r2'], ['r3', 'r4']]);
    const lines = out.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('"H1","H2"');
    expect(lines[2]).toBe('"r3","r4"');
  });

  it('handles an empty rows array', () => {
    expect(buildCsvString([])).toBe('');
  });

  it('handles a row with a single cell', () => {
    expect(buildCsvString([['only']])).toBe('"only"');
  });

  it('handles values with commas inside quotes correctly', () => {
    const out = buildCsvString([['value,with,commas']]);
    expect(out).toBe('"value,with,commas"');
  });

  it('handles multiline cell values', () => {
    const out = buildCsvString([['line1\nline2']]);
    expect(out).toBe('"line1\nline2"');
  });
});

describe('CSV export — BOM prefix', () => {
  it('BOM prefix is U+FEFF (for Excel UTF-8 compatibility)', () => {
    const BOM = '﻿';
    const csv = BOM + buildCsvString([['A']]);
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
  });
});

describe('CSV export — Blob + link trigger', () => {
  let originalCreateObjectURL;
  let originalRevokeObjectURL;
  let clickSpy;

  beforeEach(() => {
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn().mockReturnValue('blob:fake-url');
    URL.revokeObjectURL = vi.fn();

    clickSpy = vi.fn();
    const originalCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreate(tag);
      if (tag === 'a') {
        vi.spyOn(el, 'click').mockImplementation(clickSpy);
      }
      return el;
    });
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it('triggers an anchor click when downloadCSV is called', () => {
    // Inline reimplementation to test DOM side-effects
    const downloadCSV = (filename, rows) => {
      const BOM = '﻿';
      const csv = BOM + buildCsvString(rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    downloadCSV('export.csv', [['Title', 'Code'], ['Event 1', 'ABC']]);

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('sets the correct filename on the anchor', () => {
    let capturedHref = '';
    let capturedDownload = '';
    const origCreate = document.createElement.bind(document);
    document.createElement = (tag) => {
      const el = origCreate(tag);
      if (tag === 'a') {
        Object.defineProperty(el, 'href', { set: (v) => { capturedHref = v; }, get: () => capturedHref });
        Object.defineProperty(el, 'download', { set: (v) => { capturedDownload = v; }, get: () => capturedDownload });
        el.click = vi.fn();
      }
      return el;
    };

    const downloadCSV = (filename, rows) => {
      const csv = '﻿' + buildCsvString(rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    };

    downloadCSV('my-events-2026-06-07.csv', [['H']]);
    expect(capturedDownload).toBe('my-events-2026-06-07.csv');
  });
});
