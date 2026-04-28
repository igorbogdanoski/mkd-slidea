import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, BarChart3, Cloud, MessageSquare,
  CheckCircle, Sparkles, Users, Zap, Activity, Play, Eye,
} from 'lucide-react';

// Pre-built demo polls — no backend needed.
const DEMO_POLLS = [
  {
    id: 'demo-1',
    type: 'poll',
    is_quiz: false,
    question: 'Кој е најомилен предмет на учениците?',
    options: [
      { text: 'Математика', votes: 0 },
      { text: 'Физичко', votes: 0 },
      { text: 'Информатика', votes: 0 },
      { text: 'Англиски', votes: 0 },
    ],
  },
  {
    id: 'demo-2',
    type: 'quiz',
    is_quiz: true,
    question: 'Колку планети има во Сончевиот систем?',
    options: [
      { text: '7', votes: 0, is_correct: false },
      { text: '8', votes: 0, is_correct: true },
      { text: '9', votes: 0, is_correct: false },
      { text: '10', votes: 0, is_correct: false },
    ],
  },
  {
    id: 'demo-3',
    type: 'wordcloud',
    is_quiz: false,
    question: 'Со еден збор: како се чувствуваш во ова училиште?',
    words: [],
  },
  {
    id: 'demo-4',
    type: 'rating',
    is_quiz: false,
    question: 'Колку ти беше јасна оваа лекција? (1-5)',
    options: [
      { text: '1', votes: 0 },
      { text: '2', votes: 0 },
      { text: '3', votes: 0 },
      { text: '4', votes: 0 },
      { text: '5', votes: 0 },
    ],
  },
];

const DEMO_NAMES = ['Ана', 'Петар', 'Марија', 'Стефан', 'Елена', 'Никола', 'Ива', 'Лука', 'Сара', 'Давид'];
const DEMO_WORDS = ['среќно', 'безбедно', 'инспиративно', 'живо', 'забавно', 'мотивирачки', 'позитивно', 'креативно'];

