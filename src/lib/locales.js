// Shared locale list — single source of truth for hreflang tags, so the
// build-time sitemap generator (scripts/generateSitemap.js) and the runtime
// SEO hook (src/hooks/useSEO.js) can't drift out of sync with each other.
export const LOCALES = [
  { code: 'mk-MK', q: '' },
  { code: 'sq-AL', q: '?lang=sq' },
  { code: 'sr-RS', q: '?lang=sr' },
  { code: 'hr-HR', q: '?lang=hr' },
  { code: 'bg-BG', q: '?lang=bg' },
  { code: 'ro-RO', q: '?lang=ro' },
  { code: 'en', q: '?lang=en' },
];
