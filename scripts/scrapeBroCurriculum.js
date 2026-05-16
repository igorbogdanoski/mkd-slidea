// ============================================================================
// BRO Curriculum Scraper — https://bro.gov.mk
// ----------------------------------------------------------------------------
// Traverses the BRO category tree (primary + secondary) and builds a JSON
// index of all official curriculum documents (PDFs).
//
// Output: src/data/broCurriculumIndex.json
//
// Usage:
//   node scripts/scrapeBroCurriculum.js
//
// Respectful crawl: 600ms delay between requests, User-Agent set.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'src', 'data', 'broCurriculumIndex.json');
const BASE = 'https://bro.gov.mk';

const HEADERS = {
  'User-Agent': 'MKD-Slidea-Curriculum-Bot/1.0 (educational, contact: igorbogdanoski@mismath.net)',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'mk,en;q=0.9',
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Fetch with retry ────────────────────────────────────────────────────────
async function fetchHtml(url, attempt = 1) {
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      if (res.status === 429 && attempt <= 3) {
        console.warn(`  ⏳ Rate limited ${url} — waiting 5s (attempt ${attempt})`);
        await delay(5000);
        return fetchHtml(url, attempt + 1);
      }
      throw new Error(`HTTP ${res.status}`);
    }
    return res.text();
  } catch (e) {
    if (attempt <= 2) {
      await delay(2000);
      return fetchHtml(url, attempt + 1);
    }
    throw e;
  }
}

// ─── Parse subcategory table ─────────────────────────────────────────────────
// Extracts rows from .custom-data-table / subcats-table
function parseSubcatTable(html) {
  const rows = [];
  // Match <tr> rows containing an idcat link
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m;
  while ((m = rowRe.exec(html)) !== null) {
    const cell = m[1];
    // Get category name (second <td>)
    const nameM = cell.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
    if (!nameM || nameM.length < 2) continue;
    const rawName = nameM[1].replace(/<[^>]+>/g, '').trim();
    if (!rawName) continue;
    // Get the idcat link
    const linkM = cell.match(/idcat=(\d+)/);
    if (!linkM) continue;
    rows.push({ name: rawName, idcat: linkM[1] });
  }
  return rows;
}

// ─── Parse document links from a leaf page ───────────────────────────────────
function parseDocLinks(html, pageUrl) {
  const docs = [];
  // PDF and Word documents in wp-content/uploads
  const re = /href="([^"]*(?:\/wp-content\/uploads\/[^"]+\.(?:pdf|docx?|zip))[^"]*)"/gi;
  let m;
  const seen = new Set();
  while ((m = re.exec(html)) !== null) {
    let href = m[1];
    if (!href.startsWith('http')) href = BASE + href;
    if (seen.has(href)) continue;
    seen.add(href);
    // Try to extract file title from surrounding anchor text
    const anchorRe = new RegExp(`href="${m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>([^<]+)<`);
    const titleM = html.match(anchorRe);
    const title = titleM ? titleM[1].trim() : path.basename(href, path.extname(href));
    docs.push({ title, url: href, ext: path.extname(href).toLowerCase().slice(1) });
  }
  return docs;
}

// ─── Detect grade from category name ─────────────────────────────────────────
function detectGrade(name) {
  // Primary: "I одделение" → G1, "IX одделение" → G9
  const romanMap = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9 };
  const romanM = name.match(/^(IX|VIII|VII|VI|IV|V|III|II|I)\s+одделение/i);
  if (romanM) return `G${romanMap[romanM[1].toUpperCase()]}`;
  // Secondary years: "I година" → G10, "II година" → G11, "III година" → G12, "IV година" → G13
  const yearM = name.match(/^(IV|III|II|I)\s+година/i);
  if (yearM) {
    const yearMap = { I: 10, II: 11, III: 12, IV: 13 };
    return `G${yearMap[yearM[1].toUpperCase()]}`;
  }
  // Secondary: "X", "XI", "XII", "XIII"
  const secRoman = { X: 10, XI: 11, XII: 12, XIII: 13 };
  for (const [r, n] of Object.entries(secRoman)) {
    if (name.includes(r)) return `G${n}`;
  }
  return null;
}

