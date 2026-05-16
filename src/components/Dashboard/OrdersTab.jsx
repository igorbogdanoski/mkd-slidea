import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, RefreshCw, ShieldCheck, XCircle, Filter, Mail, Clock,
  CheckCircle2, AlertCircle, Copy, FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const STATUS_BADGES = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Чека' },
  confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Потврдена' },
  rejected: { bg: 'bg-rose-50', text: 'text-rose-700', label: 'Одбиена' },
  refunded: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Рефундирана' },
  expired: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Истечена' },
};

const METHOD_LABELS = {
  paypal: 'PayPal',
  bank_eur: 'IBAN/SWIFT',
  bank_mkd: 'МКД сметка',
};

const OrdersTab = ({ currentUser }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [actingId, setActingId] = useState(null);
  const [rejectFor, setRejectFor] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      let q = supabase
        .from('manual_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error: e } = await q;
      if (e) throw e;
      setOrders(data || []);
    } catch (e) {
      setError(e?.message || 'Не успеа вчитувањето на нарачките.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return orders;
    return orders.filter((o) =>
      [o.order_id, o.email, o.full_name, o.org_name, o.tax_id, o.note]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t))
    );
  }, [orders, search]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    revenueEUR: orders
      .filter((o) => o.status === 'confirmed' && o.currency === 'EUR')
      .reduce((s, o) => s + Number(o.amount || 0), 0),
  }), [orders]);

  const confirm = async (o) => {
    if (!window.confirm(`Потврди нарачка ${o.order_id} (${o.amount} ${o.currency}, ${o.plan})?`)) return;
    setActingId(o.id);
    setError(''); setNotice('');
    try {
      const { error: e } = await supabase.rpc('confirm_manual_order', { p_order_id: o.order_id });
      if (e) throw e;
      setNotice(`Нарачка ${o.order_id} потврдена. План ${o.plan} активиран за корисникот.`);
      await load();
    } catch (e) {
      setError(e?.message || 'Грешка при потврда.');
    } finally {
      setActingId(null);
    }
  };

  const reject = async () => {
    if (!rejectFor) return;
    setActingId(rejectFor.id);
    setError(''); setNotice('');
    try {
      const { error: e } = await supabase.rpc('reject_manual_order', {
        p_order_id: rejectFor.order_id,
        p_reason: rejectReason || 'Без причина',
      });
      if (e) throw e;
      setNotice(`Нарачка ${rejectFor.order_id} одбиена.`);
      setRejectFor(null);
      setRejectReason('');
      await load();
    } catch (e) {
      setError(e?.message || 'Грешка при одбивање.');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="p-12 max-w-7xl mx-auto">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 text-xs font-black uppercase tracking-widest mb-4">
            <FileText size={14} /> Manual Billing
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Нарачки за активација</h2>
          <p className="text-slate-400 font-bold">Потврди уплати од PayPal, IBAN или трансакциска сметка. Активацијата на план е автоматска по потврда.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Order ID, email, фирма..."
              className="w-full bg-white border border-slate-100 rounded-2xl pl-11 pr-4 py-4 font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-100 rounded-2xl px-4 py-4 font-black text-slate-700 outline-none focus:border-indigo-500 shadow-sm"
          >
            <option value="pending">Чекаат</option>
            <option value="confirmed">Потврдени</option>
            <option value="rejected">Одбиени</option>
            <option value="all">Сите</option>
          </select>
          <button
            onClick={load}
            disabled={loading}
            className="px-5 py-4 bg-white border border-slate-100 rounded-2xl font-black text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Освежи
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-5 py-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 font-bold text-sm inline-flex gap-2 items-start">
          <AlertCircle size={16} className="mt-0.5" /> {error}
        </div>
      )}
      {notice && (
        <div className="mb-6 px-5 py-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-sm inline-flex gap-2 items-start">
          <CheckCircle2 size={16} className="mt-0.5" /> {notice}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Вкупно" value={stats.total} />
        <Stat label="Чекаат" value={stats.pending} accent="text-amber-600" />
        <Stat label="Потврдени" value={stats.confirmed} accent="text-emerald-600" />
        <Stat label="Приход (EUR, потврдено)" value={`€${stats.revenueEUR.toFixed(2)}`} accent="text-indigo-600" />
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map((r) => <div key={r} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Clock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-black">Нема нарачки за прикажување.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((o) => {
              const badge = STATUS_BADGES[o.status] || STATUS_BADGES.pending;
              return (
                <div key={o.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono font-black text-indigo-600 text-sm">{o.order_id}</span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">
                          {o.plan}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-violet-50 text-violet-700">
                          {METHOD_LABELS[o.method] || o.method}
                        </span>
                        {o.needs_invoice && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700">
                            Фактура
                          </span>
                        )}
                      </div>
                      <p className="font-black text-slate-900">{o.full_name || '—'} <span className="text-slate-400 font-bold">· {o.email}</span></p>
                      {o.org_name && <p className="text-sm text-slate-500 font-bold">{o.org_name} {o.tax_id && <span className="font-mono">· {o.tax_id}</span>}</p>}
                      {o.note && <p className="text-sm text-slate-500 italic mt-1">„{o.note}"</p>}
                      <p className="text-xs text-slate-400 font-bold mt-2">
                        {new Date(o.created_at).toLocaleString('mk-MK')}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="text-2xl font-black text-slate-900">€{Number(o.amount).toFixed(2)}</span>
                      {o.status === 'pending' && (
                        <div className="flex gap-2">
                          <a
                            href={`mailto:${o.email}?subject=MKD%20Slidea%20-%20${o.order_id}`}
                            className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 font-black text-xs inline-flex items-center gap-1.5 hover:bg-slate-200"
                            title="Контактирај"
                          >
                            <Mail size={14} />
                          </a>
                          <button
                            onClick={() => setRejectFor(o)}
                            disabled={actingId === o.id}
                            className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 font-black text-xs inline-flex items-center gap-1.5 hover:bg-rose-100 disabled:opacity-60"
                          >
                            <XCircle size={14} /> Одбиј
                          </button>
                          <button
                            onClick={() => confirm(o)}
                            disabled={actingId === o.id}
                            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs inline-flex items-center gap-1.5 hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <ShieldCheck size={14} /> {actingId === o.id ? '...' : 'Потврди'}
                          </button>
                        </div>
                      )}
                      {o.status === 'confirmed' && o.confirmed_at && (
                        <p className="text-xs text-emerald-600 font-bold">
                          Потврдена: {new Date(o.confirmed_at).toLocaleDateString('mk-MK')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {rejectFor && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onClick={() => setRejectFor(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-900 mb-2">Одбиј нарачка</h3>
            <p className="text-slate-500 font-bold text-sm mb-4">{rejectFor.order_id} · {rejectFor.email}</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Причина (опционално)..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-none font-medium mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRejectFor(null)}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-black"
              >
                Откажи
              </button>
              <button
                onClick={reject}
                disabled={actingId === rejectFor.id}
                className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-black disabled:opacity-60"
              >
                {actingId === rejectFor.id ? '...' : 'Одбиј'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value, accent = 'text-slate-900' }) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
    <p className={`text-2xl font-black ${accent}`}>{value}</p>
  </div>
);

function confirm_window(msg) {
  if (typeof window !== 'undefined' && typeof window.confirm === 'function') return window.confirm(msg);
  return true;
}

export default OrdersTab;
