// ============================================================================
// Sprint 8.2.1 — Static route prerendering за SEO (zero-dep)
// ----------------------------------------------------------------------------
// По `vite build`, копира `dist/index.html` во `dist/<route>/index.html` со
// route-specific <title>, meta, OG, hreflang и JSON-LD. SPA-та сè уште се
// mount-ира исто; разликата е што Google/Facebook/LinkedIn ќе го прочитаат
// точниот SEO content без потреба од JS execution.
//
// Vercel `rewrites` веќе го испраќа сè на `/index.html`. Ние ставаме
// `vercel.json` cleanUrls/static-first reads за да служи нашиот файл.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { injectMeta as _injectMeta, escapeHtml as _escapeHtml, escapeAttr as _escapeAttr } from './seoHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SRC = path.join(DIST, 'index.html');

if (!fs.existsSync(SRC)) {
  console.error('❌ dist/index.html не постои. Пушти `vite build` пред ова.');
  process.exit(1);
}
const baseHtml = fs.readFileSync(SRC, 'utf8');

const SITE = 'https://slidea.mismath.net';

const ROUTES = [
  {
    path: '/pricing',
    title: 'Цени | MKD Slidea — Бесплатен и Pro план за наставници и фирми',
    description: 'Бесплатен план со 200 учесници, Pro план од €20/година. Македонска интерактивна платформа за настава, обуки и состаноци.',
    keywords: 'цени, mentimeter алтернатива, slidea план, бесплатен квиз',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'PriceSpecification',
      'name': 'MKD Slidea Планови',
      'priceCurrency': 'EUR',
    },
  },
  {
    path: '/scoreboard',
    title: 'Топ играчи и наставници | MKD Slidea Скорборд',
    description: 'Јавен скорборд на најуспешните играчи и наставници во MK интерактивни квизови. Анонимно опт-ин.',
    keywords: 'скорборд, квиз шампиони, топ наставници, leaderboard',
  },
  {
    path: '/templates',
    title: 'Шаблони од заедницата | MKD Slidea',
    description: 'Безплатни едукативни шаблони за квизови, анкети и word cloud, поврзани со македонскиот курикулум (G1–G13).',
    keywords: 'шаблони, квизови, анкети, БРО курикулум, наставници',
  },
  {
    path: '/demo',
    title: 'Demo | MKD Slidea — Пробај без регистрација',
    description: 'Истражи го MKD Slidea без регистрација. Создавај и води интерактивни активности веднаш.',
    keywords: 'demo, проба, без регистрација',
  },
  {
    path: '/join',
    title: 'Приклучи се на настан | MKD Slidea',
    description: 'Внеси го кодот на настанот за да се приклучиш на интерактивна сесија во живо.',
    keywords: 'приклучи се, код, joincode',
  },
  {
    path: '/checkout',
    title: 'Активирај Pro план | MKD Slidea — PayPal, IBAN, банкарска уплата',
    description: 'Активирај го твојот Pro план преку PayPal, IBAN банкарски трансфер или трансакциска сметка. Брза рачна верификација.',
    keywords: 'активирај pro, paypal, iban, swift, банкарска уплата, претплата',
    noindex: false,
  },
];

async function loadTemplates() {
  try {
    const mod = await import(pathToFileURL(path.join(ROOT, 'src/lib/starterTemplates.js')).href);
    return mod.STARTER_TEMPLATES || [];
  } catch (e) {
    console.warn('  ! не успеа да се вчита starterTemplates.js:', e?.message);
    return [];
  }
}

function templateRoute(t) {
  const title = `${t.title} | Шаблон за квиз/анкета — MKD Slidea`;
  const description = (t.description || `Готов шаблон „${t.title}“ за ${t.subject || 'настава'}.`).slice(0, 300);
  const polls = Array.isArray(t.polls) ? t.polls : [];
  return {
    path: `/templates/${t.id}`,
    title,
    description,
    keywords: `${t.subject || ''}, ${t.grade || ''}, шаблон, квиз, анкета, MKD Slidea, БРО`.replace(/,\s*,/g, ','),
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Course',
          '@id': `https://slidea.mismath.net/templates/${t.id}#course`,
          'name': t.title,
          'description': description,
          'inLanguage': 'mk',
          'educationalLevel': t.grade || 'Сите нивоа',
          'about': t.subject || 'Образование',
          'provider': {
            '@type': 'Organization',
            'name': 'MKD Slidea',
            'sameAs': 'https://slidea.mismath.net',
          },
          'hasCourseInstance': {
            '@type': 'CourseInstance',
            'courseMode': 'online',
            'courseWorkload': `PT${Math.max(5, polls.length * 3)}M`,
          },
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'EUR' },
        },
        {
          '@type': 'BreadcrumbList',
          'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': 'Почетна', 'item': 'https://slidea.mismath.net/' },
            { '@type': 'ListItem', 'position': 2, 'name': 'Шаблони', 'item': 'https://slidea.mismath.net/templates' },
            { '@type': 'ListItem', 'position': 3, 'name': t.title, 'item': `https://slidea.mismath.net/templates/${t.id}` },
          ],
        },
      ],
    },
  };
}

const injectMeta = (html, route) => _injectMeta(html, route, SITE);
const escapeHtml = _escapeHtml;
const escapeAttr = _escapeAttr;

const templates = await loadTemplates();
const ALL_ROUTES = [...ROUTES, ...templates.map(templateRoute)];

let written = 0;
for (const route of ALL_ROUTES) {
  const dir = path.join(DIST, route.path.replace(/^\//, ''));
  fs.mkdirSync(dir, { recursive: true });
  const html = injectMeta(baseHtml, route);
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  written++;
  console.log(`  OK ${route.path}/index.html`);
}
console.log(`OK Пререндериран ${written} routes за SEO.`);
