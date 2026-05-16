import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { blogPosts, getBlogPost } from '../data/blogPosts';

function Section({ section }) {
  switch (section.type) {
    case 'lead':
      return (
        <p className="text-xl text-slate-600 leading-relaxed font-medium border-l-4 border-indigo-500 pl-5 mb-8">
          {section.text}
        </p>
      );
    case 'h2':
      return (
        <h2 className="text-2xl font-black text-slate-900 mt-10 mb-4">{section.text}</h2>
      );
    case 'p':
      return <p className="text-slate-600 leading-relaxed mb-4">{section.text}</p>;
    case 'ul':
      return (
        <ul className="space-y-2 mb-6">
          {section.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-slate-600">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      );
    case 'blockquote':
      return (
        <blockquote className="my-6 p-5 rounded-2xl italic text-slate-700 text-lg leading-relaxed"
          style={{ background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)', borderLeft: '4px solid #6366f1' }}>
          {section.text}
        </blockquote>
      );
    case 'comparison':
      return (
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {section.rows[0].map((cell, i) => (
                  <th key={i} className="text-left p-3 font-bold text-slate-700 border-b-2 border-slate-200 bg-slate-50">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.rows.slice(1).map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={`p-3 border-b border-slate-100 ${ci === 0 ? 'font-medium text-slate-700' : ci === 1 ? 'text-indigo-700 font-medium' : 'text-slate-500'}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

export default function BlogPost() {
  const { slug } = useParams();
  const post = getBlogPost(slug);

  useSEO(post ? {
    title: `${post.title} | MKD Slidea Блог`,
    description: post.description,
    keywords: post.keywords,
    path: `/blog/${post.slug}`,
    image: `https://slidea.mismath.net/api/og?type=template&title=${encodeURIComponent(post.title)}&subject=${encodeURIComponent(post.subject)}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': post.title,
      'description': post.description,
      'url': `https://slidea.mismath.net/blog/${post.slug}`,
      'datePublished': post.date,
      'dateModified': post.date,
      'inLanguage': 'mk',
      'author': {
        '@type': 'Organization',
        'name': 'MKD Slidea',
        'url': 'https://slidea.mismath.net/',
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'MKD Slidea',
        'url': 'https://slidea.mismath.net/',
        'logo': { '@type': 'ImageObject', 'url': 'https://slidea.mismath.net/api/og' },
      },
      'image': `https://slidea.mismath.net/api/og?type=template&title=${encodeURIComponent(post?.title || '')}&subject=${encodeURIComponent(post?.subject || '')}`,
      'mainEntityOfPage': { '@type': 'WebPage', '@id': `https://slidea.mismath.net/blog/${post.slug}` },
      'about': { '@type': 'Thing', 'name': post.subject },
    },
  } : { title: 'Блог | MKD Slidea', noindex: true });

  if (!post) return <Navigate to="/blog" replace />;

  const otherPosts = blogPosts.filter(p => p.slug !== slug).slice(0, 2);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-28 pb-20">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-8">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Почетна</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/blog" className="hover:text-indigo-600 transition-colors">Блог</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-600 font-medium truncate max-w-[200px]">{post.subject}</span>
      </nav>

      <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
            {post.subject}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5" /> {post.readMin} мин читање
          </span>
          <span className="text-xs text-slate-400">{post.date}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-6">
          {post.title}
        </h1>

        {/* Divider */}
        <div className="h-1 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 mb-8" />

        {/* Content */}
        <div className="prose-custom">
          {post.sections.map((section, i) => (
            <Section key={i} section={section} />
          ))}
        </div>

        {/* Author */}
        <div className="mt-10 flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
            S
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">{post.author}</p>
            <p className="text-xs text-slate-400">Интерактивна образовна платформа за МК наставници</p>
          </div>
        </div>
      </motion.article>

      {/* CTA */}
      <div className="mt-10 rounded-3xl p-7 text-center"
        style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)', border: '1px solid #e0e7ff' }}>
        <p className="font-black text-slate-900 text-xl mb-1">Пробајте бесплатно</p>
        <p className="text-slate-500 text-sm mb-4">Создадете ваш прв квиз за 5 минути.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors text-sm"
        >
          Почнете сега <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Other posts */}
      {otherPosts.length > 0 && (
        <div className="mt-12">
          <h3 className="font-black text-slate-900 text-lg mb-4">Уште од блогот</h3>
          <div className="space-y-3">
            {otherPosts.map(p => (
              <Link
                key={p.slug}
                to={`/blog/${p.slug}`}
                className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">
                    {p.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {p.readMin} мин
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
          <Link to="/blog" className="flex items-center gap-1 text-indigo-600 font-bold text-sm mt-4 hover:gap-2 transition-all">
            <ArrowLeft className="w-4 h-4" /> Назад кон блогот
          </Link>
        </div>
      )}
    </div>
  );
}
