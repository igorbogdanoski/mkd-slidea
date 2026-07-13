import { useState, useEffect } from 'react';
import { getAuthHeader } from '../lib/authHeader';

const PLAN_LABELS = {
  free: 'Бесплатен',
  basic: 'Бесплатен',
  monthly: 'Месечен',
  quarterly: 'Квартален',
  semester: 'Семестрален',
  yearly: 'Годишен',
  pro: 'Pro',
  admin: 'Admin',
};

function Bar({ used, total, color = '#6366f1' }) {
  if (total === null) return (
    <div className="flex items-center gap-2 text-sm text-green-400">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
      Неограничено
    </div>
  );
  const pct = Math.min(100, Math.round((used / total) * 100));
  const warning = pct >= 80;
  const danger  = pct >= 100;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: danger ? '#ef4444' : warning ? '#f59e0b' : '#9ca3af' }}>
        <span>{used} / {total} употребено</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full rounded-full h-2" style={{ background: '#ffffff15' }}>
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: danger ? '#ef4444' : warning ? '#f59e0b' : color,
          }}
        />
      </div>
    </div>
  );
}

export default function AiUsageWidget({ user, onUpgrade, isPro }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const headers = await getAuthHeader();
      if (cancelled) return;
      fetch('/api/my-quota', { headers })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
        .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (loading) return (
    <div className="rounded-xl p-4 mb-4 animate-pulse" style={{ background: '#ffffff08', border: '1px solid #ffffff12' }}>
      <div className="h-4 rounded w-1/3 mb-3" style={{ background: '#ffffff15' }} />
      <div className="h-2 rounded mb-2" style={{ background: '#ffffff10' }} />
      <div className="h-2 rounded w-2/3" style={{ background: '#ffffff10' }} />
    </div>
  );

  if (error || !data) return null;

  const planLabel = PLAN_LABELS[data.plan] || data.plan;
  const dayPct    = data.quota.aiPerDay   ? (data.used.day   / data.quota.aiPerDay)   * 100 : 0;
  const monthPct  = data.quota.aiPerMonth ? (data.used.month / data.quota.aiPerMonth) * 100 : 0;
  const nearLimit = dayPct >= 80 || monthPct >= 80;
  const atLimit   = dayPct >= 100 || monthPct >= 100;

  return (
    <div className="rounded-xl p-4 mb-4" style={{ background: '#ffffff08', border: `1px solid ${atLimit ? '#ef444430' : nearLimit ? '#f59e0b30' : '#ffffff12'}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: '#e5e7eb' }}>AI Употреба</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#6366f122', color: '#818cf8' }}>
            {planLabel}
          </span>
        </div>
        {atLimit && (
          <span className="text-xs font-medium" style={{ color: '#ef4444' }}>Лимит достигнат</span>
        )}
      </div>

      <div className="space-y-3">
        {data.quota.aiPerDay !== null && (
          <div>
            <p className="text-xs mb-1" style={{ color: '#6b7280' }}>Денес</p>
            <Bar used={data.used.day} total={data.quota.aiPerDay} />
          </div>
        )}
        <div>
          <p className="text-xs mb-1" style={{ color: '#6b7280' }}>Овој месец</p>
          <Bar used={data.used.month} total={data.quota.aiPerMonth} />
        </div>
      </div>

      {(nearLimit || atLimit) && !isPro && (
        <button
          onClick={onUpgrade}
          className="w-full mt-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
        >
          Надгради за повеќе AI генерирања →
        </button>
      )}

      {!nearLimit && !isPro && data.plan === 'free' && (
        <p className="text-xs mt-2 text-center" style={{ color: '#4b5563' }}>
          Надгради за до 2 000 AI генерирања/месец
        </p>
      )}
    </div>
  );
}