export default function Demo() {
  const navigate = useNavigate();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [polls, setPolls] = useState(DEMO_POLLS);
  const [participants, setParticipants] = useState(0);
  const [showFinishCTA, setShowFinishCTA] = useState(false);
  const tickRef = useRef(null);

  const current = polls[currentIdx];

  // Simulate live participants joining + voting.
  useEffect(() => {
    let participantCount = 0;
    const joiner = setInterval(() => {
      participantCount = Math.min(participantCount + Math.floor(Math.random() * 3) + 1, 23);
      setParticipants(participantCount);
    }, 800);

    return () => clearInterval(joiner);
  }, []);

  // Vote stream for current poll.
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);

    tickRef.current = setInterval(() => {
      setPolls((prev) => {
        const next = [...prev];
        const p = { ...next[currentIdx] };
        if (p.type === 'wordcloud') {
          const word = DEMO_WORDS[Math.floor(Math.random() * DEMO_WORDS.length)];
          p.words = [...(p.words || []), word].slice(-50);
        } else if (p.options) {
          p.options = p.options.map((o, i) => {
            const r = Math.random();
            if (r < 0.35) return { ...o, votes: o.votes + 1 };
            return o;
          });
        }
        next[currentIdx] = p;
        return next;
      });
    }, 600);

    return () => clearInterval(tickRef.current);
  }, [currentIdx]);

  const totalVotes = current.options
    ? current.options.reduce((s, o) => s + o.votes, 0)
    : (current.words?.length || 0);

  const next = () => {
    if (currentIdx < polls.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setShowFinishCTA(true);
    }
  };

  const prev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      {/* Demo banner */}
      <div className="bg-amber-500/20 border-b border-amber-500/40 px-6 py-3 flex items-center justify-center gap-3 backdrop-blur">
        <Eye className="w-4 h-4 text-amber-300" />
        <p className="text-amber-200 font-bold text-sm">
          ДЕМО РЕЖИМ — ова е симулација. Учесниците и гласовите се автоматски генерирани.
        </p>
        <button
          onClick={() => navigate('/host')}
          className="ml-4 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-black text-xs transition-colors"
        >
          Креирај вистински настан →
        </button>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-indigo-300 font-bold text-sm mb-1">КОД: <span className="font-black tracking-widest">DEMO</span></p>
            <h1 className="text-3xl font-black">Демо настан — 4 активности</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-800/50 px-5 py-3 rounded-2xl border border-slate-700 flex items-center gap-3">
              <div className="relative">
                <Activity className="w-5 h-5 text-indigo-400" />
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-indigo-400 rounded-full blur-sm opacity-30"
                />
              </div>
              <span className="font-black text-lg">{participants} во живо</span>
            </div>
          </div>
        </div>

        {/* Activity */}
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-[2rem] p-10 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="px-4 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-black uppercase tracking-wider">
              {current.is_quiz ? 'Квиз' : current.type === 'wordcloud' ? 'Облак од зборови' : current.type === 'rating' ? 'Оцена' : 'Анкета'}
            </div>
            <span className="text-slate-400 text-sm">{currentIdx + 1} / {polls.length}</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-black mb-8">{current.question}</h2>

          {/* Render results */}
          {current.options && current.type !== 'wordcloud' && (
            <div className="space-y-3">
              {current.options.map((o, i) => {
                const pct = totalVotes ? (o.votes / totalVotes) * 100 : 0;
                const isCorrect = current.is_quiz && o.is_correct;
                return (
                  <div key={i} className="relative">
                    <motion.div
                      className={`absolute inset-0 rounded-2xl ${isCorrect ? 'bg-emerald-500/30' : 'bg-indigo-500/20'}`}
                      animate={{ width: `${Math.max(pct, 4)}%` }}
                      transition={{ type: 'spring', stiffness: 80 }}
                    />
                    <div className="relative flex items-center justify-between px-6 py-4 border border-slate-700/50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        {isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                        <span className="font-black text-lg">{o.text}</span>
                      </div>
                      <div className="font-black text-xl tabular-nums">
                        {o.votes} <span className="text-slate-400 text-sm">({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {current.type === 'wordcloud' && (
            <div className="flex flex-wrap gap-3 justify-center py-8 min-h-[200px] items-center">
              {current.words?.map((w, i) => {
                const count = current.words.filter((x) => x === w).length;
                const size = Math.min(12 + count * 6, 56);
                return (
                  <motion.span
                    key={`${w}-${i}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ fontSize: size }}
                    className="font-black text-indigo-300"
                  >
                    {w}
                  </motion.span>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={prev}
            disabled={currentIdx === 0}
            className="px-6 py-3 bg-slate-800/60 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl font-black flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Претходна
          </button>
          <div className="flex gap-2">
            {polls.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${i === currentIdx ? 'bg-indigo-400 w-8' : 'bg-slate-600'} transition-all`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 rounded-2xl font-black flex items-center gap-2 transition-colors"
          >
            {currentIdx === polls.length - 1 ? 'Заврши' : 'Следна'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Feature highlights */}
        <div className="grid md:grid-cols-3 gap-4 mt-12">
          {[
            { icon: <Sparkles className="w-5 h-5" />, text: 'AI генерација на квиз за 5 секунди' },
            { icon: <Users className="w-5 h-5" />, text: '200 учесници бесплатно' },
            { icon: <Zap className="w-5 h-5" />, text: 'Без апликација — само линк' },
          ].map((f, i) => (
            <div key={i} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-3">
              <div className="text-indigo-400">{f.icon}</div>
              <p className="font-bold text-sm">{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Finish CTA modal */}
      <AnimatePresence>
        {showFinishCTA && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-slate-900 rounded-[2rem] p-10 max-w-lg w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-black mb-3">Тоа беше само демо!</h2>
              <p className="text-slate-500 font-bold mb-8">
                Со MKD Slidea можеш да направиш ист настан за твоите ученици за помалку од 60 секунди — целосно бесплатно.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/host')}
                  className="px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" /> Креирај го првиот настан
                </button>
                <button
                  onClick={() => { setShowFinishCTA(false); setCurrentIdx(0); setPolls(DEMO_POLLS); }}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black transition-colors"
                >
                  Повтори демо
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold mt-2"
                >
                  Назад на почетна
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
