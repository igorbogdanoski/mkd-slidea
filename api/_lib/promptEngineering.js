export const VALID_TYPES = ['poll', 'quiz', 'wordcloud', 'open', 'rating', 'ranking'];
export const VALID_STRATEGIES = ['default', 'cot', 'tot', 'sos', 'hybrid'];
export const VALID_BLOOM = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

const BLOOM_GUIDE = {
  remember:   'Bloom - Zapomnuvanje: fokus na fakti, definicii, termini.',
  understand: 'Bloom - Razbiranje: ucenikot objasnuva, parafrazira ili interpretira koncept.',
  apply:      'Bloom - Primena: ucenikot primenuva znaenje vo nova situacija.',
  analyze:    'Bloom - Analiza: ucenikot razlozuva informacii i identifikuva vrski.',
  evaluate:   'Bloom - Evaluacija: ucenikot kriticki ocenuva tvrdenja i resenija.',
  create:     'Bloom - Sozdavanje: ucenikot sintetizira novo resenie ili ideja.',
};

export const FEWSHOT_BY_TYPE = {
  quiz: `Primer (quiz):
{"question":"Kolku e 7 x 8?","type":"quiz","is_quiz":true,"options":[{"text":"54","is_correct":false},{"text":"56","is_correct":true},{"text":"63","is_correct":false},{"text":"49","is_correct":false}]}`,
  poll: `Primer (poll):
{"question":"Koj nacin na ucenje ti pomaga najmnogu?","type":"poll","is_quiz":false,"options":[{"text":"Video-uroci","is_correct":false},{"text":"Citanje","is_correct":false},{"text":"Resavanje zadaci","is_correct":false}]}`,
  wordcloud: `Primer (wordcloud):
{"question":"So eden zbor: sto ti asocira na prolet?","type":"wordcloud","is_quiz":false,"options":[]}`,
  open: `Primer (open):
{"question":"Opisi nakratko sto nauci denes na cas.","type":"open","is_quiz":false,"options":[]}`,
  rating: `Primer (rating):
{"question":"Kolku ti bese jasna lekcijata (1-5)?","type":"rating","is_quiz":false,"options":[]}`,
  ranking: `Primer (ranking):
{"question":"Podredi gi temite po vaznost za tebe.","type":"ranking","is_quiz":false,"options":[{"text":"Algebra","is_correct":false},{"text":"Geometrija","is_correct":false},{"text":"Statistika","is_correct":false}]}`,
};

export function isAdvancedReasoningStrategy(strategy) {
  return ['cot', 'tot', 'sos', 'hybrid'].includes(strategy);
}

export function validateGeneratePayload(payload) {
  const {
    prompt,
    type,
    strategy = 'default',
    bloom,
    gradeLevel,
    subject,
    imageBase64,
    imageMime,
  } = payload || {};

  const hasImage = typeof imageBase64 === 'string' && imageBase64.length > 100;
  const minPromptLen = hasImage ? 0 : 3;
  const maxImageBytesB64 = 4 * 1024 * 1024;

  if (!type || !VALID_TYPES.includes(type)) {
    return { ok: false, status: 400, error: 'Nevaliden tip na aktivnost.' };
  }
  if (!VALID_STRATEGIES.includes(strategy)) {
    return { ok: false, status: 400, error: 'Nevalidna strategija.' };
  }
  if (typeof prompt !== 'string' || prompt.trim().length < minPromptLen || prompt.length > 500) {
    return { ok: false, status: 400, error: 'Promptot mora da bide do 500 znaci.' };
  }
  if (hasImage && imageBase64.length > maxImageBytesB64) {
    return { ok: false, status: 413, error: 'Slikata e pregolema (max 3MB).' };
  }

  return {
    ok: true,
    data: {
      prompt,
      type,
      strategy,
      bloom: VALID_BLOOM.includes(bloom) ? bloom : null,
      gradeLevel: typeof gradeLevel === 'string' ? gradeLevel.slice(0, 40) : '',
      subject: typeof subject === 'string' ? subject.slice(0, 60) : '',
      hasImage,
      imageBase64: hasImage ? imageBase64 : null,
      imageMime: imageMime || 'image/png',
    },
  };
}

export function buildPedagogicalContext({ bloom, gradeLevel, subject }) {
  return [
    bloom ? BLOOM_GUIDE[bloom] : '',
    gradeLevel ? `Vozrasna grupa / oddelenie: ${gradeLevel}.` : '',
    subject ? `Predmet: ${subject}.` : '',
  ].filter(Boolean).join(' ');
}

export function buildReasoningInstructions(strategy) {
  const base = [
    'Primeni Skeleton-of-Thought (SoS): napravi kratok plan so 3-5 cekori pred finalniot odgovor.',
    'Primeni self-consistency proverka: validiraj deka prasanje/opcii se usoglaseni so tipot i Bloom kontekstot.',
    'Primeni critic-refine pass: korigiraj nejasni ili dvosmisleni formulacii pred finalen JSON.',
  ];

  if (strategy === 'cot') {
    return `${base.join(' ')} Dopolnitelno: primeni Chain-of-Thought vo pozadina za podlaboka analiza na konceptot.`;
  }
  if (strategy === 'tot') {
    return `${base.join(' ')} Dopolnitelno: primeni Tree-of-Thoughts vo pozadina (3 kandidati), pa izberi najpedagoskiot.`;
  }
  if (strategy === 'sos') {
    return `${base.join(' ')} Fokus: SoS discipliniran raspored (plan -> validacija -> finalen JSON).`;
  }
  if (strategy === 'hybrid') {
    return `${base.join(' ')} Dopolnitelno: kombiniraj SoS + ToT + CoT vo pozadina, no vrati samo finalen JSON.`;
  }
  return `${base.join(' ')} Standard mode: SoS + self-check bez dolg interen reasoning.`;
}

export function buildSystemInstructions({
  type,
  prompt,
  pedagogicalContext,
  strategyInstructions,
  visionInstructions,
  ragContext,
  fewShot,
}) {
  return `Ti si svetski ekspert za Prompt Engineering i EdTech za MKD Slidea.
Kreiraj ${type === 'quiz' ? 'KVIZ' : 'INTERAKTIVNA AKTIVNOST'} (${type}) na tema: "${prompt || '(vidi prikacena slika)'}".
${pedagogicalContext}
${strategyInstructions}
${visionInstructions}
${ragContext}

PRAVILA:
1. Izlezot MORA da bide SAMO validen JSON objekt (bez markdown wrappers, bez objasnuvanja).
2. Koristi cist MAKEDONSKI literaturen jazik; tocna interpunkcija i pravopis.
3. Prasanjeto da e jasno, nedvosmisleno, edukativno i vozrasno soodvetno.
4. Za tip "quiz": TOCNO 3 ILI 4 opcii, TOCNO EDNA so "is_correct": true; pogresnite odgovori da bidat verodostojni.
5. Za tip "poll" / "ranking": 3-5 opcii; site so "is_correct": false.
6. Za "wordcloud", "open", "rating": options MORA da bide prazna niza [].
7. Ne povtoruvaj go prasanjeto vo opciite. Ne koristi "site navedeni" / "nitu edno".

JSON Sema:
{"question":"...","type":"${type}","is_quiz":${type === 'quiz'},"options":[...]}

${fewShot}`;
}