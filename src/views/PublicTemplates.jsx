import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, BookOpen, ArrowRight, Sparkles, Users, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { STARTER_TEMPLATES, TEMPLATE_SUBJECTS } from '../lib/starterTemplates';
import { supabase } from '../lib/supabase';

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'tpl';

const normalizeStarter = (t) => ({
  slug: t.id,
  title: t.title,
  subject: t.subject,
  grade: t.grade,
  icon: t.icon,
  description: t.description,
  polls: t.polls || [],
  source: 'starter',
  views: 0,
});

const normalizeCommunity = (row) => ({
  slug: row.slug || slugify(row.title),
  title: row.title,
  subject: row.subject || row.category || 'Општо',
  grade: row.grade || '',
  icon: row.icon || '✨',
  description: row.description || '',
  polls: Array.isArray(row.polls) ? row.polls : [],
  source: 'community',
  views: row.views || 0,
  author_name: row.author_name,
});

const upsertSEO = (title, description, canonical) => {
  if (typeof document === 'undefined') return;
  document.title = title;
  const setMeta = (name, content) => {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };
  setMeta('description', description);
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', canonical);
};

const useAllTemplates = () => {
  const [community, setCommunity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('community_templates')
          .select('id, slug, title, subject, category, grade, icon, description, polls, views, author_name, created_at')
          .order('created_at', { ascending: false })
          .limit(200);
        if (!cancelled && !error && Array.isArray(data)) {
          setCommunity(data.map(normalizeCommunity));
        }
      } catch { /* ignore — starter templates still render */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const all = useMemo(() => {
    const starter = STARTER_TEMPLATES.map(normalizeStarter);
    const seen = new Set(community.map((c) => c.slug));
    return [...community, ...starter.filter((s) => !seen.has(s.slug))];
  }, [community]);

  return { all, community, loading };
};

const TemplateCard = ({ tpl }) => (
  <Link
    to={`/templates/${tpl.slug}`}
    className="group flex flex-col p-6 bg-white rounded-3xl border-2 border-slate-100 hover:border-indigo-300 hover:shadow-xl transition-all"
  >
    <div className="flex items-start justify-between mb-3">
      <span className="text-3xl">{tpl.icon || '📋'}</span>
      {tpl.source === 'community' && (
        <span className="text-[9px] font-black px-2 py-1 rounded-full bg-violet-100 text-violet-700 uppercase tracking-widest">
          Community
        </span>
      )}
    </div>
    <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2">
      {tpl.title}
    </h3>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
      {tpl.subject}{tpl.grade ? ` · ${tpl.grade}` : ''}
    </p>
    <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-4 flex-1">
      {tpl.description || 'Готова интерактивна активност.'}
    </p>
    <div className="flex items-center justify-between text-xs font-black text-slate-400">
      <span>{tpl.polls.length} активности</span>
      <span className="flex items-center gap-1 text-indigo-600 group-hover:gap-2 transition-all">
        Прегледај <ArrowRight className="w-3.5 h-3.5" />
      </span>
    </div>
  </Link>
);

const PublicTemplatesIndex = () => {
  const { all, loading } = useAllTemplates();
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('Сите');

  useEffect(() => {
    upsertSEO(
      'Бесплатни шаблони за квизови и анкети — MKD Slidea',
      'Преземи готови интерактивни лекции на македонски — математика, информатика, англиски, природни науки. Еден клик и почнуваш.',
      'https://slidea.mismath.net/templates'
    );
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((t) => {
      const matchesSubject = subject === 'Сите' || t.subject === subject;
      const matchesQuery =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.subject || '').toLowerCase().includes(q);
      return matchesSubject && matchesQuery;
    });
  }, [all, query, subject]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          {all.length} бесплатни шаблони
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
          Шаблон библиотека
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-bold">
          Готови интерактивни лекции на македонски јазик — еден клик и почнуваш во живо.
        </p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Пребарај шаблон..."
            aria-label="Пребарај шаблон"
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 placeholder-slate-300 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          aria-label="Филтер по предмет"
          className="px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-700 focus:border-indigo-500 outline-none transition-all"
        >
          {TEMPLATE_SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading && (
        <p className="text-center text-slate-400 font-bold py-8">Се вчитуваат шаблоните...</p>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="font-black text-slate-500">Нема пронајдени шаблони.</p>
          <p className="text-sm font-bold text-slate-400 mt-1">Обиди се со други клучни зборови или предмет.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((tpl) => <TemplateCard key={tpl.slug} tpl={tpl} />)}
      </div>
    </div>
  );
};

const PublicTemplateDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [tpl, setTpl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1) Try starter templates (instant, no network).
      const starter = STARTER_TEMPLATES.find((t) => t.id === slug);
      if (starter) {
        if (!cancelled) {
          const t = normalizeStarter(starter);
          setTpl(t);
          setLoading(false);
        }
        return;
      }
      // 2) Fallback to community.
      try {
        const { data, error } = await supabase
          .from('community_templates')
          .select('id, slug, title, subject, category, grade, icon, description, polls, views, author_name')
          .eq('slug', slug)
          .maybeSingle();
        if (!cancelled) {
          if (!error && data) {
            setTpl(normalizeCommunity(data));
            // Best-effort view counter.
            supabase.rpc('increment_template_views', { p_slug: slug }).then(() => {}).catch(() => {});
          } else {
            setNotFound(true);
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) { setNotFound(true); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!tpl) return;
    upsertSEO(
      `${tpl.title} — Шаблон | MKD Slidea`,
      tpl.description ? tpl.description.slice(0, 160) : `Бесплатен шаблон за ${tpl.subject || 'наставник'} на македонски јазик.`,
      `https://slidea.mismath.net/templates/${tpl.slug}`
    );
  }, [tpl]);

  const handleUse = () => {
    try {
      // Persist for both starter & community paths.
      localStorage.setItem('pending_starter_template_id', tpl.slug);
      localStorage.setItem('pending_community_template', JSON.stringify({
        slug: tpl.slug,
        title: tpl.title,
        polls: tpl.polls,
      }));
    } catch { /* ignore */ }
    navigate('/host');
  };

  if (loading) return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound || !tpl) return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-center">
      <p className="font-black text-slate-700 text-2xl mb-3">Шаблонот не е пронајден.</p>
      <Link to="/templates" className="text-indigo-600 font-black hover:underline">← Назад до сите шаблони</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link to="/templates" className="inline-flex items-center gap-2 text-sm font-black text-slate-400 hover:text-indigo-600 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Сите шаблони
      </Link>

      <div className="bg-white rounded-[2rem] border-2 border-slate-100 p-8 md:p-12 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <span className="text-5xl">{tpl.icon || '📋'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
              {tpl.subject}{tpl.grade ? ` · ${tpl.grade}` : ''}
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{tpl.title}</h1>
            {tpl.author_name && (
              <p className="text-sm font-bold text-slate-400 mt-2 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> {tpl.author_name}
              </p>
            )}
          </div>
        </div>

        {tpl.description && (
          <p className="text-base text-slate-600 leading-relaxed mb-8">{tpl.description}</p>
        )}

        <div className="mb-8">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
            {tpl.polls.length} активности
          </h2>
          <ol className="space-y-3">
            {tpl.polls.map((p, i) => (
              <li key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800">{p.question}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                    {p.is_quiz ? 'Квиз' : (p.type || 'анкета')}
                  </p>
                  {Array.isArray(p.options) && p.options.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {p.options.slice(0, 6).map((o, oi) => (
                        <li key={oi} className={`text-sm flex items-center gap-2 ${o.is_correct ? 'text-emerald-700 font-black' : 'text-slate-500 font-medium'}`}>
                          {o.is_correct && <CheckCircle2 className="w-3.5 h-3.5" />} {o.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <button
          onClick={handleUse}
          className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-base hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-200"
        >
          <Sparkles className="w-5 h-5" /> Користи во настан <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-xs font-bold text-slate-400 mt-3">Бесплатно · Без кредитна картичка</p>
      </div>

      {/* JSON-LD for richer SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LearningResource',
            name: tpl.title,
            description: tpl.description || tpl.title,
            inLanguage: 'mk',
            educationalLevel: tpl.grade || undefined,
            about: tpl.subject || undefined,
            url: `https://slidea.mismath.net/templates/${tpl.slug}`,
            provider: { '@type': 'Organization', name: 'MKD Slidea' },
          }),
        }}
      />
    </div>
  );
};

export { PublicTemplateDetail };
export default PublicTemplatesIndex;
