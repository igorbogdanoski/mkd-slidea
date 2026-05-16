// Run: node --test src/__tests__/seoHelpers.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, escapeAttr, injectMeta } from '../../scripts/seoHelpers.js';

const BASE_HTML = `<!doctype html><html><head><title>old</title><link rel="canonical" href="https://x" /><meta name="description" content="old" /><meta property="og:title" content="old" /><meta property="og:description" content="old" /></head><body></body></html>`;

const ROUTE = {
  path: '/pricing',
  title: 'Цени & план',
  description: 'Опис со "наводници" и <html> тагови',
  keywords: 'mkd, цени',
  jsonLd: { '@type': 'PriceSpecification', name: 'Test' },
};

describe('seoHelpers', () => {
  describe('escapeHtml', () => {
    it('escapes all HTML metacharacters', () => {
      assert.equal(escapeHtml(`<a href="x">'foo'&bar</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;foo&#39;&amp;bar&lt;/a&gt;');
    });

    it('coerces non-strings', () => {
      assert.equal(escapeHtml(42), '42');
      assert.equal(escapeHtml(null), 'null');
    });

    it('escapeAttr is alias of escapeHtml', () => {
      assert.equal(escapeAttr('<x>'), escapeHtml('<x>'));
    });
  });

  describe('injectMeta', () => {
    const out = injectMeta(BASE_HTML, ROUTE, 'https://example.com');

    it('replaces title with escaped route title', () => {
      assert.match(out, /<title>Цени &amp; план<\/title>/);
    });

    it('sets canonical URL to site+path', () => {
      assert.match(out, /<link rel="canonical" href="https:\/\/example\.com\/pricing" \/>/);
    });

    it('sets meta description with escaped content', () => {
      assert.match(out, /<meta name="description" content="Опис со &quot;наводници&quot; и &lt;html&gt; тагови" \/>/);
    });

    it('updates og:title and og:description', () => {
      assert.match(out, /<meta property="og:title" content="Цени &amp; план" \/>/);
      assert.match(out, /<meta property="og:description" content="Опис со &quot;наводници&quot; и &lt;html&gt; тагови" \/>/);
    });

    it('injects og:url and twitter:url', () => {
      assert.match(out, /<meta property="og:url" content="https:\/\/example\.com\/pricing" \/>/);
      assert.match(out, /<meta name="twitter:url" content="https:\/\/example\.com\/pricing" \/>/);
    });

    it('injects four hreflang links (mk-MK, sq-AL, en, x-default)', () => {
      assert.match(out, /hreflang="mk-MK"/);
      assert.match(out, /hreflang="sq-AL".*\?lang=sq/);
      assert.match(out, /hreflang="en".*\?lang=en/);
      assert.match(out, /hreflang="x-default"/);
    });

    it('injects keywords meta when provided', () => {
      assert.match(out, /<meta name="keywords" content="mkd, цени" \/>/);
    });

    it('omits keywords meta when not provided', () => {
      const r2 = { ...ROUTE, keywords: undefined };
      const o2 = injectMeta(BASE_HTML, r2, 'https://example.com');
      assert.ok(!/name="keywords"/.test(o2));
    });

    it('injects JSON-LD script when route.jsonLd provided', () => {
      assert.match(out, /<script type="application\/ld\+json">\{"@type":"PriceSpecification","name":"Test"\}<\/script>/);
    });

    it('omits JSON-LD when not provided', () => {
      const r2 = { ...ROUTE, jsonLd: undefined };
      const o2 = injectMeta(BASE_HTML, r2, 'https://example.com');
      assert.ok(!/application\/ld\+json/.test(o2));
    });

    it('inserts metas before </head>', () => {
      assert.ok(out.indexOf('hreflang="mk-MK"') < out.indexOf('</head>'));
    });

    it('falls back to inserting tags before </head> if base lacks them', () => {
      const minimal = '<html><head></head><body></body></html>';
      const o = injectMeta(minimal, ROUTE, 'https://example.com');
      assert.match(o, /<title>Цени &amp; план<\/title>/);
      assert.match(o, /<link rel="canonical" href="https:\/\/example\.com\/pricing" \/>/);
      assert.match(o, /<meta name="description" content="Опис со &quot;наводници&quot;/);
    });
  });
});
