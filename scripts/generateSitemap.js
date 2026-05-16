import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://slidea.mismath.net';
const TODAY = new Date().toISOString().slice(0, 10);

const LOCALES = [
  { code: 'mk-MK', q: '' },
  { code: 'sq-AL', q: '?lang=sq' },
  { code: 'sr-RS', q: '?lang=sr' },
  { code: 'hr-HR', q: '?lang=hr' },
  { code: 'bg-BG', q: '?lang=bg' },
  { code: 'ro-RO', q: '?lang=ro' },
  { code: 'en', q: '?lang=en' },
];

const STATIC_ROUTES = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/join', priority: 0.8, changefreq: 'monthly' },
  { path: '/pricing', priority: 0.9, changefreq: 'monthly' },
  { path: '/host', priority: 0.7, changefreq: 'monthly' },
  { path: '/templates', priority: 0.9, changefreq: 'weekly' },
  { path: '/scoreboard', priority: 0.8, changefreq: 'daily' },
  { path: '/demo', priority: 0.7, changefreq: 'monthly' },
  { path: '/checkout', priority: 0.6, changefreq: 'monthly' },
  { path: '/schools',  priority: 0.85, changefreq: 'monthly' },
  { path: '/integrations', priority: 0.8, changefreq: 'monthly' },
];

async function loadTemplates() {
  try {
    const mod = await import(pathToFileURL(path.join(ROOT, 'src/lib/starterTemplates.js')).href);
    const list = mod.STARTER_TEMPLATES || [];
    return list.map((t) => ({
      path: `/templates/${t.id}`,
      priority: 0.6,
      changefreq: 'monthly',
    }));
  } catch (e) {
    console.warn('  ! не можеше да се вчита starterTemplates.js, користам fallback. ', e?.message);
    return [];
  }
}

function urlEntry(route) {
  const loc = `${SITE}${route.path}`;
  const alternates = LOCALES.map(
    (l) => `    <xhtml:link rel="alternate" hreflang="${l.code}" href="${SITE}${route.path}${l.q}" />`
  ).join('\n');
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />
  </url>`;
}

async function loadBlogRoutes() {
  try {
    const mod = await import(pathToFileURL(path.join(ROOT, 'src/data/blogPosts.js')).href);
    const posts = mod.blogPosts || [];
    return [
      { path: '/blog', priority: 0.8, changefreq: 'weekly' },
      ...posts.map(p => ({ path: `/blog/${p.slug}`, priority: 0.75, changefreq: 'monthly' })),
    ];
  } catch (e) {
    console.warn('  ! не можеше да се вчита blogPosts.js:', e?.message);
    return [{ path: '/blog', priority: 0.8, changefreq: 'weekly' }];
  }
}

async function main() {
  const templateRoutes = await loadTemplates();
  const blogRoutes = await loadBlogRoutes();
  const all = [...STATIC_ROUTES, ...blogRoutes, ...templateRoutes];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${all.map(urlEntry).join('\n')}
</urlset>
`;
  const out = path.join(ROOT, 'public', 'sitemap.xml');
  fs.writeFileSync(out, xml, 'utf8');
  console.log(`OK sitemap.xml (${all.length} URL-и) → public/sitemap.xml`);

  const distOut = path.join(ROOT, 'dist', 'sitemap.xml');
  if (fs.existsSync(path.join(ROOT, 'dist'))) {
    fs.writeFileSync(distOut, xml, 'utf8');
    console.log(`OK sitemap.xml (${all.length} URL-и) → dist/sitemap.xml`);
  }
}

main().catch((e) => {
  console.error('sitemap generation failed:', e);
  process.exit(1);
});
