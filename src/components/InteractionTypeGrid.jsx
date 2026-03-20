import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart2, 
  Trophy, 
  Cloud, 
  AlignLeft, 
  Star, 
  ListOrdered,
  Lock
} from 'lucide-react';

const InteractionTypeGrid = ({ onSelect }) => {
  const userPlan = 'basic';

  const types = [
    {
      id: 'poll',
      title: 'Multiple Choice',
      titleMK: 'Анкета (Повеќе избор)',
      description: 'Добијте мислење од публиката во реално време.',
      icon: <BarChart2 className="w-8 h-8 text-indigo-600" />,
      color: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
    },
    {
      id: 'wordcloud',
      title: 'Word Cloud',
      titleMK: 'Облак со зборови',
      description: 'Најпопуларните зборови стануваат поголеми.',
      icon: <Cloud className="w-8 h-8 text-cyan-600" />,
      color: 'bg-cyan-50',
      borderColor: 'border-cyan-100',
    },
    {
      id: 'quiz',
      title: 'Quiz',
      titleMK: 'Квиз (Натпревар)',
      description: 'Тестирајте го знаењето и најдете победник.',
      icon: <Trophy className="w-8 h-8 text-amber-600" />,
      color: 'bg-amber-50',
      borderColor: 'border-amber-100',
    },
    {
      id: 'open',
      title: 'Open Text',
      titleMK: 'Отворен текст',
      description: 'Добијте подетални одговори од учесниците.',
      icon: <AlignLeft className="w-8 h-8 text-emerald-600" />,
      color: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    },
    {
      id: 'rating',
      title: 'Rating',
      titleMK: 'Оценување',
      description: 'Добијте повратна информација преку ѕвездички.',
      icon: <Star className="w-8 h-8 text-rose-600" />,
      color: 'bg-rose-50',
      borderColor: 'border-rose-100',
      locked: userPlan === 'basic'
    },
    {
      id: 'ranking',
      title: 'Ranking',
      titleMK: 'Рангирање',
      description: 'Побарајте од публиката да ги подреди опциите.',
      icon: <ListOrdered className="w-8 h-8 text-violet-600" />,
      color: 'bg-violet-50',
      borderColor: 'border-violet-100',
      locked: userPlan === 'basic'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {types.map((type) => (
        <motion.button
          key={type.id}
          whileHover={type.locked ? {} : { y: -5, scale: 1.02 }}
          whileTap={type.locked ? {} : { scale: 0.98 }}
          onClick={() => !type.locked && onSelect(type.id)}
          className={`flex flex-col text-left p-8 rounded-[2.5rem] border-2 transition-all relative group ${
            type.locked ? 'border-slate-100 bg-slate-50/50 cursor-not-allowed opacity-80' : `${type.borderColor} bg-white hover:shadow-xl hover:shadow-slate-100`
          }`}
        >
          {type.locked && (
            <div className="absolute top-8 right-8 bg-slate-200 text-slate-500 p-2 rounded-xl">
              <Lock size={16} />
            </div>
          )}
          <div className={`${type.color} p-4 rounded-2xl w-fit mb-6 ${!type.locked && 'group-hover:scale-110 transition-transform'}`}>
            {type.icon}
          </div>
          <h4 className="text-xl font-black text-slate-800 mb-2">{type.titleMK}</h4>
          <p className="text-slate-500 font-bold text-sm leading-relaxed">
            {type.description}
          </p>
          {type.locked && (
            <span className="mt-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full w-fit">PRO План</span>
          )}
        </motion.button>
      ))}
    </div>
  );
};

export default InteractionTypeGrid;
