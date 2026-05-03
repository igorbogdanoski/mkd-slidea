import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, X, Plus, Sparkles } from 'lucide-react';
import { suggestTags } from '../lib/curriculumTagger';
import MK_MATH_CURRICULUM, { getCurriculumById, listGrades, listTracks } from '../data/mkMathCurriculum';

// Sprint 6.1 — Curriculum tag chips with auto-suggestions from question text.
// Pure-JS taxonomy (MK math G1–G13: primary + gymnasium + vocational). Zero network calls.
const CurriculumTagPicker = ({ questionText = '', value = [], onChange }) => {
  const [track, setTrack] = useState(null);
  const [grade, setGrade] = useState(null);
  const [browseOpen, setBrowseOpen] = useState(false);

  const suggestions = useMemo(
    () => suggestTags(questionText, { grade, track, limit: 3 }).map((t) => t.id),
    [questionText, grade, track]
  );

  const selected = Array.isArray(value) ? value : [];

  const add = (id) => {
    if (!id || selected.includes(id)) return;
    onChange?.([...selected, id].slice(0, 4));
  };
  const remove = (id) => onChange?.(selected.filter((x) => x !== id));

  const candidates = suggestions.filter((id) => !selected.includes(id));

  const browsePool = useMemo(
    () => MK_MATH_CURRICULUM.filter(
      (e) => (!track || e.track === track) && (!grade || e.grade === grade)
    ),
    [grade, track]
  );

  const tracks = listTracks();
  const gradesForTrack = useMemo(() => listGrades(track), [track]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" /> Курикулум (по избор)
        </label>
        <div className="flex items-center gap-1.5">
          <select
            value={track || ''}
            onChange={(e) => { setTrack(e.target.value || null); setGrade(null); }}
            className="text-[11px] font-black text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none"
            aria-label="Образовно ниво"
          >
            <option value="">Сите нивоа</option>
            {tracks.map((tr) => (
              <option key={tr.id} value={tr.id}>{tr.label}</option>
            ))}
          </select>
          <select
            value={grade || ''}
            onChange={(e) => setGrade(e.target.value ? Number(e.target.value) : null)}
            className="text-[11px] font-black text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none"
            aria-label="Одделение"
          >
            <option value="">Сите одделенија</option>
            {gradesForTrack.map((g) => (
              <option key={g} value={g}>{g}. одд</option>
            ))}
          </select>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => {
            const t = getCurriculumById(id);
            if (!t) return null;
            return (
              <span key={id} className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full px-2.5 py-1 text-[11px] font-black">
                G{t.grade} · {t.subtopic}
                <button type="button" onClick={() => remove(id)} aria-label={`Отстрани ${t.subtopic}`} className="hover:text-indigo-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {candidates.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black text-slate-400 inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Предлог:
          </span>
          {candidates.map((id) => {
            const t = getCurriculumById(id);
            if (!t) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => add(id)}
                className="inline-flex items-center gap-1 bg-white border-2 border-dashed border-indigo-300 text-indigo-600 rounded-full px-2.5 py-1 text-[11px] font-black hover:bg-indigo-50"
              >
                <Plus className="w-3 h-3" /> G{t.grade} · {t.subtopic}
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setBrowseOpen((v) => !v)}
        className="text-[11px] font-black text-slate-500 hover:text-indigo-600 underline-offset-2 hover:underline"
      >
        {browseOpen ? 'Скриј список' : 'Прелистај го курикулумот'}
      </button>

      {browseOpen && (
        <div className="max-h-44 overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50 space-y-1">
          {browsePool.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={selected.includes(t.id)}
              onClick={() => add(t.id)}
              className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between transition-all ${
                selected.includes(t.id) ? 'bg-indigo-100 text-indigo-700 cursor-not-allowed' : 'hover:bg-white text-slate-700'
              }`}
            >
              <span><b>G{t.grade}</b> · {t.topic}</span>
              <span className="text-slate-500">{t.subtopic}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurriculumTagPicker;
