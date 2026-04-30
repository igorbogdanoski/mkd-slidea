import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Sparkles, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

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

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('mk-MK', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
};

const rankBadge = (rank) => {
  if (rank === 1) return { color: 'bg-amber-400 text-amber-900', icon: <Crown className="w-4 h-4" /> };
  if (rank === 2) return { color: 'bg-slate-300 text-slate-700', icon: <Medal className="w-4 h-4" /> };
  if (rank === 3) return { color: 'bg-amber-700 text-amber-50', icon: <Medal className="w-4 h-4" /> };
  return { color: 'bg-slate-100 text-slate-500', icon: null };
};

const PublicScoreboard = () => {
  const [top, setTop] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    upsertSEO(
      'Скорборд — Топ квиз шампиони во Македонија | MKD Slidea',
      'Најдобрите играчи на интерактивни квизови во МК. Топ 50 ученици и наставници по освоени поени.',
      'https://slidea.mismath.net/scoreboard'
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ data: t }, { data: r }] = await Promise.all([
          supabase.rpc('public_top_scorers', { p_limit: 50 }),
          supabase.rpc('public_recent_champions', { p_limit: 30 }),
        ]);
        if (!cancelled) {
          setTop(Array.isArray(t) ? t : []);
          setRecent(Array.isArray(r) ? r : []);
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-xs font-black uppercase tracking-widest mb-4">
          <Trophy className="w-3.5 h-3.5" />
          Топ играчи
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
          Скорборд — Квиз шампиони
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-bold">
          Најдобрите играчи на интерактивни квизови низ Македонија. Биди следниот шампион!
        </p>
      </motion.div>

      {loading && (
        <p className="text-center text-slate-400 font-bold py-12">Се вчитува скорбордот...</p>
      )}

      {!loading && top.length === 0 && (
        <div className="bg-white rounded-3xl border-2 border-slate-100 p-12 text-center">
          <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="font-black text-slate-700 text-lg mb-2">Сè уште нема јавни шампиони.</p>
          <p className="text-sm font-bold text-slate-400 mb-6">
            Создај квиз настан и означи го како „Јавен скорборд" во подесувањата.
          </p>
          <Link
            to="/host"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all"
          >
            <Sparkles className="w-4 h-4" /> Создај квиз <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {!loading && top.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 bg-white rounded-3xl border-2 border-slate-100 p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" /> Топ 50 играчи
            </h2>
            <ol className="space-y-2">
              {top.map((row) => {
                const b = rankBadge(Number(row.rank));
                return (
                  <li
                    key={`${row.rank}-${row.username}`}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                      Number(row.rank) <= 3
                        ? 'bg-gradient-to-r from-amber-50 to-white border-2 border-amber-100'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`flex-shrink-0 w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center gap-1 ${b.color}`}>
                      {b.icon || `#${row.rank}`}
                      {b.icon && <span>{row.rank}</span>}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 truncate">{row.username}</p>
                      <p className="text-xs font-bold text-slate-400">
                        {row.events_played} {row.events_played === 1 ? 'настан' : 'настани'}
                        {' · '}
                        Најдобар: {row.best_score} поени
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-indigo-600">{row.total_points}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">поени</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <aside className="bg-white rounded-3xl border-2 border-slate-100 p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" /> Скорашни шампиони
            </h2>
            {recent.length === 0 ? (
              <p className="text-sm text-slate-400 font-bold">Нема скорашни настани.</p>
            ) : (
              <ul className="space-y-3">
                {recent.map((r, i) => (
                  <li key={i} className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                      #{r.event_code} · {formatDate(r.played_at)}
                    </p>
                    <p className="font-black text-slate-900 text-sm line-clamp-1">
                      {r.event_title || 'Квиз настан'}
                    </p>
                    <p className="text-xs font-bold text-indigo-600 mt-1">
                      🏆 {r.champion} · {r.points} поени
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'MKD Slidea — Топ квиз шампиони',
            inLanguage: 'mk',
            url: 'https://slidea.mismath.net/scoreboard',
            numberOfItems: top.length,
            itemListElement: top.slice(0, 10).map((r, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: r.username,
            })),
          }),
        }}
      />
    </div>
  );
};

export default PublicScoreboard;