// ─── Detect track ─────────────────────────────────────────────────────────────
function detectTrack(name) {
  if (/гимназ/i.test(name)) return 'gymnasium';
  if (/четири\s*год/i.test(name) || /четиригодишно/i.test(name)) return 'vocational4';
  if (/три\s*год/i.test(name) || /тригодишно/i.test(name)) return 'vocational3';
  if (/две\s*год/i.test(name) || /двегодишно/i.test(name)) return 'vocational2';
  if (/математичко/i.test(name)) return 'math_gymnasium';
  if (/спортска/i.test(name)) return 'sports';
  if (/музичко/i.test(name)) return 'music';
  if (/уметничко/i.test(name)) return 'arts';
  return 'primary';
}

// ─── Crawl one category level ─────────────────────────────────────────────────
async function crawlCategory(idcat, contextName = '', track = 'primary', grade = null, depth = 0) {
  if (depth > 4) return []; // safety limit
  const url = `${BASE}/podkategorii/?idcat=${idcat}&customposttype=documents_category`;
  let html;
  try {
    html = await fetchHtml(url);
  } catch (e) {
    console.warn(`  ⚠ skip idcat=${idcat}: ${e.message}`);
    return [];
  }
  await delay(600); // respectful delay

  const results = [];

  // Always collect docs from this page
  const docs = parseDocLinks(html, url);
  for (const doc of docs) {
    results.push({
      subject_context: contextName,
      track,
      grade,
      title: doc.title,
      url: doc.url,
      ext: doc.ext,
      source_idcat: idcat,
    });
  }

  // Always recurse into subcategories (docs on a category page don't mean it's a leaf)
  const subcats = parseSubcatTable(html);
  if (subcats.length === 0) {
    if (docs.length > 0) {
      console.log(`  📄 idcat=${idcat} "${contextName}" → ${docs.length} docs (leaf)`);
    } else {
      console.log(`  ○ idcat=${idcat} "${contextName}" — no docs, no subcats`);
    }
    return results;
  }

  console.log(`  📂 idcat=${idcat} "${contextName}" → ${subcats.length} subcats${docs.length ? ` + ${docs.length} docs` : ''}`);
  for (const sub of subcats) {
    const subGrade = detectGrade(sub.name) || grade;
    const subTrack = depth === 0 ? detectTrack(sub.name) : track;
    const subCtx = contextName ? `${contextName} > ${sub.name}` : sub.name;
    const subResults = await crawlCategory(sub.idcat, subCtx, subTrack, subGrade, depth + 1);
    results.push(...subResults);
  }
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log('🏫 BRO Curriculum Scraper стартуван...\n');

let primary = [], secondary = [];

try {
  console.log('📚 Primary education (idcat=50)...');
  primary = await crawlCategory('50', 'Primary', 'primary', null, 0);
} catch (e) {
  console.error('❌ Primary scrape failed:', e.message);
}

try {
  console.log('\n📚 Secondary education (idcat=7)...');
  secondary = await crawlCategory('7', 'Secondary', 'gymnasium', null, 0);
} catch (e) {
  console.error('❌ Secondary scrape failed:', e.message);
}

const index = {
  generated: new Date().toISOString(),
  source: 'https://bro.gov.mk',
  total: primary.length + secondary.length,
  primary,
  secondary,
};

fs.writeFileSync(OUT, JSON.stringify(index, null, 2), 'utf8');

console.log(`\n✅ Завршено:`);
console.log(`   Primary: ${primary.length} документи`);
console.log(`   Secondary: ${secondary.length} документи`);
console.log(`   Вкупно: ${index.total} документи`);
console.log(`   Зачувано: src/data/broCurriculumIndex.json`);
console.log(`\n👉 Следно: node scripts/enrichCurriculumWithBro.js`);
