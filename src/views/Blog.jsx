import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, BookOpen } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { blogPosts } from '../data/blogPosts';

const SUBJECT_COLORS = {
  'Педагогија':        'bg-indigo-100 text-indigo-700',
  'Споредба на алатки': 'bg-violet-100 text-violet-700',
  'Водич':             'bg-emerald-100 text-emerald-700',
};

export default function Blog() {
  useSEO({
    title: 'Блог за интерактивна настава | MKD Slidea',
    description: 'Совети, водичи и истражувања за интерактивна настава на македонски јазик. Откријте како да ги ангажирате учениците со квизови, анкети и AI алатки.',
    keywords: 'интерактивна настава македонија, квизови за наставници, едукација блог македонски, активно учење',
    path: '/blog',
    image: 'https://slidea.mismath.net/api/og',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      'name': 'MKD Slidea Блог',
      'description': 'Совети и водичи за интерактивна настава на македонски јазик.',
      'url': 'https://slidea.mismath.net/blog',
      'inLanguage': 'mk',
      'publisher': {
        '@type': 'Organization',
        'name': 'MKD Slidea',
        'url': 'https://slidea.mismath.net/',
      },
      'blogPost': blogPosts.map(p => ({
        '@type': 'BlogPosting',
        'headline': p.title,
        'description': p.description,
        'url': `https://slidea.mismath.net/blog/${p.slug}`,
        'datePublished': p.date,
        'author': { '@type': 'Organization', 'name': p.author },
      })),
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 pt-28 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
          <BookOpen className="w-4 h-4" />
          Блог
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">
          Интерактивна настава<br />
          <span className="text-indigo-600">за македонски наставници</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          Практични водичи, истражувања и совети за поангажирани ученици.
        </p>
      </motion.div>

      {/* Posts grid */}
      <div className="space-y-6">
        {blogPosts.map((post, i) => (
          <motion.article
            key={post.slug}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <Link to={`/blog/${post.slug}`} className="flex flex-col md:flex-row">
              {/* Color bar accent */}
              <div className="w-full md:w-2 bg-gradient-to-b from-indigo-500 to-violet-600 h-2 md:h-auto md:rounded-l-3xl flex-shrink-0" />

              <div className="p-6 md:p-8 flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${SUBJECT_COLORS[post.subject] || 'bg-slate-100 text-slate-600'}`}>
                    {post.subject}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readMin} мин читање
                  </span>
                  <span className="text-xs text-slate-300">{post.date}</span>
                </div>

                <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-2 leading-snug group-hover:text-indigo-600">
                  {post.title}
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">
                  {post.description}
                </p>

                <span className="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-sm hover:gap-2.5 transition-all">
                  Читај повеќе <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-14 rounded-3xl p-8 text-center"
        style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)', border: '1px solid #e0e7ff' }}
      >
        <h3 className="text-2xl font-black text-slate-900 mb-2">Подготвени да пробате?</h3>
        <p className="text-slate-500 mb-5">Создадете бесплатен настан за 2 минути. Без кредитна картичка.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
        >
          Почнете бесплатно <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  );
}
