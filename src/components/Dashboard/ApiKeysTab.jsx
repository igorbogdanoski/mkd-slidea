import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Copy, Check, Trash2, Plus, AlertTriangle, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const fmtDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('mk-MK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
};

const ApiKeysTab = ({ user }) => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, scopes, last_used_at, created_at, revoked_at')
      .order('created_at', { ascending: false });
    if (err) setError(err.message); else setKeys(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    const { data, error: err } = await supabase.rpc('create_api_key', { p_name: name.trim() });
    setCreating(false);
    if (err) { setError(err.message); return; }
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.plaintext) setJustCreated(row);
    setName('');
    load();
  };

  const handleRevoke = async (id) => {
    if (!confirm('Сигурно сакаш да го отповикаш овој клуч? Оваа операција е неповратна.')) return;
    const { error: err } = await supabase.rpc('revoke_api_key', { p_id: id });
    if (err) setError(err.message); else load();
  };

  const copyPlaintext = async () => {
    if (!justCreated?.plaintext) return;
    try {
      await navigator.clipboard.writeText(justCreated.plaintext);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-12 max-w-5xl mx-auto"
    >
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest mb-3">
          <KeyRound className="w-3.5 h-3.5" /> Open API
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">API клучеви</h2>
        <p className="text-slate-500 font-bold">
          Поврзи го твоето училишно ИТ-решение или гејтбук со MKD Slidea преку нашиот REST API.
        </p>
      </div>

      {/* Quick docs */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl mb-8 font-mono text-sm overflow-x-auto">
        <p className="text-xs font-black text-emerald-300 uppercase tracking-widest mb-3 flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5" /> Брз почеток
        </p>
        <pre className="whitespace-pre-wrap break-all leading-relaxed">{`# Сите свои настани
curl -H "Authorization: Bearer YOUR_KEY" \\
  https://slidea.mismath.net/api/v1/events

# Резултати за еден настан
curl -H "Authorization: Bearer YOUR_KEY" \\
  https://slidea.mismath.net/api/v1/results?code=ABC123`}</pre>
      </div>

      {/* New key form */}
      <form onSubmit={handleCreate} className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm mb-6">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Нов клуч</p>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="на пр. „Гимназија Никола Карев — LMS"
            maxLength={80}
            className="flex-1 px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 placeholder-slate-300 focus:border-indigo-500 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> {creating ? 'Се создава...' : 'Создај клуч'}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm font-bold text-red-500 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> {error}
          </p>
        )}
      </form>

      {/* Plaintext modal-banner */}
      {justCreated && (
        <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-3xl mb-6">
          <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Зачувај го клучот сега — нема да биде прикажан повторно!
          </p>
          <div className="flex flex-col md:flex-row gap-2">
            <code className="flex-1 px-4 py-3 bg-white border-2 border-amber-200 rounded-xl font-mono text-sm text-slate-800 break-all">
              {justCreated.plaintext}
            </code>
            <button
              onClick={copyPlaintext}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-sm transition-all ${
                copied ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white hover:bg-amber-700 active:scale-95'
              }`}
            >
              {copied ? <><Check className="w-4 h-4" /> Копирано!</> : <><Copy className="w-4 h-4" /> Копирај</>}
            </button>
          </div>
          <button
            onClick={() => setJustCreated(null)}
            className="mt-3 text-xs font-black text-amber-700 underline hover:no-underline"
          >
            Затвори (го зачував)
          </button>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <p className="font-black text-slate-900">Твои клучеви ({keys.length})</p>
        </div>
        {loading ? (
          <p className="p-8 text-center text-slate-400 font-bold">Се вчитуваат...</p>
        ) : keys.length === 0 ? (
          <p className="p-8 text-center text-slate-400 font-bold">Сè уште немаш создадено API клучеви.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {keys.map((k) => (
              <li key={k.id} className={`p-5 flex flex-col md:flex-row md:items-center gap-3 ${k.revoked_at ? 'opacity-60' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900">{k.name}</p>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{k.key_prefix}…</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(k.scopes || []).map((s) => (
                      <span key={s} className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 uppercase tracking-widest">
                        {s}
                      </span>
                    ))}
                    {k.revoked_at && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600 uppercase tracking-widest">
                        Отповикан
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-400 md:text-right">
                  <p>Создаден: {fmtDate(k.created_at)}</p>
                  <p>Последно: {fmtDate(k.last_used_at)}</p>
                </div>
                {!k.revoked_at && (
                  <button
                    onClick={() => handleRevoke(k.id)}
                    className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-black text-xs transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Отповикај
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
};

export default ApiKeysTab;
