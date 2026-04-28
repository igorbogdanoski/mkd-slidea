// 20 ready-made starter templates organized by subject and grade level.
// Each template = a multi-poll lesson activity.
// Used by TemplateGalleryModal to one-click create polls in an event.

export const STARTER_TEMPLATES = [
  // ─── Математика ──────────────────────────────────────────────
  {
    id: 'math-fractions-elementary',
    title: 'Дропки — основни поими',
    subject: 'Математика',
    grade: 'Основно (5-6 одд.)',
    icon: '🔢',
    color: 'from-blue-500 to-cyan-500',
    description: 'Краток квиз за разбирање на дропки — собирање, споредба и претворање.',
    polls: [
      {
        question: 'Што е дропка?',
        type: 'poll', is_quiz: false,
        options: [
          { text: 'Број што претставува дел од целина', is_correct: false },
          { text: 'Само цел број', is_correct: false },
          { text: 'Знак за множење', is_correct: false },
        ],
      },
      {
        question: 'Колку е 1/2 + 1/4?',
        type: 'quiz', is_quiz: true,
        options: [
          { text: '2/6', is_correct: false },
          { text: '3/4', is_correct: true },
          { text: '1/6', is_correct: false },
          { text: '2/4', is_correct: false },
        ],
      },
      {
        question: 'Која е поголема: 3/5 или 4/7?',
        type: 'quiz', is_quiz: true,
        options: [
          { text: '3/5', is_correct: true },
          { text: '4/7', is_correct: false },
          { text: 'Еднакви се', is_correct: false },
        ],
      },
    ],
  },
  {
    id: 'math-pythagoras',
    title: 'Питагорова теорема',
    subject: 'Математика',
    grade: 'Средно',
    icon: '📐',
    color: 'from-blue-500 to-indigo-500',
    description: 'Примена на Питагорова теорема со 4 прашања.',
    polls: [
      { question: 'Што гласи Питагоровата теорема?', type: 'poll', is_quiz: false,
        options: [{ text: 'a² + b² = c²' }, { text: 'a + b = c' }, { text: 'a × b = c' }] },
      { question: 'Ако катетите се 3 и 4, колку е хипотенузата?', type: 'quiz', is_quiz: true,
        options: [{ text: '5', is_correct: true }, { text: '7', is_correct: false }, { text: '12', is_correct: false }, { text: '6', is_correct: false }] },
      { question: 'Колку ти беше јасна оваа лекција?', type: 'rating', is_quiz: false, options: [] },
    ],
  },
  {
    id: 'math-percentages',
    title: 'Проценти во секојдневието',
    subject: 'Математика',
    grade: 'Основно (7-8 одд.)',
    icon: '📊',
    color: 'from-purple-500 to-pink-500',
    description: 'Пресметка на попусти, ДДВ и проценти.',
    polls: [
      { question: '20% од 150 е?', type: 'quiz', is_quiz: true,
        options: [{ text: '30', is_correct: true }, { text: '20', is_correct: false }, { text: '50', is_correct: false }, { text: '15', is_correct: false }] },
      { question: 'Цена 800 ден. со попуст 25%, плаќаш?', type: 'quiz', is_quiz: true,
        options: [{ text: '600', is_correct: true }, { text: '775', is_correct: false }, { text: '400', is_correct: false }] },
    ],
  },

  // ─── Информатика ─────────────────────────────────────────────
  {
    id: 'cs-html-basics',
    title: 'HTML — основни ознаки',
    subject: 'Информатика',
    grade: 'Средно',
    icon: '💻',
    color: 'from-orange-500 to-red-500',
    description: 'Препознавање на HTML елементи и нивна функција.',
    polls: [
      { question: 'Која ознака е за наслов?', type: 'quiz', is_quiz: true,
        options: [{ text: '<h1>', is_correct: true }, { text: '<p>', is_correct: false }, { text: '<title>', is_correct: false }, { text: '<head>', is_correct: false }] },
      { question: 'За што служи <a href="...">?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Линк', is_correct: true }, { text: 'Слика', is_correct: false }, { text: 'Параграф', is_correct: false }] },
      { question: 'Со еден збор: што мислиш за веб дизајн?', type: 'wordcloud', is_quiz: false, options: [] },
    ],
  },
  {
    id: 'cs-algorithms',
    title: 'Алгоритми — впишување',
    subject: 'Информатика',
    grade: 'Средно',
    icon: '⚙️',
    color: 'from-emerald-500 to-teal-500',
    description: 'Концепти на алгоритамско размислување.',
    polls: [
      { question: 'Што е алгоритам?', type: 'poll', is_quiz: false,
        options: [{ text: 'Низа на чекори за решавање проблем' }, { text: 'Програмски јазик' }, { text: 'Само математичка формула' }] },
      { question: 'Која е сложеноста на бинарно пребарување?', type: 'quiz', is_quiz: true,
        options: [{ text: 'O(log n)', is_correct: true }, { text: 'O(n)', is_correct: false }, { text: 'O(n²)', is_correct: false }] },
    ],
  },
  {
    id: 'cs-internet-safety',
    title: 'Интернет безбедност',
    subject: 'Информатика',
    grade: 'Основно',
    icon: '🛡️',
    color: 'from-red-500 to-rose-500',
    description: 'Како да се заштитиш онлајн.',
    polls: [
      { question: 'Дали смееш да делиш лозинка со друг?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Никогаш', is_correct: true }, { text: 'Само со пријатели', is_correct: false }, { text: 'Секогаш', is_correct: false }] },
      { question: 'Со еден збор: што е најголема онлајн закана?', type: 'wordcloud', is_quiz: false, options: [] },
    ],
  },

  // ─── Англиски јазик ──────────────────────────────────────────
  {
    id: 'eng-tenses',
    title: 'English Tenses Review',
    subject: 'Англиски',
    grade: 'Средно',
    icon: '🇬🇧',
    color: 'from-indigo-500 to-purple-500',
    description: 'Present Simple vs Present Continuous and more.',
    polls: [
      { question: 'I ___ to school every day.', type: 'quiz', is_quiz: true,
        options: [{ text: 'go', is_correct: true }, { text: 'going', is_correct: false }, { text: 'goes', is_correct: false }, { text: 'went', is_correct: false }] },
      { question: 'Look! The bus ___.', type: 'quiz', is_quiz: true,
        options: [{ text: 'is coming', is_correct: true }, { text: 'comes', is_correct: false }, { text: 'come', is_correct: false }] },
      { question: 'How confident are you with English tenses?', type: 'rating', is_quiz: false, options: [] },
    ],
  },
  {
    id: 'eng-vocabulary',
    title: 'Vocabulary — Daily Life',
    subject: 'Англиски',
    grade: 'Основно',
    icon: '🗣️',
    color: 'from-pink-500 to-rose-500',
    description: 'Common words and synonyms.',
    polls: [
      { question: 'What does "happy" mean?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Sad', is_correct: false }, { text: 'Joyful', is_correct: true }, { text: 'Tired', is_correct: false }] },
      { question: 'In one word: how is your day?', type: 'wordcloud', is_quiz: false, options: [] },
    ],
  },

  // ─── Природни науки ──────────────────────────────────────────
  {
    id: 'sci-solar-system',
    title: 'Сончев систем',
    subject: 'Природни науки',
    grade: 'Основно',
    icon: '🪐',
    color: 'from-violet-500 to-purple-500',
    description: 'Планети, ѕвезди и распоред.',
    polls: [
      { question: 'Колку планети има во Сончевиот систем?', type: 'quiz', is_quiz: true,
        options: [{ text: '7', is_correct: false }, { text: '8', is_correct: true }, { text: '9', is_correct: false }] },
      { question: 'Која е најголема планета?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Земја', is_correct: false }, { text: 'Јупитер', is_correct: true }, { text: 'Сатурн', is_correct: false }, { text: 'Марс', is_correct: false }] },
    ],
  },
  {
    id: 'sci-photosynthesis',
    title: 'Фотосинтеза',
    subject: 'Биологија',
    grade: 'Основно (8 одд.)',
    icon: '🌱',
    color: 'from-green-500 to-emerald-500',
    description: 'Процес на фотосинтеза кај растенијата.',
    polls: [
      { question: 'Што е потребно за фотосинтеза?', type: 'poll', is_quiz: false,
        options: [{ text: 'Сонце, вода, CO₂' }, { text: 'Само вода' }, { text: 'Само сонце' }] },
      { question: 'Кои организми вршат фотосинтеза?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Растенија', is_correct: true }, { text: 'Луѓе', is_correct: false }, { text: 'Габи', is_correct: false }] },
    ],
  },
  {
    id: 'sci-states-of-matter',
    title: 'Состојби на материјата',
    subject: 'Физика',
    grade: 'Основно',
    icon: '💧',
    color: 'from-cyan-500 to-blue-500',
    description: 'Цврста, течна, гасовита и плазма.',
    polls: [
      { question: 'Колку основни состојби на материјата постојат?', type: 'quiz', is_quiz: true,
        options: [{ text: '3', is_correct: false }, { text: '4', is_correct: true }, { text: '5', is_correct: false }] },
      { question: 'Со еден збор: пример за гас', type: 'wordcloud', is_quiz: false, options: [] },
    ],
  },

  // ─── Историја и Географија ───────────────────────────────────
  {
    id: 'hist-mk-independence',
    title: 'Независност на Македонија',
    subject: 'Историја',
    grade: 'Средно',
    icon: '🇲🇰',
    color: 'from-red-600 to-yellow-500',
    description: 'Клучни датуми и личности.',
    polls: [
      { question: 'Која година Македонија се прогласи независна?', type: 'quiz', is_quiz: true,
        options: [{ text: '1991', is_correct: true }, { text: '1989', is_correct: false }, { text: '1995', is_correct: false }, { text: '2001', is_correct: false }] },
      { question: 'Кога се одржа референдумот за независност?', type: 'quiz', is_quiz: true,
        options: [{ text: '8 септември 1991', is_correct: true }, { text: '2 август 1944', is_correct: false }, { text: '17 ноември 1991', is_correct: false }] },
    ],
  },
  {
    id: 'geo-world-capitals',
    title: 'Главни градови во светот',
    subject: 'Географија',
    grade: 'Основно',
    icon: '🗺️',
    color: 'from-amber-500 to-orange-500',
    description: 'Препознавање на главни градови.',
    polls: [
      { question: 'Главен град на Франција?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Париз', is_correct: true }, { text: 'Лион', is_correct: false }, { text: 'Марсеј', is_correct: false }] },
      { question: 'Главен град на Јапонија?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Токио', is_correct: true }, { text: 'Осака', is_correct: false }, { text: 'Кјото', is_correct: false }] },
      { question: 'Главен град на Австралија?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Канбера', is_correct: true }, { text: 'Сиднеј', is_correct: false }, { text: 'Мелбурн', is_correct: false }] },
    ],
  },

  // ─── Македонски јазик ────────────────────────────────────────
  {
    id: 'mk-grammar-padeji',
    title: 'Македонска граматика — падежи',
    subject: 'Македонски',
    grade: 'Основно',
    icon: '📖',
    color: 'from-rose-500 to-pink-500',
    description: 'Падежи во македонскиот јазик.',
    polls: [
      { question: 'Колку падежи има во современиот македонски јазик?', type: 'quiz', is_quiz: true,
        options: [{ text: '0 (исчезнале)', is_correct: true }, { text: '7', is_correct: false }, { text: '3', is_correct: false }] },
      { question: 'Со еден збор: омилен македонски писател', type: 'wordcloud', is_quiz: false, options: [] },
    ],
  },
  {
    id: 'mk-literature',
    title: 'Македонски писатели',
    subject: 'Македонски',
    grade: 'Средно',
    icon: '✍️',
    color: 'from-fuchsia-500 to-purple-500',
    description: 'Препознавање на класични дела.',
    polls: [
      { question: 'Кој ја напиша „Бели мугри"?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Кочо Рацин', is_correct: true }, { text: 'Блаже Конески', is_correct: false }, { text: 'Григор Прличев', is_correct: false }] },
      { question: 'Кој е автор на „Сердарот"?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Григор Прличев', is_correct: true }, { text: 'Кочо Рацин', is_correct: false }, { text: 'Славко Јаневски', is_correct: false }] },
    ],
  },

  // ─── Корпоративни / Обуки ────────────────────────────────────
  {
    id: 'biz-icebreaker',
    title: 'Icebreaker — нов тим',
    subject: 'Бизнис',
    grade: 'Обука',
    icon: '🤝',
    color: 'from-sky-500 to-blue-500',
    description: 'Запознавање на тим преку забавни прашања.',
    polls: [
      { question: 'Со еден збор: како се чувствуваш денес?', type: 'wordcloud', is_quiz: false, options: [] },
      { question: 'Каде би сакал/а да си на одмор?', type: 'poll', is_quiz: false,
        options: [{ text: 'Плажа' }, { text: 'Планина' }, { text: 'Град' }, { text: 'Дома' }] },
      { question: 'Колку години работно искуство имаш?', type: 'rating', is_quiz: false, options: [] },
    ],
  },
  {
    id: 'biz-workshop-feedback',
    title: 'Feedback по обука',
    subject: 'Бизнис',
    grade: 'Обука',
    icon: '📝',
    color: 'from-teal-500 to-cyan-500',
    description: 'Краток feedback по работилница.',
    polls: [
      { question: 'Колку корисна беше обуката?', type: 'rating', is_quiz: false, options: [] },
      { question: 'Што најмногу ти се допадна?', type: 'open', is_quiz: false, options: [] },
      { question: 'Што би подобрил/а?', type: 'open', is_quiz: false, options: [] },
    ],
  },

  // ─── Универзитет ─────────────────────────────────────────────
  {
    id: 'uni-exit-ticket',
    title: 'Exit Ticket — крај на час',
    subject: 'Универзитет',
    grade: 'Високо',
    icon: '🎓',
    color: 'from-indigo-600 to-violet-600',
    description: 'Брза проверка на знаење на крај на предавање.',
    polls: [
      { question: 'Колку ти беше јасна темата?', type: 'rating', is_quiz: false, options: [] },
      { question: 'Една работа што ја научи денес:', type: 'open', is_quiz: false, options: [] },
      { question: 'Едно прашање што го имаш:', type: 'open', is_quiz: false, options: [] },
    ],
  },
  {
    id: 'uni-debate',
    title: 'Дебата — за и против',
    subject: 'Универзитет',
    grade: 'Високо',
    icon: '⚖️',
    color: 'from-yellow-500 to-amber-500',
    description: 'Поларизирачко прашање за дискусија.',
    polls: [
      { question: 'AI ќе ги замени наставниците за 20 години?', type: 'poll', is_quiz: false,
        options: [{ text: 'Сосема се согласувам' }, { text: 'Делумно се согласувам' }, { text: 'Не се согласувам' }, { text: 'Воопшто не се согласувам' }] },
      { question: 'Со еден збор: твојот аргумент', type: 'wordcloud', is_quiz: false, options: [] },
    ],
  },

  // ─── Општи ───────────────────────────────────────────────────
  {
    id: 'general-quick-quiz',
    title: 'Брз општ квиз',
    subject: 'Општо',
    grade: 'Сите',
    icon: '🧠',
    color: 'from-slate-500 to-zinc-500',
    description: 'Шарен квиз за загревање на мозокот.',
    polls: [
      { question: 'Колку континенти има?', type: 'quiz', is_quiz: true,
        options: [{ text: '5', is_correct: false }, { text: '7', is_correct: true }, { text: '6', is_correct: false }] },
      { question: 'Кој ја насликал Мона Лиза?', type: 'quiz', is_quiz: true,
        options: [{ text: 'Леонардо да Винчи', is_correct: true }, { text: 'Микеланџело', is_correct: false }, { text: 'Пикасо', is_correct: false }] },
      { question: 'Колку ти беше забавно?', type: 'rating', is_quiz: false, options: [] },
    ],
  },
];

export const TEMPLATE_SUBJECTS = [
  'Сите',
  'Математика',
  'Информатика',
  'Англиски',
  'Македонски',
  'Природни науки',
  'Биологија',
  'Физика',
  'Историја',
  'Географија',
  'Бизнис',
  'Универзитет',
  'Општо',
];
