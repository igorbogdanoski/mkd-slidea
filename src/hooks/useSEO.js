import { useEffect } from 'react';

// ============================================================================
// Sprint 8.2.2 — runtime SEO hook
// Комплемент кон scripts/prerenderRoutes.js (build-time): за route-и кои не се
// предрендерирани, или за динамички pages (template detail, event present,
// scoreboard). Освежува <title>, description, canonical, OG tags, hreflang,
// и опционално injektira JSON-LD при mount.
// ============================================================================

const SITE = 'https://slidea.mismath.net';

function ensureMeta(selector, attrName, attrValue) {
  if (typeof document === 'undefined') return null;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [, key, val] = selector.match(/^meta\[(name|property)="([^"]+)"\]$/) || [];
    if (key && val) el.setAttribute(key, val);
    document.head.appendChild(el);
  }
  if (attrName && attrValue !== undefined) el.setAttribute(attrName, attrValue);
  return el;
}

function ensureLink(rel, href, hreflang) {
  if (typeof document === 'undefined') return null;
  const sel = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]`;
  let el = document.head.querySelector(sel);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  if (href !== undefined) el.setAttribute('href', href);
  return el;
}

/**
 * Apply SEO meta tags for the current route.
 * @param {object} cfg
 * @param {string} cfg.title
 * @param {string} cfg.description
 * @param {string} [cfg.path] — defaults to window.location.pathname
 * @param {string} [cfg.keywords]
 * @param {string} [cfg.image]
 * @param {object} [cfg.jsonLd] — optional Schema.org payload (Sprint 8.2.4)
 * @param {boolean} [cfg.noindex]
 */
export function useSEO({
  title,
  description,
  path,
  keywords,
  image,
  jsonLd,
  noindex,
} = {}) {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const url = `${SITE}${path || (typeof window !== 'undefined' ? window.location.pathname : '/')}`;

    const prevTitle = document.title;
    if (title) document.title = title;

    if (description) ensureMeta('meta[name="description"]', 'content', description);
    if (keywords) ensureMeta('meta[name="keywords"]', 'content', keywords);
    if (title) ensureMeta('meta[property="og:title"]', 'content', title);
    if (description) ensureMeta('meta[property="og:description"]', 'content', description);
    ensureMeta('meta[property="og:url"]', 'content', url);
    ensureMeta('meta[name="twitter:url"]', 'content', url);
    if (title) ensureMeta('meta[name="twitter:title"]', 'content', title);
    if (description) ensureMeta('meta[name="twitter:description"]', 'content', description);
    if (image) {
      ensureMeta('meta[property="og:image"]', 'content', image);
      ensureMeta('meta[name="twitter:image"]', 'content', image);
    }
    ensureMeta('meta[name="robots"]', 'content', noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');

    ensureLink('canonical', url);
    ensureLink('alternate', url, 'mk-MK');
    ensureLink('alternate', `${url}?lang=sq`, 'sq-AL');
    ensureLink('alternate', `${url}?lang=en`, 'en');
    ensureLink('alternate', url, 'x-default');

    let scriptEl = null;
    if (jsonLd) {
      scriptEl = document.createElement('script');
      scriptEl.type = 'application/ld+json';
      scriptEl.dataset.useSeo = '1';
      try {
        scriptEl.textContent = JSON.stringify(jsonLd);
        document.head.appendChild(scriptEl);
      } catch { /* ignore */ }
    }

    return () => {
      if (title) document.title = prevTitle;
      if (scriptEl && scriptEl.parentNode) scriptEl.parentNode.removeChild(scriptEl);
    };
  }, [title, description, path, keywords, image, jsonLd ? JSON.stringify(jsonLd) : '', noindex]);
}

export default useSEO;
