import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, LayoutGrid, History, Sparkles, AlertTriangle, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Bar = ({ pct }) => (
  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
    <div className="h-full bg-gradient-to-r from-indigo-400 to-violet-500" style={{ width: `${Math.max(8, Math.min(100, pct))}%` }} />
  </div>
);

const Section = ({ icon: Icon, title, count, color = 'indigo', children }) => (
  <div className="bg-white border-2 border-slate-100 rounded-3xl p-6">
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-10 h-10 rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-black text-slate-900 text-lg">{title}</h3>
      <span className="ml-auto text-xs font-black text-slate-300 uppercase tracking-widest">
        {count} резултати
      </span>
    </div>
    {children}
  </div>
);

const Empty = () => (
  <p className="text-sm font-bold text-slate-300 italic py-4 text-center">
    Нема совпаѓања. Пробај пошироко прашање.
  </p>
);

const SemanticSearchTab = ({ user }) => {
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const runSearch = useCallback(async (e) => {
    e?.preventDefault?.();
    if (!query.trim() || query.trim().length < 2) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token || '';
      const res = await fetch('/api/semantic-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: query.trim(),
          subject: subject || null,
          grade: grade || null,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text.slice(0, 200) || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Неуспешно пребарување.');
    } finally {
      setLoading(false);
    }
  }, [query, subject, grade]);

  const examples = [
    'дроби 5 одделение',
    'питагорова теорема',
    'веројатност и статистика',
    'квадратна равенка',
    'периметар и плоштина',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-black text-slate-900 mb-2 flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-indigo-500" />
          Семантичко пребарување
        </h2>
        <p className="text-sm font-bold text-slate-400">
          Пребарај низ МК курикулум · шаблони од заедницата · твоите минати прашања — со разбирање на значење, не само клучни зборови.
        </p>
      </div>

      <form onSubmit={runSearch} className="bg-white border-2 border-slate-100 rounded-3xl p-6 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={'на пр. „дроби 5 одделение" или „агли во триаголник"'}
              maxLength={500}
              className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 placeholder-slate-300 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || query.trim().length < 2}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Пребарува...' : 'Пребарај'}
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm text-slate-700 focus:border-indigo-500 outline-none"
          >
            <option value="">Сите предмети</option>
            <option value="math">Математика</option>
            <option value="physics">Физика</option>
            <option value="chemistry">Хемија</option>
            <option value="biology">Биологија</option>
            <option value="mk_language">Македонски</option>
          </select>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm text-slate-700 focus:border-indigo-500 outline-none"
          >
            <option value="">Сите одделенија</option>
            {[1,2,3,4,5,6,7,8,9,10,11,12,13].map((g) => (
              <option key={g} value={`G${g}`}>G{g}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2 ml-auto">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setQuery(ex)}
                className="px-3 py-1.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm font-bold text-red-500 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> {error}
          </p>
        )}
      </form>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section
            icon={LayoutGrid}
            title="Шаблони од заедницата"
            color="indigo"
            count={result.templates?.length || 0}
          >
            {result.templates?.length ? (
              <ul className="space-y-3">
                {result.templates.map((t) => (
                  <li key={t.id} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-sm text-slate-900 truncate">{t.title}</div>
                      <div className="text-xs font-bold text-slate-400 truncate">
                        {[t.subject, t.grade].filter(Boolean).join(' · ')}
                        {t.uses_count ? ` · ${t.uses_count} употреби` : ''}
                      </div>
                      {t.description && (
                        <div className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</div>
                      )}
                    </div>
                    <Bar pct={(t.similarity || 0) * 100} />
                  </li>
                ))}
              </ul>
            ) : <Empty />}
          </Section>

          <Section
            icon={BookOpen}
            title="Курикулум (МК БРО/МОН)"
            color="violet"
            count={result.curriculum?.length || 0}
          >
            {result.curriculum?.length ? (
              <ul className="space-y-3">
                {result.curriculum.map((c) => (
                  <li key={c.id} className="p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">
                        {c.grade}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {[c.subject, c.topic, c.subtopic].filter(Boolean).join(' › ')}
                      </span>
                      <Bar pct={(c.similarity || 0) * 100} />
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-2">{c.text}</div>
                  </li>
                ))}
              </ul>
            ) : <Empty />}
          </Section>

          {user && (
            <Section
              icon={History}
              title="Мои претходни прашања"
              color="emerald"
              count={result.my_polls?.length || 0}
            >
              {result.my_polls?.length ? (
                <ul className="space-y-3">
                  {result.my_polls.map((p) => (
                    <li key={p.id} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                      <ChevronRight className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-slate-700 truncate">{p.question}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                          {p.type}{Array.isArray(p.curriculum_tags) && p.curriculum_tags.length ? ` · ${p.curriculum_tags.join(', ')}` : ''}
                        </div>
                      </div>
                      <Bar pct={(p.similarity || 0) * 100} />
                    </li>
                  ))}
                </ul>
              ) : <Empty />}
            </Section>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border-2 border-indigo-100 rounded-3xl p-8 text-center">
          <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600 max-w-lg mx-auto">
            Внеси прашање или тема — RAG системот ќе пронајде релевантни шаблони, курикулумски точки и твоите претходни прашања по семантичка сличност (Gemini Embeddings).
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default SemanticSearchTab;
