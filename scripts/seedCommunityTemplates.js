// ============================================================================
// Seed community_templates со 20 квалитетни MK наставни шаблони
// Usage: node --use-system-ca scripts/seedCommunityTemplates.js
// Idempotent — skip ако веќе постои ист slug.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function loadDotenv(file) {
  try {
    const raw = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const k = m[1]; let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
  } catch { /* ok */ }
}
loadDotenv('.env.local');
loadDotenv('.env');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) { console.error('❌ Missing Supabase env'); process.exit(1); }

// ─── Template definitions ────────────────────────────────────────────────────
// polls[] format: { question, type, is_quiz, options: [{text, is_correct?}] }

const TEMPLATES = [
  // ── МАТЕМАТИКА ──────────────────────────────────────────────────────────
  {
    title: 'Дропки — основни поими (G5)',
    description: 'Квиз за основни поими за дропки: именател, броител, вид дропки. Прв час за воведување во наставна единица.',
    subject: 'math', grade: 'G5', category: 'Математика', icon: '➗',
    author_name: 'MKD Slidea', is_public: true, is_published: true, uses_count: 0,
    polls: [
      { question: 'Кој дел од дропката покажува на колку еднакви делови е поделена целината?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Именател', is_correct: true }, { text: 'Броител', is_correct: false }, { text: 'Разломочна линија', is_correct: false }, { text: 'Цел број', is_correct: false }] },
      { question: 'Колку е вредноста на дропката 4/4?', type: 'quiz', is_quiz: true,
        options: [{ text: '1', is_correct: true }, { text: '0', is_correct: false }, { text: '2', is_correct: false }, { text: '4', is_correct: false }] },
      { question: 'Која дропка е поголема: 3/4 или 2/4?', type: 'quiz', is_quiz: true,
        options: [{ text: '3/4', is_correct: true }, { text: '2/4', is_correct: false }, { text: 'Се еднакви', is_correct: false }, { text: 'Не може да се споредат', is_correct: false }] },
      { question: 'Напиши пример за сопствена дропка (broitel < imenatel):', type: 'open', is_quiz: false, options: [] },
      { question: 'Кој тип дропки најчесто ги користите во секојдневниот живот?', type: 'word_cloud', is_quiz: false, options: [] },
    ],
  },
  {
    title: 'Питагорова теорема — проверка на знаење (G8)',
    description: '5-прашален квиз за Питагорова теорема, примена на прав агол и пресметка на хипотенуза/катети.',
    subject: 'math', grade: 'G8', category: 'Математика', icon: '📐',
    author_name: 'MKD Slidea', is_public: true, is_published: true, uses_count: 0,
    polls: [
      { question: 'Во правоаголен триаголник, ако катетите се a=3 и b=4, колку е хипотенузата c?', type: 'quiz', is_quiz: true,
        options: [{ text: '5', is_correct: true }, { text: '7', is_correct: false }, { text: '25', is_correct: false }, { text: '12', is_correct: false }] },
      { question: 'Питагоровата теорема важи за:', type: 'quiz', is_quiz: true,
        options: [{ text: 'Само правоаголни триаголници', is_correct: true }, { text: 'Сите триаголници', is_correct: false }, { text: 'Само рамностранични триаголници', is_correct: false }, { text: 'Квадрати', is_correct: false }] },
      { question: 'Ако хипотенузата е 10 и катета а = 6, колку е катета b?', type: 'quiz', is_quiz: true,
        options: [{ text: '8', is_correct: true }, { text: '4', is_correct: false }, { text: '64', is_correct: false }, { text: '16', is_correct: false }] },
      { question: 'Питагоровата теорема гласи: c² = ?', type: 'quiz', is_quiz: true,
        options: [{ text: 'a² + b²', is_correct: true }, { text: 'a + b', is_correct: false }, { text: '(a+b)²', is_correct: false }, { text: 'a² − b²', is_correct: false }] },
      { question: 'Каде во реалниот живот се применува Питагоровата теорема?', type: 'word_cloud', is_quiz: false, options: [] },
    ],
  },
  {
    title: 'Линеарни равенки — едно непознато (G7)',
    description: 'Квиз за решавање линеарни равенки со едно непознато. Проверка на разбирање на постапката за изолирање на x.',
    subject: 'math', grade: 'G7', category: 'Математика', icon: '🔢',
    author_name: 'MKD Slidea', is_public: true, is_published: true, uses_count: 0,
    polls: [
      { question: 'Реши: x + 5 = 12. Колку е x?', type: 'quiz', is_quiz: true,
        options: [{ text: '7', is_correct: true }, { text: '17', is_correct: false }, { text: '5', is_correct: false }, { text: '12', is_correct: false }] },
      { question: 'Реши: 3x = 18. Колку е x?', type: 'quiz', is_quiz: true,
        options: [{ text: '6', is_correct: true }, { text: '54', is_correct: false }, { text: '15', is_correct: false }, { text: '3', is_correct: false }] },
      { question: 'Реши: 2x − 4 = 10. Колку е x?', type: 'quiz', is_quiz: true,
        options: [{ text: '7', is_correct: true }, { text: '3', is_correct: false }, { text: '5', is_correct: false }, { text: '8', is_correct: false }] },
      { question: 'Кој е прв чекор при решавање на равенката 5x + 3 = 23?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Одземи 3 од двете страни', is_correct: true }, { text: 'Подели со 5', is_correct: false }, { text: 'Помножи со 5', is_correct: false }, { text: 'Собери 23 и 3', is_correct: false }] },
      { question: 'Дај свој пример за линеарна равенка и реши ја:', type: 'open', is_quiz: false, options: [] },
    ],
  },
  {
    title: 'Процент и сразмер (G6)',
    description: 'Практичен квиз за пресметка на проценти, попуст и сразмер — со примери од секојдневниот живот.',
    subject: 'math', grade: 'G6', category: 'Математика', icon: '💯',
    author_name: 'MKD Slidea', is_public: true, is_published: true, uses_count: 0,
    polls: [
      { question: 'Колку е 20% од 150?', type: 'quiz', is_quiz: true,
        options: [{ text: '30', is_correct: true }, { text: '20', is_correct: false }, { text: '15', is_correct: false }, { text: '50', is_correct: false }] },
      { question: 'Производ чини 200 ден. Попустот е 15%. Нова цена?', type: 'quiz', is_quiz: true,
        options: [{ text: '170 ден', is_correct: true }, { text: '180 ден', is_correct: false }, { text: '185 ден', is_correct: false }, { text: '215 ден', is_correct: false }] },
      { question: 'Ако 3 книги чинат 360 ден, колку чинат 5 книги?', type: 'quiz', is_quiz: true,
        options: [{ text: '600 ден', is_correct: true }, { text: '540 ден', is_correct: false }, { text: '480 ден', is_correct: false }, { text: '720 ден', is_correct: false }] },
      { question: 'Во кои ситуации користиш проценти?', type: 'word_cloud', is_quiz: false, options: [] },
    ],
  },
  {
    title: 'Квадратни равенки (G9)',
    description: 'Квиз за решавање квадратни равенки со дискриминанта. Проверка на разбирање на формулата и интерпретација на резултатот.',
    subject: 'math', grade: 'G9', category: 'Математика', icon: '²',
    author_name: 'MKD Slidea', is_public: true, is_published: true, uses_count: 0,
    polls: [
      { question: 'За квадратната равенка ax²+bx+c=0, дискриминантата D = ?', type: 'quiz', is_quiz: true,
        options: [{ text: 'b²−4ac', is_correct: true }, { text: 'b²+4ac', is_correct: false }, { text: '4ac−b²', is_correct: false }, { text: '√(b²−4ac)', is_correct: false }] },
      { question: 'Реши: x²−5x+6=0. Кои се решенијата?', type: 'quiz', is_quiz: true,
        options: [{ text: 'x₁=2, x₂=3', is_correct: true }, { text: 'x₁=1, x₂=6', is_correct: false }, { text: 'x₁=−2, x₂=−3', is_correct: false }, { text: 'x₁=5, x₂=6', is_correct: false }] },
      { question: 'Ако D < 0, равенката има:', type: 'quiz', is_quiz: true,
        options: [{ text: 'Нема реални решенија', is_correct: true }, { text: '1 решение', is_correct: false }, { text: '2 различни решенија', is_correct: false }, { text: '3 решенија', is_correct: false }] },
      { question: 'Колку е тешко квадратните равенки за вас?', type: 'rating', is_quiz: false, options: [] },
    ],
  },

  // ── БИОЛОГИЈА ───────────────────────────────────────────────────────────
  {
    title: 'Клетка — основна единица на животот (G6)',
    description: 'Воведен квиз за структурата на клетката — органели, разлика меѓу растителна и животинска клетка.',
    subject: 'biology', grade: 'G6', category: 'Биологија', icon: '🔬',
    author_name: 'MKD Slidea', is_public: true, is_published: true, uses_count: 0,
    polls: [
      { question: 'Која органела е "мозок" на клетката?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Јадро (нуклеус)', is_correct: true }, { text: 'Митохондрија', is_correct: false }, { text: 'Рибозом', is_correct: false }, { text: 'Клеточна мембрана', is_correct: false }] },
      { question: 'Која органела ја произведува енергијата?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Митохондрија', is_correct: true }, { text: 'Хлоропласт', is_correct: false }, { text: 'Голџиев апарат', is_correct: false }, { text: 'Ендоплазматичен ретикулум', is_correct: false }] },
      { question: 'Што го има растителната клетка, а го нема животинската?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Клеточен ѕид и хлоропласт', is_correct: true }, { text: 'Јадро', is_correct: false }, { text: 'Митохондрија', is_correct: false }, { text: 'Рибозом', is_correct: false }] },
      { question: 'Напишете ги органелите кои ги паметите:', type: 'word_cloud', is_quiz: false, options: [] },
    ],
  },
  {
    title: 'Фотосинтеза — процес на живот (G7)',
    description: 'Квиз за процесот на фотосинтеза, потребните состојки и производи. Поврзување со клима и животна средина.',
    subject: 'biology', grade: 'G7', category: 'Биологија', icon: '🌿',
    author_name: 'MKD Slidea', is_public: true, is_published: true, uses_count: 0,
    polls: [
      { question: 'Фотосинтезата се одвива во:', type: 'quiz', is_quiz: true,
        options: [{ text: 'Хлоропласт', is_correct: true }, { text: 'Митохондрија', is_correct: false }, { text: 'Јадро', is_correct: false }, { text: 'Вакуола', is_correct: false }] },
      { question: 'Кои се производи на фотосинтезата?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Гликоза и кислород', is_correct: true }, { text: 'CO₂ и вода', is_correct: false }, { text: 'Азот и гликоза', is_correct: false }, { text: 'Вода и кислород', is_correct: false }] },
      { question: 'Зошто листовите се зелени?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Поради хлорофилот', is_correct: true }, { text: 'Поради вода', is_correct: false }, { text: 'Поради CO₂', is_correct: false }, { text: 'Поради сончевата светлина', is_correct: false }] },
      { question: 'Зошто е важна фотосинтезата за луѓето?', type: 'open', is_quiz: false, options: [] },
    ],
  },
  {
    title: 'Човечки систем за варење (G8)',
    description: 'Интерактивен квиз за органите на дигестивниот систем и нивните функции.',
    subject: 'biology', grade: 'G8', category: 'Биологија', icon: '🫀',
    author_name: 'MKD Slidea', is_public: true, is_published: true, uses_count: 0,
    polls: [
      { question: 'Каде почнува варењето на храната?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Во устата', is_correct: true }, { text: 'Во желудникот', is_correct: false }, { text: 'Во тенкото црево', is_correct: false }, { text: 'Во дебелото црево', is_correct: false }] },
      { question: 'Каде се апсорбираат хранливите материи?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Тенко црево', is_correct: true }, { text: 'Желудник', is_correct: false }, { text: 'Дебело црево', is_correct: false }, { text: 'Уста', is_correct: false }] },
      { question: 'Која жлезда лачи инсулин?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Панкреас', is_correct: true }, { text: 'Слезена', is_correct: false }, { text: 'Черен дроб', is_correct: false }, { text: 'Желудник', is_correct: false }] },
      { question: 'Набројте ги органите на дигестивниот систем по ред:', type: 'word_cloud', is_quiz: false, options: [] },
    ],
  },

  // ── МАКЕДОНСКИ ЈАЗИК ────────────────────────────────────────────────────
  {
    title: 'Именки — род и број (G5)',
    description: 'Квиз за именки, нивниот граматички род (машки/женски/среден) и број (еднина/множина).',
    subject: 'mk_language', grade: 'G5', category: 'Македонски јазик', icon: '📝',
    author_name: 'MKD Slidea', is_public: true, is_published: true, uses_count: 0,
    polls: [
      { question: 'Кој е родот на именката „книга"?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Женски', is_correct: true }, { text: 'Машки', is_correct: false }, { text: 'Среден', is_correct: false }] },
      { question: 'Каква е именката „деца"?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Средни род, множина', is_correct: true }, { text: 'Женски род, множина', is_correct: false }, { text: 'Машки род, еднина', is_correct: false }] },
      { question: 'Кој е членот за женски род именки во еднина?', type: 'quiz', is_quiz: true,
        options: [{ text: '-та / -ва', is_correct: true }, { text: '-от / -ов', is_correct: false }, { text: '-то / -во', is_correct: false }] },
      { question: 'Дај примери за именки со среден род:', type: 'open', is_quiz: false, options: [] },
    ],
  },
  {
    title: 'Глаголи — времиња (G7)',
    description: 'Проверка на познавање на глаголски времиња: сегашно, минато определено и идно. Примери во реченици.',
    subject: 'mk_language', grade: 'G7', category: 'Македонски јазик', icon: '✍️',
    author_name: 'MKD Slidea', is_public: true, is_published: true, uses_count: 0,
    polls: [
      { question: 'Во кое глаголско време е реченицата: „Јас читав книга."?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Минато определено', is_correct: true }, { text: 'Сегашно', is_correct: false }, { text: 'Идно', is_correct: false }, { text: 'Минато неопределено', is_correct: false }] },
      { question: 'Префрли во идно време: „Тој пишува."', type: 'quiz', is_quiz: true,
        options: [{ text: 'Тој ќе пишува', is_correct: true }, { text: 'Тој пишуваше', is_correct: false }, { text: 'Тој напишал', is_correct: false }, { text: 'Тој пишал', is_correct: false }] },
      { question: 'Глаголот „учи" во минато определено е:', type: 'quiz', is_quiz: true,
        options: [{ text: 'учеше', is_correct: true }, { text: 'учи', is_correct: false }, { text: 'ќе учи', is_correct: false }, { text: 'научил', is_correct: false }] },
      { question: 'Напишете реченица во идно време:', type: 'open', is_quiz: false, options: [] },
    ],
  },

  // ── ФИЗИКА ──────────────────────────────────────────────────────────────
  {
    title: 'Сила и движење (G7)',
    description: 'Воведен квиз за основните поими: сила, резултантна сила, Newtonovi закони, мерна единица за сила.',
    subject: 'physics', grade: 'G7', category: 'Физика', icon: '⚡',
    author_name: 'MKD Slidea', is_public: true, is_published: true, uses_count: 0,
    polls: [
      { question: 'Која е мерната единица за сила?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Њутн (N)', is_correct: true }, { text: 'Џул (J)', is_correct: false }, { text: 'Ват (W)', is_correct: false }, { text: 'Паскал (Pa)', is_correct: false }] },
      { question: 'Прв закон на Њутн: Телото мирува или се движи рамномерно ако...', type: 'quiz', is_quiz: true,
        options: [{ text: 'Резултантната сила е нула', is_correct: true }, { text: 'Силата е голема', is_correct: false }, { text: 'Масата е мала', is_correct: false }, { text: 'Брзината расте', is_correct: false }] },
      { question: 'Ако F=20N и m=4kg, забрзувањето e:', type: 'quiz', is_quiz: true,
        options: [{ text: '5 m/s²', is_correct: true }, { text: '80 m/s²', is_correct: false }, { text: '0.2 m/s²', is_correct: false }, { text: '16 m/s²', is_correct: false }] },
      { question: 'Каде во секојдневниот живот ги гледаш Njutnovi закoni?', type: 'word_cloud', is_quiz: false, options: [] },
    ],
  },
  {
    title: 'Електричество — основи (G8)',
    description: 'Квиз за основни поими: напон, струја, отпор. Омов закон. Серискo и паралелнo поврзување.',
    subject: 'physics', grade: 'G8', category: 'Физика', icon: '🔋',
    author_name: 'MKD Slidea', is_public: true, is_published: true, uses_count: 0,
    polls: [
      { question: 'Омовиот закон гласи: I = ?', type: 'quiz', is_quiz: true,
        options: [{ text: 'U / R', is_correct: true }, { text: 'U × R', is_correct: false }, { text: 'R / U', is_correct: false }, { text: 'P / U', is_correct: false }] },
      { question: 'Мерната единица за електричен отпор е:', type: 'quiz', is_quiz: true,
        options: [{ text: 'Ом (Ω)', is_correct: true }, { text: 'Волт (V)', is_correct: false }, { text: 'Ампер (A)', is_correct: false }, { text: 'Ват (W)', is_correct: false }] },
      { question: 'Во сериско поврзување, вкупниот отпор е:', type: 'quiz', is_quiz: true,
        options: [{ text: 'Збир на сите отпори', is_correct: true }, { text: 'Помал од најмалиот', is_correct: false }, { text: 'Еднаков на секој', is_correct: false }, { text: 'Производ', is_correct: false }] },
      { question: 'Наброј уреди кои трошат струја во твојот дом:', type: 'word_cloud', is_quiz: false, options: [] },
    ],
  },

  // ── ИСТОРИЈА ────────────────────────────────────────────────────────────
  {
    title: 'Античка Македонија — Александар Велики (G6)',
    description: 'Квиз за периодот на Античка Македонија, владеењето на Филип II и Александар Велики.',
    subject: 'history', grade: 'G6', category: 'Историја', icon: '🏛️',
    author_name: 'MKD Slidea', is_public: true, is_published: true, uses_count: 0,
    polls: [
      { question: 'Кој го основал Македонското кралство и го обединил?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Филип II Македонски', is_correct: true }, { text: 'Александар Велики', is_correct: false }, { text: 'Пердика I', is_correct: false }, { text: 'Касандар', is_correct: false }] },
      { question: 'До каде стигнале освојувањата на Александар Велики?', type: 'quiz', is_quiz: true,
        options: [{ text: 'До Индија', is_correct: true }, { text: 'До Кина', is_correct: false }, { text: 'До Рим', is_correct: false }, { text: 'До Скандинавија', is_correct: false }] },
      { question: 'Во кој век живеел Александар Велики?', type: 'quiz', is_quiz: true,
        options: [{ text: 'IV век пр.н.е.', is_correct: true }, { text: 'III век пр.н.е.', is_correct: false }, { text: 'V век пр.н.е.', is_correct: false }, { text: 'I век пр.н.е.', is_correct: false }] },
      { question: 'Кое значење има Александар Велики за вас денес?', type: 'open', is_quiz: false, options: [] },
    ],
  },
  {
    title: 'Втора светска војна — клучни настани (G8)',
    description: 'Квиз за главните настани на Втора светска војна, нацистичка Германија, НОБ и ослободувањето.',
    subject: 'history', grade: 'G8', category: 'Историја', icon: '🕊️',
    author_name: 'MKD Slidea', is_public: true, is_published: true, uses_count: 0,
    polls: [
      { question: 'Кога започна Втората светска војна?', type: 'quiz', is_quiz: true,
        options: [{ text: '1939 год.', is_correct: true }, { text: '1941 год.', is_correct: false }, { text: '1936 год.', is_correct: false }, { text: '1945 год.', is_correct: false }] },
      { question: 'Кои земји формираа коалицијата на Сили на оската?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Германија, Италија, Јапонија', is_correct: true }, { text: 'СССР, САД, Британија', is_correct: false }, { text: 'Франција, Полска, Грција', is_correct: false }, { text: 'Кина, Индија, Иран', is_correct: false }] },
      { question: 'НОВ во Македонија е основана на:', type: 'quiz', is_quiz: true,
        options: [{ text: '11 октомври 1941', is_correct: true }, { text: '2 август 1944', is_correct: false }, { text: '8 септември 1944', is_correct: false }, { text: '29 ноември 1943', is_correct: false }] },
      { question: 'Која е поуката од Втората светска војна?', type: 'open', is_quiz: false, options: [] },
    ],
  },

  // ── ХЕМИЈА ──────────────────────────────────────────────────────────────
  {
    title: 'Атоми, молекули и елементи (G7)',
    description: 'Воведен квиз за атомска структура, хемиски елементи, периоден систем и молекули.',
    subject: 'chemistry', grade: 'G7', category: 'Хемија', icon: '⚗️',
    author_name: 'MKD Slidea', is_public: true, is_published: true, uses_count: 0,
    polls: [
      { question: 'Атомот е составен од:', type: 'quiz', is_quiz: true,
        options: [{ text: 'Протони, неутрони и електрони', is_correct: true }, { text: 'Само протони и електрони', is_correct: false }, { text: 'Молекули и јони', is_correct: false }, { text: 'Јадро и орбити', is_correct: false }] },
      { question: 'Атомскиот број на елементот го покажува бројот на:', type: 'quiz', is_quiz: true,
        options: [{ text: 'Протони', is_correct: true }, { text: 'Неутрони', is_correct: false }, { text: 'Електрони + Неутрони', is_correct: false }, { text: 'Маса на атомот', is_correct: false }] },
      { question: 'Водата (H₂O) е:', type: 'quiz', is_quiz: true,
        options: [{ text: 'Молекулско соединение', is_correct: true }, { text: 'Хемиски елемент', is_correct: false }, { text: 'Атом', is_correct: false }, { text: 'Јон', is_correct: false }] },
      { question: 'Наброј хемиски елементи кои ги знаеш:', type: 'word_cloud', is_quiz: false, options: [] },
    ],
  },

  // ── ГЕОГРАФИЈА ───────────────────────────────────────────────────────────
  {
    title: 'Македонија — географија и природни одлики (G6)',
    description: 'Квиз за основните географски одлики на Македонија: реки, езера, планини, општини и клима.',
    subject: 'geography', grade: 'G6', category: 'Географија', icon: '🗺️',
    author_name: 'MKD Slidea', is_public: true, is_published: true, uses_count: 0,
    polls: [
      { question: 'Кое е најголемото езеро во Македонија?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Охридско Езеро', is_correct: true }, { text: 'Дојранско Езеро', is_correct: false }, { text: 'Преспанско Езеро', is_correct: false }, { text: 'Матка', is_correct: false }] },
      { question: 'Најдолгата река во Македонија е:', type: 'quiz', is_quiz: true,
        options: [{ text: 'Вардар', is_correct: true }, { text: 'Треска', is_correct: false }, { text: 'Брегалница', is_correct: false }, { text: 'Черна', is_correct: false }] },
      { question: 'Најголемата и највисока Македонска планина?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Кораб', is_correct: true }, { text: 'Шар Планина', is_correct: false }, { text: 'Пелистер', is_correct: false }, { text: 'Јакупица', is_correct: false }] },
      { question: 'Каков тип клима има Македонија?', type: 'poll', is_quiz: false,
        options: [{ text: 'Континентална', is_correct: false }, { text: 'Медитеранска', is_correct: false }, { text: 'Планинска', is_correct: false }, { text: 'Мешана', is_correct: false }] },
    ],
  },

  // ── АНГЛИСКИ ЈАЗИК ──────────────────────────────────────────────────────
  {
    title: 'Present Simple vs Present Continuous (G6)',
    description: 'Quiz for differentiating Present Simple and Present Continuous tenses with examples from everyday life.',
    subject: 'english', grade: 'G6', category: 'Англиски јазик', icon: '🇬🇧',
    author_name: 'MKD Slidea', is_public: true, is_published: true, uses_count: 0,
    polls: [
      { question: 'Which sentence uses Present Continuous correctly?', type: 'quiz', is_quiz: true,
        options: [{ text: 'She is reading a book now.', is_correct: true }, { text: 'She reads a book now.', is_correct: false }, { text: 'She read a book now.', is_correct: false }, { text: 'She was reading a book now.', is_correct: false }] },
      { question: 'We use Present Simple for:', type: 'quiz', is_quiz: true,
        options: [{ text: 'Habits and daily routines', is_correct: true }, { text: 'Actions happening right now', is_correct: false }, { text: 'Future plans', is_correct: false }, { text: 'Past events', is_correct: false }] },
      { question: 'Complete: "Every morning, I _____ (to drink) coffee."', type: 'quiz', is_quiz: true,
        options: [{ text: 'drink', is_correct: true }, { text: 'am drinking', is_correct: false }, { text: 'drank', is_correct: false }, { text: 'drinks', is_correct: false }] },
      { question: 'Write a sentence using Present Continuous:', type: 'open', is_quiz: false, options: [] },
    ],
  },
  {
    title: 'School Vocabulary & Daily Routine (G5)',
    description: 'Interactive vocabulary quiz about school subjects, classroom objects, and daily routine phrases.',
    subject: 'english', grade: 'G5', category: 'Англиски јазик', icon: '🏫',
    author_name: 'MKD Slidea', is_public: true, is_published: true, uses_count: 0,
    polls: [
      { question: 'What do you call the person who teaches you?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Teacher', is_correct: true }, { text: 'Student', is_correct: false }, { text: 'Principal', is_correct: false }, { text: 'Librarian', is_correct: false }] },
      { question: 'Which is a school subject?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Mathematics', is_correct: true }, { text: 'Football', is_correct: false }, { text: 'Pizza', is_correct: false }, { text: 'Television', is_correct: false }] },
      { question: 'What time do you usually start school?', type: 'poll', is_quiz: false,
        options: [{ text: '7:00 AM', is_correct: false }, { text: '7:30 AM', is_correct: false }, { text: '8:00 AM', is_correct: false }, { text: '8:30 AM', is_correct: false }] },
      { question: 'Write your favourite school subject in English:', type: 'word_cloud', is_quiz: false, options: [] },
    ],
  },
];

