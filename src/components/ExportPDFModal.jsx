import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Printer, FileDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TYPE_LABELS = {
  poll: 'Анкета',
  quiz: 'Квиз',
  wordcloud: 'Облак со зборови',
  open: 'Отворен текст',
  rating: 'Оценување',
  ranking: 'Рангирање',
};

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const ExportPDFModal = ({ isOpen, onClose, event, polls }) => {
  const rootRef = useRef(null);
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    // Mount print root into document body (outside React tree for @media print)
    const el = document.createElement('div');
    el.id = 'pdf-export-root';
    el.style.display = 'none';
    document.body.appendChild(el);
    rootRef.current = el;
    return () => {
      if (rootRef.current) document.body.removeChild(rootRef.current);
    };
  }, [isOpen]);

  const handlePrint = async () => {
    if (!rootRef.current) return;
    if (printing) return;

    setPrinting(true);
    setPrintError('');

    const pollIds = (polls || []).map(p => p.id).filter(Boolean);
    let surveyRows = [];
    let voteRows = [];

    try {
      if (pollIds.length > 0) {
        const [{ data: surveys }, { data: votes }] = await Promise.all([
          supabase.from('survey_responses').select('poll_id, session_id, answers').in('poll_id', pollIds),
          supabase.from('votes').select('poll_id, session_id').in('poll_id', pollIds),
        ]);
        surveyRows = surveys || [];
        voteRows = votes || [];
      }
    } catch {
      setPrintError('Не успеавме да ги вчитаме сите податоци за PDF. Печатиме достапни резултати.');
    }

    const surveyByPoll = surveyRows.reduce((acc, row) => {
      if (!acc[row.poll_id]) acc[row.poll_id] = [];
      acc[row.poll_id].push(row.answers);
      return acc;
    }, {});

    const voteCountByPoll = voteRows.reduce((acc, row) => {
      acc[row.poll_id] = (acc[row.poll_id] || 0) + 1;
      return acc;
    }, {});

    const uniqueParticipants = new Set(voteRows.map(v => v.session_id));

    const today = new Date().toLocaleDateString('mk-MK', { day: '2-digit', month: 'long', year: 'numeric' });
    const totalVotesAll = polls.reduce((sum, poll) => {
      if (poll.type === 'survey') return sum + (surveyByPoll[poll.id]?.length || 0);
      const visibleOptions = (poll.options || []).filter(o => o.is_approved !== false);
      return sum + visibleOptions.reduce((s, o) => s + (o.votes || 0), 0);
    }, 0);

    const topPoll = polls
      .map((poll) => {
        const pollVotes = poll.type === 'survey'
          ? (surveyByPoll[poll.id]?.length || 0)
          : (poll.options || []).filter(o => o.is_approved !== false).reduce((s, o) => s + (o.votes || 0), 0);
        return { poll, pollVotes };
      })
      .sort((a, b) => b.pollVotes - a.pollVotes)[0];

    rootRef.current.innerHTML = `
      <div style="font-family: system-ui, sans-serif; color: #0f172a; max-width: 900px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid #e2e8f0;">
          <div>
            <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #6366f1; margin-bottom: 6px;">MKD Slidea · Извештај за резултати</div>
            <h1 style="font-size: 26px; font-weight: 900; margin: 0; color: #0f172a;">${escapeHtml(event?.title || 'Настан')}</h1>
            <p style="font-size: 12px; color: #94a3b8; font-weight: 700; margin: 6px 0 0;">Код: ${escapeHtml(event?.code)} · ${today}</p>
          </div>
          <div style="font-size: 11px; font-weight: 900; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.1em;">${polls.length} активности</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:1.25rem;">
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;">
            <div style="font-size:10px;font-weight:900;color:#94a3b8;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px">Вкупно одговори</div>
            <div style="font-size:24px;font-weight:900;color:#0f172a;">${totalVotesAll}</div>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;">
            <div style="font-size:10px;font-weight:900;color:#94a3b8;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px">Уникатни учесници</div>
            <div style="font-size:24px;font-weight:900;color:#0f172a;">${uniqueParticipants.size}</div>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;">
            <div style="font-size:10px;font-weight:900;color:#94a3b8;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px">Најактивна точка</div>
            <div style="font-size:13px;font-weight:900;color:#334155;line-height:1.3;">${escapeHtml(topPoll?.poll?.question || '—')}</div>
          </div>
        </div>
        ${polls.map((poll, i) => {
          const visibleOptions = (poll.options || []).filter(o => o.is_approved !== false);
          const totalVotes = poll.type === 'survey'
            ? (surveyByPoll[poll.id]?.length || 0)
            : visibleOptions.reduce((s, o) => s + (o.votes || 0), 0);
          const maxVotes = Math.max(...visibleOptions.map(o => o.votes || 0), 1);
          const typeLabel = poll.is_quiz ? 'Квиз' : (TYPE_LABELS[poll.type] || 'Анкета');
          const colors = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4'];
          const participantCount = voteCountByPoll[poll.id] || (poll.type === 'survey' ? (surveyByPoll[poll.id]?.length || 0) : 0);

          const barsHtml = (poll.type === 'poll' || poll.type === 'quiz' || poll.type === 'rating' || poll.type === 'ranking' || !poll.type) && visibleOptions.length > 0
            ? visibleOptions
                .sort((a, b) => (b.votes || 0) - (a.votes || 0))
                .map((opt, j) => {
                  const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                  const barW = maxVotes > 0 ? Math.round((opt.votes / maxVotes) * 100) : 0;
                  const c = colors[j % colors.length];
                  const isCorrect = poll.is_quiz && opt.is_correct;
                  return `<div style="margin-bottom:10px">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                      <span style="font-size:13px;font-weight:700;color:${isCorrect ? '#10b981' : '#1e293b'}">${isCorrect ? '✓ ' : ''}${escapeHtml(opt.text)}</span>
                      <span style="font-size:13px;font-weight:900;color:${c}">${pct}% (${opt.votes || 0})</span>
                    </div>
                    <div style="height:10px;background:#f1f5f9;border-radius:999px;overflow:hidden">
                      <div style="height:100%;width:${barW}%;background:${c};border-radius:999px"></div>
                    </div>
                  </div>`;
                }).join('')
            : '';

          const tagsHtml = (poll.type === 'wordcloud' || poll.type === 'open') && visibleOptions.length > 0
            ? `<div style="display:flex;flex-wrap:wrap;gap:8px">${
                visibleOptions
                  .sort((a, b) => (b.votes || 0) - (a.votes || 0))
                  .slice(0, 30)
                  .map(opt => `<span style="padding:4px 14px;background:#f1f5f9;border-radius:999px;font-size:12px;font-weight:700;color:#334155">${escapeHtml(opt.text)}${opt.votes > 1 ? ' ×' + opt.votes : ''}</span>`)
                  .join('')
              }</div>`
            : '';

          const surveyHtml = poll.type === 'survey'
            ? (() => {
                const responses = surveyByPoll[poll.id] || [];
                const defs = Array.isArray(poll.survey_questions) ? poll.survey_questions : [];
                if (responses.length === 0) {
                  return '<p style="font-size:12px;color:#cbd5e1;font-weight:700">Нема доставени формулари</p>';
                }
                return defs.map((q, qIndex) => {
                  const values = responses
                    .map((entry) => (Array.isArray(entry) ? entry.find(a => a.qId === q.id)?.value : undefined))
                    .filter(v => v !== undefined && v !== null && v !== '');
                  if (values.length === 0) return '';

                  const isScaleLike = q.type === 'scale' || values.every(v => !Number.isNaN(Number(v)));
                  const statsHtml = isScaleLike
                    ? (() => {
                        const nums = values.map(Number).filter(n => !Number.isNaN(n));
                        const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : '—';
                        const min = nums.length ? Math.min(...nums) : '—';
                        const max = nums.length ? Math.max(...nums) : '—';
                        return `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">
                          <span style="padding:4px 10px;background:#eef2ff;color:#4338ca;border-radius:999px;font-size:11px;font-weight:800">Просек: ${avg}</span>
                          <span style="padding:4px 10px;background:#f8fafc;color:#334155;border-radius:999px;font-size:11px;font-weight:800">Мин: ${min}</span>
                          <span style="padding:4px 10px;background:#f8fafc;color:#334155;border-radius:999px;font-size:11px;font-weight:800">Макс: ${max}</span>
                        </div>`;
                      })()
                    : (() => {
                        const counts = values.reduce((acc, val) => {
                          const key = String(val);
                          acc[key] = (acc[key] || 0) + 1;
                          return acc;
                        }, {});
                        const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
                        return `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
                          ${top.map(([txt, cnt]) => `<span style="padding:4px 10px;background:#f1f5f9;border-radius:999px;font-size:11px;font-weight:800;color:#334155">${escapeHtml(txt)} (${cnt})</span>`).join('')}
                        </div>`;
                      })();

                  return `<div style="padding:10px 12px;border:1px solid #e2e8f0;border-radius:12px;margin-top:10px">
                    <div style="font-size:12px;font-weight:900;color:#0f172a">${qIndex + 1}. ${escapeHtml(q.text || 'Прашање')}</div>
                    ${statsHtml}
                  </div>`;
                }).join('');
              })()
            : '';

          return `<div style="page-break-inside:avoid;margin-bottom:2rem;padding:1.5rem;border:1.5px solid #e2e8f0;border-radius:1rem;background:#fff">
            <div style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:.75rem">
              <span style="font-size:10px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;background:#eef2ff;color:#6366f1;padding:4px 12px;border-radius:999px;flex-shrink:0;margin-top:2px">${i+1} · ${typeLabel}</span>
              <h3 style="font-size:17px;font-weight:900;color:#0f172a;line-height:1.3;margin:0">${escapeHtml(poll.question)}</h3>
            </div>
            <p style="font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:.75rem;text-transform:uppercase;letter-spacing:.08em">${totalVotes} ${totalVotes === 1 ? 'одговор' : 'одговори'} · ${participantCount} учесници</p>
            ${barsHtml}${tagsHtml}
            ${surveyHtml}
            ${visibleOptions.length === 0 ? '<p style="font-size:12px;color:#cbd5e1;font-weight:700">Нема одговори</p>' : ''}
          </div>`;
        }).join('')}
        <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #e2e8f0;text-align:center;font-size:10px;font-weight:900;color:#cbd5e1;letter-spacing:.15em;text-transform:uppercase">
          Генерирано од MKD Slidea · slidea.mk
        </div>
      </div>
    `;

    rootRef.current.style.display = 'block';
    window.print();
    rootRef.current.style.display = 'none';
    setPrinting(false);
  };

  if (!isOpen) return null;

  const totalVotesAll = polls.reduce((sum, p) =>
    sum + (p.options || []).filter(o => o.is_approved !== false).reduce((s, o) => s + (o.votes || 0), 0), 0
  );

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl z-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-[2rem]" />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 p-3 rounded-2xl">
              <FileDown className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Извоз на резултати</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">PDF Извештај</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="bg-slate-50 rounded-2xl p-5 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-500">Настан</span>
            <span className="font-black text-slate-900">{event?.title || 'Настан'} · #{event?.code}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-500">Активности</span>
            <span className="font-black text-slate-900">{polls.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-500">Вкупно одговори</span>
            <span className="font-black text-indigo-600">{totalVotesAll}</span>
          </div>
        </div>

        {printError && (
          <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 font-bold text-sm">
            {printError}
          </div>
        )}

        {/* Preview list */}
        <div className="mb-6 space-y-2 max-h-48 overflow-y-auto pr-1">
          {polls.map((poll, i) => {
            const votes = (poll.options || []).filter(o => o.is_approved !== false).reduce((s, o) => s + (o.votes || 0), 0);
            return (
              <div key={poll.id} className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-bold text-slate-700 truncate">{poll.question}</span>
                </div>
                <span className="text-xs font-black text-slate-400 flex-shrink-0 ml-2">{votes} одг.</span>
              </div>
            );
          })}
        </div>

        <button
          onClick={handlePrint}
          disabled={printing}
          className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Printer className="w-5 h-5" /> {printing ? 'Се подготвува извештај...' : 'Печати / Зачувај PDF'}
        </button>
        <p className="text-center text-[10px] font-bold text-slate-300 mt-3 uppercase tracking-widest">
          Во дијалогот за печатење изберете "Зачувај како PDF"
        </p>
      </motion.div>
    </div>
  );
};

export default ExportPDFModal;
