// ============================================================================
// SEO helpers — pure / тестабилни.
// Користени од scripts/prerenderRoutes.js.
// ============================================================================

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

export const escapeAttr = escapeHtml;

export function injectMeta(html, route, site = 'https://slidea.mismath.net') {
  const url = `${site}${route.path}`;
  let out = html;

  if (/<title>[^<]*<\/title>/.test(out)) {
    out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(route.title)}</title>`);
  } else {
    out = out.replace('</head>', `<title>${escapeHtml(route.title)}</title></head>`);
  }

  if (/<link rel="canonical"[^>]*>/.test(out)) {
    out = out.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);
  } else {
    out = out.replace('</head>', `<link rel="canonical" href="${url}" /></head>`);
  }

  if (/<meta name="description"[^>]*>/.test(out)) {
    out = out.replace(
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${escapeAttr(route.description)}" />`
    );
  } else {
    out = out.replace('</head>', `<meta name="description" content="${escapeAttr(route.description)}" /></head>`);
  }

  if (/<meta property="og:title"[^>]*>/.test(out)) {
    out = out.replace(
      /<meta property="og:title"[^>]*>/,
      `<meta property="og:title" content="${escapeAttr(route.title)}" />`
    );
  }
  if (/<meta property="og:description"[^>]*>/.test(out)) {
    out = out.replace(
      /<meta property="og:description"[^>]*>/,
      `<meta property="og:description" content="${escapeAttr(route.description)}" />`
    );
  }

  if (route.image) {
    if (/<meta property="og:image"[^>]*>/.test(out)) {
      out = out.replace(
        /<meta property="og:image"[^>]*>/,
        `<meta property="og:image" content="${escapeAttr(route.image)}" />`
      );
    } else {
      out = out.replace('</head>', `<meta property="og:image" content="${escapeAttr(route.image)}" /></head>`);
    }
    if (/<meta name="twitter:image"[^>]*>/.test(out)) {
      out = out.replace(
        /<meta name="twitter:image"[^>]*>/,
        `<meta name="twitter:image" content="${escapeAttr(route.image)}" />`
      );
    } else {
      out = out.replace('</head>', `<meta name="twitter:image" content="${escapeAttr(route.image)}" /></head>`);
    }
    if (!/<meta name="twitter:card"[^>]*>/.test(out)) {
      out = out.replace('</head>', `<meta name="twitter:card" content="summary_large_image" /></head>`);
    }
  }

  const hreflang = `
    <meta property="og:url" content="${url}" />
    <meta name="twitter:url" content="${url}" />
    ${route.keywords ? `<meta name="keywords" content="${escapeAttr(route.keywords)}" />` : ''}
    <link rel="alternate" hreflang="mk-MK" href="${url}" />
    <link rel="alternate" hreflang="sq-AL" href="${url}?lang=sq" />
    <link rel="alternate" hreflang="en" href="${url}?lang=en" />
    <link rel="alternate" hreflang="x-default" href="${url}" />
  `;

  let jsonLd = '';
  if (route.jsonLd) {
    jsonLd = `<script type="application/ld+json">${JSON.stringify(route.jsonLd)}</script>`;
  }

  out = out.replace('</head>', `${hreflang}${jsonLd}</head>`);
  return out;
}