// ─── Supabase helper ──────────────────────────────────────────────────────────
async function sb(p2, init = {}) {
  const res = await fetch(`${SUPABASE_URL}${p2}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  if (res.status === 204) return null;
  const body = await res.json();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${JSON.stringify(body).slice(0, 200)}`);
  return body;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log(`🎓 Seeding ${TEMPLATES.length} community templates...`);
let inserted = 0, skipped = 0, failed = 0;

for (const t of TEMPLATES) {
  const { polls, ...meta } = t;
  try {
    // Skip if slug already exists (idempotent)
    const existing = await sb(`/rest/v1/community_templates?select=id&title=eq.${encodeURIComponent(meta.title)}&limit=1`);
    if (existing?.length) { skipped++; process.stdout.write(`  ○ skip: ${meta.title.slice(0,50)}\n`); continue; }

    const row = { ...meta, polls };
    await sb('/rest/v1/community_templates', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(row),
    });
    inserted++;
    process.stdout.write(`  ✔ ${meta.subject} ${meta.grade} — ${meta.title.slice(0, 50)}\n`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${meta.title.slice(0, 40)}: ${e.message}`);
  }
}

console.log(`\n✅ Готово: ${inserted} вметнати, ${skipped} прескокнати, ${failed} неуспешни.`);
console.log('👉 Embed-batch ќе ги векторизира при следното пуштање.');
