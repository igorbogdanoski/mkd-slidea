export const templates = [
  {
    id: 't1',
    title: 'Квиз за познавање на Македонија',
    category: 'Quiz Questions',
    img: 'https://images.unsplash.com/photo-1461280360983-bd93eaa5051b?q=80&w=400&h=250&auto=format&fit=crop',
    polls: [
      {
        question: 'Кој е главниот град на Македонија?',
        type: 'poll',
        is_quiz: true,
        options: [
          { text: 'Битола', is_correct: false },
          { text: 'Скопје', is_correct: true },
          { text: 'Охрид', is_correct: false },
          { text: 'Прилеп', is_correct: false }
        ]
      },
      {
        question: 'Кое е најголемото езеро во Македонија?',
        type: 'poll',
        is_quiz: true,
        options: [
          { text: 'Дојранско', is_correct: false },
          { text: 'Преспанско', is_correct: false },
          { text: 'Охридско', is_correct: true }
        ]
      }
    ]
  },
  {
    id: 't2',
    title: 'Фидбек за часот/предавањето',
    category: 'Education',
    img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=400&h=250&auto=format&fit=crop',
    polls: [
      {
        question: 'Како би го оцениле денешниот час?',
        type: 'rating',
        is_quiz: false
      },
      {
        question: 'Што беше најинтересно денес?',
        type: 'wordcloud',
        is_quiz: false
      },
      {
        question: 'Имате ли некои дополнителни прашања?',
        type: 'open',
        is_quiz: false
      }
    ]
  },
  {
    id: 't3',
    title: 'Тим Билдинг - Запознавање',
    category: 'Icebreakers',
    img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=400&h=250&auto=format&fit=crop',
    polls: [
      {
        question: 'Кој е вашиот омилен пијалок наутро?',
        type: 'poll',
        is_quiz: false,
        options: ['Кафе', 'Чај', 'Сок', 'Вода']
      },
      {
        question: 'Каде би сакале да патувате следно?',
        type: 'wordcloud',
        is_quiz: false
      }
    ]
  }
];
