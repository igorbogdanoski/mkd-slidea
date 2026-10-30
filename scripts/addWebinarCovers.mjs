// Generates one illustration per webinar question via Pollinations.ai (the
// same free, keyless service the app's own IllustrationPickerModal uses), then
// stores them in the `slide-images` bucket and points polls.cover_url at them.
//
// Dry by default: prints the URLs and writes nothing. Pass --apply to upload
// and update the event.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const apply = process.argv.includes('--apply');
const CODE = 'RY1OZM';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: 'Bearer ' + key };
const get = async (p) => (await fetch(url + '/rest/v1/' + p, { headers: H })).json().catch(() => null);

// One prompt per question, in deck order. Kept deliberately concrete and
// classroom-flavoured: a flat, clean illustration reads from the back of a
// room far better than anything photorealistic or text-heavy.
const PROMPTS = [
  'minimal flat illustration of diverse Macedonian teachers in a modern classroom, different grade levels, warm friendly colours, no text',
  'minimal flat illustration of a person at a laptop typing a very short one-line prompt into an AI chat window, simple icons, no text',
  'minimal flat illustration of a teacher desk overwhelmed with paper lesson plans, worksheets and books, a clock showing time passing, no text',
  'minimal flat illustration of a cautious teacher reviewing AI-generated content, magnifying glass over a document, shield and warning icons, no text',
  'minimal flat illustration of a teacher easily building an interactive science simulation and website with drag and drop blocks, no code symbols, no text',
  'minimal flat illustration of an engaging multimedia classroom scene, animated video on screen, colourful diagrams, mind maps, flashcards, no text',
  'minimal flat illustration of a teacher carefully reviewing and checking a printed test with a red pen and a checklist, responsible and confident, no text',
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const buildUrl = (prompt, seed) => {
  const p = `${prompt}, educational illustration, clean flat design, soft gradient background, 16:9`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1024&height=576&nologo=true&model=flux&seed=${seed}`;
};

const [ev] = await get(`events?select=id,code&code=eq.${CODE}`);
if (!ev) { console.log('event not found'); process.exit(1); }
const polls = await get(`polls?select=id,question,position&event_id=eq.${ev.id}&order=position.asc`);
console.log(`Event ${ev.code}: ${polls.length} activities\n`);

mkdirSync('tmp-covers', { recursive: true });

for (let i = 0; i < polls.length; i++) {
  const poll = polls[i];
  const prompt = PROMPTS[i] || PROMPTS[PROMPTS.length - 1];
  const seed = 1000 + i * 37;
  const imgUrl = buildUrl(prompt, seed);
  console.log(`${i + 1}. ${poll.question.slice(0, 55)}…`);
  console.log(`   ${imgUrl}`);

  if (!apply) continue;

  // Fetch and validate before uploading: Pollinations can answer with an
  // error page, and a stored 0-byte object would show as a broken image on
  // the projector at the worst possible moment.
  let buf = null;
  for (let attempt = 1; attempt <= 4 && !buf; attempt++) {
    try {
      const r = await fetch(imgUrl, { signal: AbortSignal.timeout(90000) });
      const type = r.headers.get('content-type') || '';
      if (!r.ok || !type.startsWith('image/')) {
        console.log(`   attempt ${attempt}: HTTP ${r.status} ${type} — retrying`);
        await new Promise((res) => setTimeout(res, 3000));
        continue;
      }
      const b = Buffer.from(await r.arrayBuffer());
      if (b.length < 5000) {
        console.log(`   attempt ${attempt}: only ${b.length} bytes — retrying`);
        await new Promise((res) => setTimeout(res, 3000));
        continue;
      }
      buf = b;
    } catch (e) {
      console.log(`   attempt ${attempt}: ${e.message} — retrying`);
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
  if (!buf) { console.log('   FAILED to fetch image, leaving cover_url untouched'); continue; }

  const path = `webinar-vovden/q${i + 1}-${slug(poll.question).slice(0, 40)}.jpg`;
  const up = await fetch(`${url}/storage/v1/object/slide-images/${path}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
    body: buf,
  });
  if (!up.ok) { console.log('   upload failed:', up.status, await up.text().catch(() => '')); continue; }

  const publicUrl = `${url}/storage/v1/object/public/slide-images/${path}`;
  const patch = await fetch(`${url}/rest/v1/polls?id=eq.${poll.id}`, {
    method: 'PATCH',
    headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ cover_url: publicUrl, cover_meta: { source: 'pollinations', prompt, seed } }),
  });
  console.log(`   ${patch.ok ? 'OK' : 'PATCH FAILED ' + patch.status}  ${buf.length} bytes → ${publicUrl}`);
  writeFileSync(`tmp-covers/q${i + 1}.jpg`, buf);
}

console.log(apply ? '\nDone.' : '\nDRY RUN — pass --apply to upload and attach.');
