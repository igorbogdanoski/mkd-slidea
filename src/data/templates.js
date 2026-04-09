export const templates = [
  // ─── 1. Macedonia Quiz ───────────────────────────────────────────────────────
  {
    id: 't1',
    title: 'Квиз за познавање на Македонија',
    category: 'Квиз',
    img: 'https://images.unsplash.com/photo-1461280360983-bd93eaa5051b?q=80&w=400&h=250&auto=format&fit=crop',
    polls: [
      {
        question: 'Кој е главниот град на Македонија?',
        type: 'poll', is_quiz: true,
        options: [
          { text: 'Битола', is_correct: false },
          { text: 'Скопје', is_correct: true },
          { text: 'Охрид', is_correct: false },
          { text: 'Прилеп', is_correct: false },
        ],
      },
      {
        question: 'Кое е најголемото езеро во Македонија?',
        type: 'poll', is_quiz: true,
        options: [
          { text: 'Дојранско', is_correct: false },
          { text: 'Преспанско', is_correct: false },
          { text: 'Охридско', is_correct: true },
        ],
      },
      {
        question: 'Која е највисоката планина во Македонија?',
        type: 'poll', is_quiz: true,
        options: [
          { text: 'Кораб', is_correct: true },
          { text: 'Пелистер', is_correct: false },
          { text: 'Шар Планина', is_correct: false },
          { text: 'Јакупица', is_correct: false },
        ],
      },
      {
        question: 'Во која година Македонија прогласи независност?',
        type: 'poll', is_quiz: true,
        options: [
          { text: '1989', is_correct: false },
          { text: '1991', is_correct: true },
          { text: '1993', is_correct: false },
          { text: '1995', is_correct: false },
        ],
      },
      {
        question: 'Кој е македонскиот паричен знак?',
        type: 'poll', is_quiz: true,
        options: [
          { text: 'Лев', is_correct: false },
          { text: 'Динар', is_correct: false },
          { text: 'Денар', is_correct: true },
          { text: 'Евро', is_correct: false },
        ],
      },
    ],
  },

  // ─── 2. Feedback for Class ────────────────────────────────────────────────────
  {
    id: 't2',
    title: 'Фидбек за часот / предавањето',
    category: 'Образование',
    img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=400&h=250&auto=format&fit=crop',
    polls: [
      { question: 'Како би го оцениле денешниот час?', type: 'rating', is_quiz: false },
      { question: 'Што беше најинтересно денес?', type: 'wordcloud', is_quiz: false },
      { question: 'Дали темпото на предавањето беше соодветно?', type: 'poll', is_quiz: false,
        options: [
          { text: 'Премногу брзо', is_correct: false },
          { text: 'Токму соодветно', is_correct: false },
          { text: 'Можеше побавно', is_correct: false },
        ],
      },
      { question: 'Рангирај ги темите по важност:', type: 'ranking', is_quiz: false,
        options: [
          { text: 'Практични вежби', is_correct: false },
          { text: 'Теоретски дел', is_correct: false },
          { text: 'Дискусија во група', is_correct: false },
          { text: 'Примери од реалниот свет', is_correct: false },
        ],
      },
      { question: 'Имате ли некои дополнителни прашања или коментари?', type: 'open', is_quiz: false },
    ],
  },

  // ─── 3. Team Building ─────────────────────────────────────────────────────────
  {
    id: 't3',
    title: 'Тим Билдинг — Запознавање',
    category: 'Icebreakers',
    img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=400&h=250&auto=format&fit=crop',
    polls: [
      { question: 'Кој е вашиот омилен пијалок наутро?', type: 'poll', is_quiz: false,
        options: [
          { text: '☕ Кафе', is_correct: false },
          { text: '🍵 Чај', is_correct: false },
          { text: '🥤 Сок', is_correct: false },
          { text: '💧 Вода', is_correct: false },
        ],
      },
      { question: 'Каде би сакале да патувате следно?', type: 'wordcloud', is_quiz: false },
      { question: 'Опишете го вашиот тимски стил со еден збор:', type: 'wordcloud', is_quiz: false },
      { question: 'Рангирај ги тимските вредности:', type: 'ranking', is_quiz: false,
        options: [
          { text: '🤝 Доверба', is_correct: false },
          { text: '💡 Креативност', is_correct: false },
          { text: '⚡ Брзина', is_correct: false },
          { text: '🎯 Прецизност', is_correct: false },
        ],
      },
      { question: 'Кажете ни нешто интересно за себе:', type: 'open', is_quiz: false },
    ],
  },

  // ─── 4. Business Meeting ─────────────────────────────────────────────────────
  {
    id: 't4',
    title: 'Бизнис Состанок — Ревизија',
    category: 'Бизнис',
    img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=400&h=250&auto=format&fit=crop',
    polls: [
      { question: 'Колку продуктивен беше денешниот состанок?', type: 'rating', is_quiz: false },
      { question: 'Рангирај ги темите по приоритет:', type: 'ranking', is_quiz: false,
        options: [
          { text: '📈 Раст и приходи', is_correct: false },
          { text: '👥 Тимски развој', is_correct: false },
          { text: '🚀 Нови проекти', is_correct: false },
          { text: '⚙️ Процеси и оптимизација', is_correct: false },
        ],
      },
      { question: 'Со кој збор би го опишале денешниот состанок?', type: 'wordcloud', is_quiz: false },
      { question: 'Дали агендата беше јасна и структурирана?', type: 'poll', is_quiz: false,
        options: [
          { text: '✅ Да, многу јасна', is_correct: false },
          { text: '⚠️ Делумно', is_correct: false },
          { text: '❌ Требаше подобрување', is_correct: false },
        ],
      },
      { question: 'Какви се вашите следни чекори/акции?', type: 'open', is_quiz: false },
    ],
  },

  // ─── 5. Event / Conference Feedback ──────────────────────────────────────────
  {
    id: 't5',
    title: 'Настан / Конференција — Фидбек',
    category: 'Настани',
    img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=400&h=250&auto=format&fit=crop',
    polls: [
      { question: 'Со колку ѕвезди би го оцениле настанот?', type: 'rating', is_quiz: false },
      { question: 'Кој предавач / сесија ви беше најинтересна?', type: 'wordcloud', is_quiz: false },
      { question: 'Рангирај ги аспектите на настанот:', type: 'ranking', is_quiz: false,
        options: [
          { text: '🎤 Предавачи', is_correct: false },
          { text: '🗓️ Организација', is_correct: false },
          { text: '📍 Локација', is_correct: false },
          { text: '🍽️ Угостување', is_correct: false },
          { text: '🤝 Нетворкинг', is_correct: false },
        ],
      },
      { question: 'Дали ќе го препорачате овој настан?', type: 'poll', is_quiz: false,
        options: [
          { text: '👍 Секако, да!', is_correct: false },
          { text: '🤔 Можеби', is_correct: false },
          { text: '👎 Не', is_correct: false },
        ],
      },
      { question: 'Со еден збор опишете го настанот:', type: 'wordcloud', is_quiz: false },
      { question: 'Какво подобрување би предложиле за следниот настан?', type: 'open', is_quiz: false },
    ],
  },

  // ─── 6. HR — Employee Satisfaction ───────────────────────────────────────────
  {
    id: 't6',
    title: 'HR Анкета — Задоволство на вработени',
    category: 'HR',
    img: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=400&h=250&auto=format&fit=crop',
    polls: [
      { question: 'Колку сте задоволни од вашата тековна позиција?', type: 'rating', is_quiz: false },
      { question: 'Опишете ја компанијата со еден збор:', type: 'wordcloud', is_quiz: false },
      { question: 'Рангирај ги работните бенефиции по важност:', type: 'ranking', is_quiz: false,
        options: [
          { text: '💰 Плата', is_correct: false },
          { text: '🏠 Флексибилна работа', is_correct: false },
          { text: '📚 Обука и развој', is_correct: false },
          { text: '🏥 Здравствено осигурување', is_correct: false },
          { text: '🎯 Јасни цели', is_correct: false },
        ],
      },
      { question: 'Дали чувствувате дека вашата работа е ценета?', type: 'poll', is_quiz: false,
        options: [
          { text: '✅ Да, секогаш', is_correct: false },
          { text: '⚠️ Понекогаш', is_correct: false },
          { text: '❌ Ретко', is_correct: false },
        ],
      },
      { question: 'Каква поддршка би ви помогнала да бидете поуспешни?', type: 'open', is_quiz: false },
    ],
  },

  // ─── 7. Brainstorming ─────────────────────────────────────────────────────────
  {
    id: 't7',
    title: 'Брејнсторминг — Нови Идеи',
    category: 'Креативност',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=250&auto=format&fit=crop',
    polls: [
      { question: 'Кој е главниот предизвик со кој се соочувате?', type: 'wordcloud', is_quiz: false },
      { question: 'Предложете идеја за подобрување:', type: 'open', is_quiz: false },
      { question: 'Рангирај ги пристапите за решение:', type: 'ranking', is_quiz: false,
        options: [
          { text: '🔄 Промена на процеси', is_correct: false },
          { text: '🤖 Автоматизација', is_correct: false },
          { text: '👥 Повеќе соработка', is_correct: false },
          { text: '📊 Подобри алатки', is_correct: false },
        ],
      },
      { question: 'Колку итно е решавањето на овој предизвик?', type: 'rating', is_quiz: false },
      { question: 'Со кој збор би ја опишале идеалната ситуација?', type: 'wordcloud', is_quiz: false },
    ],
  },

  // ─── 8. Technology & AI Quiz ──────────────────────────────────────────────────
  {
    id: 't8',
    title: 'Квиз — Технологија и Вештачка Интелигенција',
    category: 'Квиз',
    img: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?q=80&w=400&h=250&auto=format&fit=crop',
    polls: [
      {
        question: 'Кој го создаде ChatGPT?',
        type: 'poll', is_quiz: true,
        options: [
          { text: 'Google', is_correct: false },
          { text: 'OpenAI', is_correct: true },
          { text: 'Meta', is_correct: false },
          { text: 'Anthropic', is_correct: false },
        ],
      },
      {
        question: 'Што значи кратенката "AI"?',
        type: 'poll', is_quiz: true,
        options: [
          { text: 'Автоматизиран интернет', is_correct: false },
          { text: 'Вештачка интелигенција', is_correct: true },
          { text: 'Напредна интеграција', is_correct: false },
          { text: 'Автоматски внес', is_correct: false },
        ],
      },
      {
        question: 'Која компанија го создаде Claude AI?',
        type: 'poll', is_quiz: true,
        options: [
          { text: 'OpenAI', is_correct: false },
          { text: 'Google', is_correct: false },
          { text: 'Anthropic', is_correct: true },
          { text: 'Meta', is_correct: false },
        ],
      },
      {
        question: 'Во која година е основана компанијата Apple?',
        type: 'poll', is_quiz: true,
        options: [
          { text: '1972', is_correct: false },
          { text: '1976', is_correct: true },
          { text: '1980', is_correct: false },
          { text: '1984', is_correct: false },
        ],
      },
      {
        question: 'Кој програмски јазик е најкористен во ML/AI проекти?',
        type: 'poll', is_quiz: true,
        options: [
          { text: 'Java', is_correct: false },
          { text: 'JavaScript', is_correct: false },
          { text: 'Python', is_correct: true },
          { text: 'C++', is_correct: false },
        ],
      },
    ],
  },

  // ─── 9. Product Feedback ──────────────────────────────────────────────────────
  {
    id: 't9',
    title: 'Производ / Сервис — Оценка на корисници',
    category: 'Производ',
    img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=400&h=250&auto=format&fit=crop',
    polls: [
      { question: 'Со колку ѕвезди би го оцениле нашиот производ?', type: 'rating', is_quiz: false },
      { question: 'Кои функции ги користите најчесто?', type: 'wordcloud', is_quiz: false },
      { question: 'Рангирај ги функциите по важност:', type: 'ranking', is_quiz: false,
        options: [
          { text: '⚡ Брзина', is_correct: false },
          { text: '🎨 Дизајн', is_correct: false },
          { text: '🔒 Безбедност', is_correct: false },
          { text: '💬 Поддршка', is_correct: false },
          { text: '💰 Цена', is_correct: false },
        ],
      },
      { question: 'Дали би го препорачале нашиот производ?', type: 'poll', is_quiz: false,
        options: [
          { text: '🚀 Да, без двоумење!', is_correct: false },
          { text: '👍 Веројатно', is_correct: false },
          { text: '🤔 Не сум сигурен/на', is_correct: false },
          { text: '👎 Не', is_correct: false },
        ],
      },
      { question: 'Каква нова функција би сакале да видите?', type: 'open', is_quiz: false },
    ],
  },

  // ─── 10. Onboarding / Welcome ─────────────────────────────────────────────────
  {
    id: 't10',
    title: 'Добредојдовте — Онбординг на нови членови',
    category: 'Онбординг',
    img: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?q=80&w=400&h=250&auto=format&fit=crop',
    polls: [
      { question: 'Од каде доаѓате / Кој е вашиот град?', type: 'wordcloud', is_quiz: false },
      { question: 'Кое е вашето поле на работа?', type: 'poll', is_quiz: false,
        options: [
          { text: '💻 Технологија', is_correct: false },
          { text: '📊 Маркетинг', is_correct: false },
          { text: '🎨 Дизајн', is_correct: false },
          { text: '🏫 Образование', is_correct: false },
          { text: '💰 Финансии', is_correct: false },
          { text: '🔬 Наука', is_correct: false },
        ],
      },
      { question: 'Рангирај ги вашите очекувања:', type: 'ranking', is_quiz: false,
        options: [
          { text: '🧠 Ново знаење', is_correct: false },
          { text: '🤝 Нови контакти', is_correct: false },
          { text: '🚀 Кариерен раст', is_correct: false },
          { text: '💡 Инспирација', is_correct: false },
        ],
      },
      { question: 'Колку сте возбудени за ова искуство?', type: 'rating', is_quiz: false },
      { question: 'Кажете ни нешто интересно за себе:', type: 'open', is_quiz: false },
    ],
  },
];
