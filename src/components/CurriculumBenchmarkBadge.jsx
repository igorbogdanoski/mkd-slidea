import React, { useEffect, useState } from 'react';
import { TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCurriculumById } from '../data/mkMathCurriculum';

// Sprint 6.2 — Anonymous benchmark badge.
// Pulls aggregated quiz accuracy for the first curriculum tag of the active
// poll, computes "this class is in the Nth percentile" message, and renders
// a small inline badge. Fully anonymous via SECURITY DEFINER RPC; no event_id
// is sent. Hidden when the sample is too small (<3 events).
const cache = new Map();

const fetchBenchmark = async (tag) => {
  if (cache.has(tag)) return cache.get(tag);
  const { data, error } = await supabase.rpc('curriculum_tag_benchmark', { p_tag: tag });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  cache.set(tag, row);
  return row;
};

const CurriculumBenchmarkBadge = ({ poll }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const tag = Array.isArray(poll?.curriculum_tags) && poll.curriculum_tags.length
    ? poll.curriculum_tags[0]
    : null;

  useEffect(() => {
    let cancelled = false;
    if (!tag || !poll?.is_quiz) { setData(null); return; }
    setLoading(true);
    fetchBenchmark(tag).then((row) => {
      if (cancelled) return;
      setData(row);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [tag, poll?.is_quiz]);

  if (!tag || !poll?.is_quiz) return null;

  const meta = getCurriculumById(tag);
  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full text-xs font-black">
        <Loader2 className="w-3 h-3 animate-spin" /> Бенчмарк…
      </div>
    );
  }
  if (!data || data.events_count < 3 || data.avg_accuracy === null) return null;

  // Compute current poll accuracy
  const opts = Array.isArray(poll.options) ? poll.options : [];
  const total = opts.reduce((a, o) => a + (o.votes || 0), 0);
  const correct = opts.filter((o) => o.is_correct).reduce((a, o) => a + (o.votes || 0), 0);
  const myAcc = total > 0 ? (correct / total) * 100 : null;
  const benchAcc = Number(data.avg_accuracy);

  let message = `Просек: ${benchAcc.toFixed(0)}% (${data.events_count} настани)`;
  if (myAcc !== null) {
    const delta = myAcc - benchAcc;
    if (Math.abs(delta) < 5) message = `Класот е блиску до просекот (${benchAcc.toFixed(0)}%)`;
    else if (delta >= 5) message = `Класот е над просекот (+${delta.toFixed(0)}%)`;
    else message = `Класот е под просекот (${delta.toFixed(0)}%)`;
  }

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 text-indigo-700 rounded-full text-xs font-black"
      title={meta ? `${meta.topic} · ${meta.subtopic}` : ''}
    >
      <TrendingUp className="w-3.5 h-3.5" />
      <span>{message}</span>
    </div>
  );
};

export default CurriculumBenchmarkBadge;
