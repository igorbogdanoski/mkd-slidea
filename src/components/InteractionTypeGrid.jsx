import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2,
  Trophy,
  Cloud,
  AlignLeft,
  Star,
  ListOrdered,
  SlidersHorizontal,
  ClipboardList,
} from 'lucide-react';

const InteractionTypeGrid = ({ onSelect }) => {
  const types = [
    {
      id: 'poll',
      titleMK: 'Анкета (Повеќе избор)',
      description: 'Добијте мислење од публиката во реално време.',
      icon: <BarChart2 className="w-8 h-8 text-indigo-600" />,
      color: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
    },
    {
      id: 'wordcloud',
      titleMK: 'Облак со зборови',
      description: 'Најпопуларните зборови стануваат поголеми.',
      icon: <Cloud className="w-8 h-8 text-cyan-600" />,
      color: 'bg-cyan-50',
      borderColor: 'border-cyan-100',
    },
    {
      id: 'quiz',
      titleMK: 'Квиз (Натпревар)',
      description: 'Тестирајте го знаењето и најдете победник.',
      icon: <Trophy className="w-8 h-8 text-amber-600" />,
      color: 'bg-amber-50',
      borderColor: 'border-amber-100',
    },
    {
      id: 'open',
      titleMK: 'Отворен текст',
      description: 'Добијте подетални одговори од учесниците.',
      icon: <AlignLeft className="w-8 h-8 text-emerald-600" />,
      color: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    },
    {
      id: 'rating',
      titleMK: 'Оценување',
      description: 'Добијте повратна информација преку ѕвездички.',
      icon: <Star className="w-8 h-8 text-rose-600" />,
      color: 'bg-rose-50',
      borderColor: 'border-rose-100',
    },
    {
      id: 'ranking',
      titleMK: 'Рангирање',
      description: 'Побарајте од публиката да ги подреди опциите.',
      icon: <ListOrdered className="w-8 h-8 text-violet-600" />,
      color: 'bg-violet-50',
      borderColor: 'border-violet-100',
    },
    {
      id: 'scale',
      titleMK: 'Скала 1–10',
      description: 'NPS или Likert скала — колку се согласувате?',
      icon: <SlidersHorizontal className="w-8 h-8 text-teal-600" />,
      color: 'bg-teal-50',
      borderColor: 'border-teal-100',
    },
    {
      id: 'survey',
      titleMK: 'Анкетен формулар',
      description: 'Повеќе прашања во еден формулар — учесниците одговараат сите одеднаш.',
      icon: <ClipboardList className="w-8 h-8 text-green-600" />,
      color: 'bg-green-50',
      borderColor: 'border-green-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {types.map((type) => (
        <motion.button
          key={type.id}
          whileHover={{ y: -5, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(type.id)}
          className={`flex flex-col text-left p-8 rounded-[2.5rem] border-2 transition-all relative group ${type.borderColor} bg-white hover:shadow-xl hover:shadow-slate-100`}
        >
          <div className={`${type.color} p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform`}>
            {type.icon}
          </div>
          <h4 className="text-xl font-black text-slate-800 mb-2">{type.titleMK}</h4>
          <p className="text-slate-500 font-bold text-sm leading-relaxed">
            {type.description}
          </p>
        </motion.button>
      ))}
    </div>
  );
};

export default InteractionTypeGrid;
