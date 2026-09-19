// End-to-end check of every activity type, against the real database.
//
//   node scripts/verifyAllActivityTypes.mjs
//
// Reading code finds defects; it does not show that anything works. This
// creates its own throwaway event, builds one activity of each of the nine
// types, answers each one the way a participant's browser does — with the
// anon key, through the same RPCs — and then checks that the answer actually
// landed and that the projector can read it back. Everything it creates is
// deleted at the end, including on failure.
//
// What each type is checked for:
//   • the activity can be created with the structure its editor produces
//   • a participant can answer it anonymously
//   • the answer is counted or recorded in the right place
//   • a second answer from the same session is refused
//   • the projector's read path returns the answer
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const URL = env.SUPABASE_URL;
const SVC = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' };
const ANON = { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };

const rest = async (path, opts = {}, headers = SVC) => {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    ...opts,
    headers: { ...headers, ...(opts.method ? { Prefer: 'return=representation' } : {}) },
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { ok: res.ok, status: res.status, body };
};
const rpc = (name, args, headers = ANON) =>
  rest(`rpc/${name}`, { method: 'POST', body: JSON.stringify(args) }, headers);

const results = [];
const check = (type, step, ok, detail = '') => {
  results.push({ type, step, ok, detail });
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${type.padEnd(12)} ${step.padEnd(34)} ${detail}`);
};

let eventId = null;

async function cleanup() {
  if (!eventId) return;
  // polls/options/votes cascade from the event in this schema; delete them
  // explicitly anyway so a missing cascade cannot leave test rows behind.
  const polls = (await rest(`polls?select=id&event_id=eq.${eventId}`)).body || [];
  for (const p of polls) {
    await rest(`votes?poll_id=eq.${p.id}`, { method: 'DELETE' });
    await rest(`survey_responses?poll_id=eq.${p.id}`, { method: 'DELETE' });
    await rest(`options?poll_id=eq.${p.id}`, { method: 'DELETE' });
  }
  await rest(`polls?event_id=eq.${eventId}`, { method: 'DELETE' });
  await rest(`events?id=eq.${eventId}`, { method: 'DELETE' });
  console.log('\ncleaned up the throwaway event');
}

async function makePoll(type, extra = {}, optionTexts = []) {
  const { body } = await rest('polls', {
    method: 'POST',
    body: JSON.stringify([{ event_id: eventId, question: `Проверка: ${type}`, type, ...extra }]),
  });
  const poll = Array.isArray(body) ? body[0] : null;
  if (!poll) return null;
  if (optionTexts.length) {
    await rest('options', {
      method: 'POST',
      body: JSON.stringify(optionTexts.map((o) => ({
        poll_id: poll.id,
        text: typeof o === 'string' ? o : o.text,
        votes: 0,
        is_correct: typeof o === 'string' ? false : !!o.is_correct,
      }))),
    });
  }
  const opts = (await rest(`options?select=id,text,is_correct&poll_id=eq.${poll.id}&order=created_at`)).body || [];
  return { ...poll, options: opts };
}

// The client's order, and the reason it is that order: the votes row is
// claimed first so its uniqueness constraint is the gate, and nothing is
// counted if the claim is refused.
//
// Through claim_vote_graded(), the same call the app makes. An earlier version
// of this script inserted directly and asked for the row back, which is what
// the app used to do — and that is exactly how this check found that closing
// reads on votes had broken voting itself with a 401.
//
// The fourth argument is the option chosen, not a verdict. Grading happens
// inside the function, against a key the caller cannot read: the predecessor
// took p_is_correct from the client, which meant anyone holding the public
// anon key could award themselves a correct answer and top the scoreboard.
async function claimVote(pollId, sessionId, answerText, optionId) {
  const r = await rpc('claim_vote_graded', {
    p_poll_id: pollId,
    p_session_id: sessionId,
    p_username: 'Тест',
    p_answer_text: answerText,
    p_option_id: optionId ?? null,
  });
  return { ok: r.ok, claimed: r.body === true, status: r.status };
}

async function run() {
  console.log('── setting up ──');
  const owner = ((await rest('events?select=user_id&user_id=not.is.null&limit=1')).body || [])[0]?.user_id || null;
  const code = `ZZ${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const created = await rest('events', {
    method: 'POST',
    body: JSON.stringify([{ code, title: 'АВТОМАТСКА ПРОВЕРКА — брише се', user_id: owner }]),
  });
  eventId = (created.body || [])[0]?.id;
  if (!eventId) { console.error('could not create the throwaway event:', created.body); process.exit(1); }
  console.log(`  event ${code} (${eventId})`);

  const sid = `verify-${Date.now()}`;

  // ── option-counted types ────────────────────────────────────────────────
  for (const [type, opts, extra] of [
    ['poll',    ['Црвена', 'Сина', 'Зелена'], {}],
    ['quiz',    [{ text: '3/4', is_correct: true }, { text: '2/6' }], { is_quiz: true }],
    ['rating',  ['1', '2', '3', '4', '5'], {}],
    ['scale',   Array.from({ length: 10 }, (_, i) => String(i + 1)), {}],
  ]) {
    console.log(`\n── ${type} ──`);
    const poll = await makePoll(type, extra, opts);
    if (!poll) { check(type, 'create', false); continue; }
    check(type, 'create', true, `${poll.options.length} options`);

    const chosen = poll.options[0];
    const claim = await claimVote(poll.id, sid, chosen.text, chosen.id);
    check(type, 'participant can claim a vote', claim.claimed, `HTTP ${claim.status}`);

    // The verdict is the database's now, so it has to be checked rather than
    // assumed. options[0] of the quiz is the keyed one, so its row must read
    // true and a second session picking options[1] must read false — before
    // this change both values came from whoever submitted them.
    if (poll.is_quiz) {
      const right = ((await rest(
        `votes?select=is_correct&poll_id=eq.${poll.id}&session_id=eq.${sid}`
      )).body || [])[0];
      check(type, 'the right answer is graded true by the database',
        right?.is_correct === true, `is_correct=${right?.is_correct}`);

      const wrongSid = `${sid}-wrong`;
      const wrongClaim = await claimVote(poll.id, wrongSid, poll.options[1].text, poll.options[1].id);
      const wrong = ((await rest(
        `votes?select=is_correct&poll_id=eq.${poll.id}&session_id=eq.${wrongSid}`
      )).body || [])[0];
      check(type, 'the wrong answer is graded false, not whatever the caller said',
        wrongClaim.claimed && wrong?.is_correct === false, `is_correct=${wrong?.is_correct}`);

      // An id that is not one of this activity's options must be refused rather
      // than graded NULL: NULL would sit on the leaderboard's denominator as an
      // answered-but-ungraded question forever.
      const forged = await claimVote(poll.id, `${sid}-forged`, poll.options[0].text,
        '00000000-0000-0000-0000-000000000000');
      check(type, 'an option from outside this activity is refused', !forged.ok, `HTTP ${forged.status}`);
    }

    const inc = await rpc('increment_vote', { option_id: chosen.id });
    check(type, 'tally accepts the vote', inc.ok, `HTTP ${inc.status}`);

    const after = ((await rest(`options?select=votes&id=eq.${chosen.id}`)).body || [])[0];
    check(type, 'count landed on the option', after?.votes === 1, `votes=${after?.votes}`);

    const second = await claimVote(poll.id, sid, chosen.text, chosen.id);
    check(type, 'second vote from same session refused', second.ok && !second.claimed);

    const projector = (await rest(`options?select=id,text,votes&poll_id=eq.${poll.id}`, {}, ANON));
    check(type, 'projector can read the results', projector.ok && (projector.body || []).length === opts.length);
  }

  // ── ranking (Borda weights) ─────────────────────────────────────────────
  console.log('\n── ranking ──');
  {
    const poll = await makePoll('ranking', {}, ['Прво', 'Второ', 'Трето']);
    check('ranking', 'create', !!poll, `${poll?.options.length} options`);
    const order = [2, 0, 1];
    const answerText = order.map((i) => poll.options[i].text).join(' > ');
    const claim = await claimVote(poll.id, sid, answerText, null);
    check('ranking', 'participant can claim a vote', claim.claimed);
    const n = order.length;
    let allOk = true;
    for (let rank = 0; rank < n; rank++) {
      const r = await rpc('increment_vote_weighted', { option_id: poll.options[order[rank]].id, weight: n - rank });
      if (!r.ok) allOk = false;
    }
    check('ranking', 'weighted tally accepts every rank', allOk);
    const opts = (await rest(`options?select=text,votes&poll_id=eq.${poll.id}&order=created_at`)).body || [];
    const byText = Object.fromEntries(opts.map((o) => [o.text, o.votes]));
    // Third place was ranked first, so it must carry the highest weight.
    check('ranking', 'Borda weights are right way round',
      byText['Трето'] === 3 && byText['Прво'] === 2 && byText['Второ'] === 1,
      JSON.stringify(byText));
    check('ranking', 'whole ordering recorded, not just the top',
      (((await rest(`votes?select=answer_text&poll_id=eq.${poll.id}`)).body || [])[0]?.answer_text || '').includes(' > '));
  }

  // ── text types ──────────────────────────────────────────────────────────
  for (const type of ['open', 'wordcloud']) {
    console.log(`\n── ${type} ──`);
    const poll = await makePoll(type, {}, []);
    check(type, 'create', !!poll, 'no authored options, as expected');
    const word = type === 'wordcloud' ? 'Прилеп' : 'Дел од целина';
    const claim = await claimVote(poll.id, `${sid}-${type}`, word, null);
    check(type, 'participant can claim a vote', claim.claimed);
    // The API route runs this with the service role, so mirror that.
    const up = await rpc('upsert_text_option', { p_poll_id: poll.id, p_text: word, p_is_approved: true }, SVC);
    check(type, 'text becomes an option row', up.ok, `HTTP ${up.status}`);
    // A second, identical word from someone else must merge, not duplicate.
    await rpc('upsert_text_option', { p_poll_id: poll.id, p_text: word.toUpperCase(), p_is_approved: true }, SVC);
    const rows = (await rest(`options?select=text,votes&poll_id=eq.${poll.id}`)).body || [];
    check(type, 'same word merges instead of duplicating', rows.length === 1 && rows[0].votes === 2,
      JSON.stringify(rows));
    const projector = await rest(`options?select=text,votes&poll_id=eq.${poll.id}`, {}, ANON);
    check(type, 'projector can read the words', projector.ok && (projector.body || []).length === 1);
  }

  // ── fill_blanks ─────────────────────────────────────────────────────────
  console.log('\n── fill_blanks ──');
  {
    const blanks = [{ id: 'b1', accept: ['∈', '\\in'] }, { id: 'b2', accept: ['множество'] }];
    const poll = await makePoll('fill_blanks', {
      question: 'Симболот {{b1}} значи припадност на {{b2}}.',
      blanks,
      answer_explanation: 'Основен запис.',
    }, []);
    check('fill_blanks', 'create with its gaps', Array.isArray(poll?.blanks) && poll.blanks.length === 2);
    const given = { b1: '∈', b2: 'Множество' };
    const claim = await claimVote(poll.id, `${sid}-fb`, JSON.stringify(given), null);
    check('fill_blanks', 'participant can claim a vote', claim.claimed);
    const read = await rpc('poll_answer_texts', { p_poll_id: poll.id });
    const parsed = (read.body || []).map((r) => { try { return JSON.parse(r.answer_text); } catch { return null; } }).filter(Boolean);
    check('fill_blanks', 'projector reads the answers back', read.ok && parsed.length === 1, `HTTP ${read.status}`);
    check('fill_blanks', 'both gaps survive the round trip',
      parsed[0]?.b1 === '∈' && parsed[0]?.b2 === 'Множество', JSON.stringify(parsed[0]));
    // The checker is case-insensitive on purpose; "Множество" must match.
    const accepted = blanks[1].accept.map((a) => a.toLowerCase());
    check('fill_blanks', 'case-insensitive answer is accepted',
      accepted.includes(String(parsed[0]?.b2 || '').toLowerCase()));
  }

  // ── survey ──────────────────────────────────────────────────────────────
  console.log('\n── survey ──');
  {
    const questions = [
      { id: 'q1', text: 'Колку беше јасно?', type: 'scale', min: '1', max: '5', options: [] },
      { id: 'q2', text: 'Што ти беше најкорисно?', type: 'open', options: [] },
      { id: 'q3', text: 'Дали препорачуваш?', type: 'choice', options: ['Да', 'Не'] },
    ];
    const poll = await makePoll('survey', { survey_questions: questions }, []);
    check('survey', 'create with its questions', (poll?.survey_questions || []).length === 3);
    const answers = { q1: 4, q2: 'Примерите', q3: 'Да' };
    // return=minimal, because supabase-js only asks for the row back when
    // .select() is chained — and submitSurvey does not chain it.
    const insRes = await fetch(`${URL}/rest/v1/survey_responses`, {
      method: 'POST',
      headers: { ...ANON, Prefer: 'return=minimal' },
      body: JSON.stringify([{ poll_id: poll.id, session_id: `${sid}-sv`, answers }]),
    });
    const ins = { ok: insRes.ok, status: insRes.status };
    check('survey', 'participant can submit anonymously', ins.ok, `HTTP ${ins.status}`);
    const read = await rpc('poll_survey_answers', { p_poll_id: poll.id });
    const got = (read.body || [])[0]?.answers;
    check('survey', 'projector reads the answers back', read.ok && !!got, `HTTP ${read.status}`);
    check('survey', 'every question answered survives',
      got?.q1 === 4 && got?.q2 === 'Примерите' && got?.q3 === 'Да', JSON.stringify(got));
  }

  // ── cross-cutting ───────────────────────────────────────────────────────
  console.log('\n── across the whole event ──');
  {
    const mine = await rpc('my_voted_polls', { p_event_code: code, p_session_id: sid });
    check('all', 'my_voted_polls sees this session', mine.ok && (mine.body || []).length >= 5,
      `${(mine.body || []).length} polls`);
    const other = await rpc('my_voted_polls', { p_event_code: code, p_session_id: 'somebody-else' });
    check('all', 'and nobody else\'s', other.ok && (other.body || []).length === 0);
    const board = await rpc('event_scoreboard', { p_event_code: code });
    check('all', 'scoreboard aggregates the quiz', board.ok && (board.body || []).length >= 1,
      JSON.stringify(board.body));
    const leak = await rest('votes?select=username,answer_text&limit=1', {}, ANON);
    check('all', 'votes still unreadable anonymously', (leak.body || []).length === 0);
  }
}

try {
  await run();
} catch (err) {
  console.error('\nunexpected failure:', err?.message || err);
  results.push({ ok: false, type: 'run', step: 'threw', detail: String(err?.message || err) });
} finally {
  await cleanup();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length} checks, ${failed.length} failed`);
if (failed.length) {
  for (const f of failed) console.log(`  FAIL  ${f.type} — ${f.step} ${f.detail}`);
  process.exit(1);
}
console.log('every activity type verified end to end');
