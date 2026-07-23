// ============================================================================
// Build-time вчитување на објавени community темплејти од Supabase (read-only).
// Користено од generateSitemap.js и prerenderRoutes.js за да добијат community
// темплејтите иста статичка SEO покриеност како starter темплејтите.
//
// Graceful by design: враќа [] при БИЛО КАКВА грешка (нема env, мрежа, timeout)
// за да НЕ го скрши build-от. Никогаш не пишува во базата — само SELECT.
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Node build-скриптите не минуваат низ Vite, па .env.local не се вчитува сам.
// Ги парсираме минималните клучеви од .env.local / .env ако не се веќе set-нати.
function loadEnvKeys() {
  const wanted = ['SUPABASE_URL', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  for (const file of ['.env.local', '.env']) {
    const p = path.join(ROOT, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const [, key, rawVal] = m;
      if (wanted.includes(key) && !process.env[key]) {
        process.env[key] = rawVal.replace(/^["']|["']$/g, '');
      }
    }
  }
}

export async function loadCommunityTemplates({ timeoutMs = 15000 } = {}) {
  loadEnvKeys();
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    console.warn('  ! Supabase env недостава — SEO ги прескокнува community темплејтите.');
    return [];
  }
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
    const query = supabase
      .from('community_templates')
      .select('slug,title,description,subject,category,grade,polls')
      .eq('is_public', true)
      .eq('is_published', true)
      .not('slug', 'is', null)
      .limit(500);
    const { data, error } = await Promise.race([
      query,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    const list = rows
      .filter((r) => r.slug)
      .map((r) => ({
        id: r.slug,
        title: r.title || 'Шаблон',
        description: r.description || '',
        subject: r.subject || r.category || '',
        grade: r.grade || '',
        polls: Array.isArray(r.polls) ? r.polls : [],
      }));
    console.log(`  OK вчитани ${list.length} community темплејти за SEO.`);
    return list;
  } catch (e) {
    console.warn('  ! не успеа да се вчитаат community темплејти (SEO ги прескокнува):', e?.message);
    return [];
  }
}
