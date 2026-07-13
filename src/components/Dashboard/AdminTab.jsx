import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, RefreshCw, Shield, Save, UserPlus, X, Trash2, AlertTriangle, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const roleOptions = ['user', 'admin'];
const planOptions = ['free', 'basic', 'monthly', 'quarterly', 'semester', 'yearly', 'pro', 'admin'];

const AdminTab = ({ currentUser }) => {
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [newUserAlerts, setNewUserAlerts] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [errorLog, setErrorLog] = useState([]);
  const [errorLogLoading, setErrorLogLoading] = useState(true);
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportLoading, setSupportLoading] = useState(true);
  const initialLoadDone = useRef(false);

  const loadErrorLog = async () => {
    setErrorLogLoading(true);
    const { data } = await supabase
      .from('error_log')
      .select('id, created_at, source, message, url')
      .order('created_at', { ascending: false })
      .limit(20);
    setErrorLog(data || []);
    setErrorLogLoading(false);
  };

  const loadSupportMessages = async () => {
    setSupportLoading(true);
    const { data } = await supabase
      .from('support_messages')
      .select('id, created_at, email, message, page_url')
      .order('created_at', { ascending: false })
      .limit(20);
    setSupportMessages(data || []);
    setSupportLoading(false);
  };

  const loadProfiles = async () => {
    setLoading(true);
    setError('');
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, name, role, plan, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (fetchError) {
      setError(fetchError.message || 'Не можев да ги вчитам корисниците.');
      setProfiles([]);
      setLoading(false);
      return;
    }

    setProfiles(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadProfiles().then(() => { initialLoadDone.current = true; });
    loadErrorLog();
    loadSupportMessages();

    const channel = supabase
      .channel('admin-new-users')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, (payload) => {
        if (!initialLoadDone.current) return;
        const p = payload.new;
        setProfiles((prev) => [p, ...prev]);
        setNewUserAlerts((prev) => [...prev, { id: p.id, name: p.name || 'Без име', email: p.email || '' }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return profiles;
    return profiles.filter((profile) =>
      [profile.email, profile.name, profile.role, profile.plan]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [profiles, search]);

  const patchProfile = (id, field, value) => {
    setProfiles((current) => current.map((profile) => (
      profile.id === id ? { ...profile, [field]: value } : profile
    )));
  };

  const saveProfile = async (profile) => {
    setSavingId(profile.id);
    setError('');
    setNotice('');

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: profile.role, plan: profile.plan })
      .eq('id', profile.id);

    if (updateError) {
      setError(updateError.message || 'Не можев да го зачувам профилот.');
      setSavingId(null);
      return;
    }

    setNotice(profile.id === currentUser?.id
      ? 'Твојот профил е ажуриран. Освежи ја страницата ако сакаш веднаш да ја видиш новата улога.'
      : 'Промените се зачувани.');
    setSavingId(null);
  };

  // GDPR "right to be forgotten" — deletes the user's auth account + events
  // (which cascade to polls/options/votes) via a SECURITY DEFINER RPC, since
  // deleting auth.users needs elevated privileges plain RLS can't grant.
  const deleteAccount = async (profile) => {
    if (profile.id === currentUser?.id) return;
    const confirmed = window.confirm(
      `Трајно бришење на "${profile.name || profile.email}" и сите нивни настани/анкети. Ова не може да се врати. Продолжи?`
    );
    if (!confirmed) return;

    setDeletingId(profile.id);
    setError('');
    setNotice('');

    const { error: rpcError } = await supabase.rpc('delete_user_account', { p_user_id: profile.id });

    if (rpcError) {
      setError(rpcError.message || 'Не можев да ја избришам сметката.');
      setDeletingId(null);
      return;
    }

    setProfiles((current) => current.filter((p) => p.id !== profile.id));
    setNotice('Сметката е трајно избришана.');
    setDeletingId(null);
  };

  return (
    <div className="p-12 max-w-7xl mx-auto">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest mb-4">
            <Shield size={14} /> Admin only
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Админ панел</h2>
          <p className="text-slate-400 font-bold">Уреди улоги и планови без директен SQL во Supabase.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пребарај по име, е-маил, улога..."
              className="w-full bg-white border border-slate-100 rounded-2xl pl-11 pr-4 py-4 font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>
          <button
            onClick={loadProfiles}
            disabled={loading}
            className="px-5 py-4 bg-white border border-slate-100 rounded-2xl font-black text-slate-700 hover:border-slate-200 hover:bg-slate-50 transition-all shadow-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Освежи
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-5 py-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 font-bold text-sm">
          {error}
        </div>
      )}

      {notice && (
        <div className="mb-6 px-5 py-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-sm">
          {notice}
        </div>
      )}

      {newUserAlerts.map((alert) => (
        <div key={alert.id} className="mb-3 flex items-center gap-3 px-5 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-100">
          <UserPlus size={18} className="shrink-0" />
          <span className="flex-1">Нов корисник се регистрира: <strong>{alert.name}</strong> — {alert.email}</span>
          <button onClick={() => setNewUserAlerts((prev) => prev.filter((a) => a.id !== alert.id))} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
            <X size={16} />
          </button>
        </div>
      ))}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Вкупно профили', value: profiles.length },
          { label: 'Администратори', value: profiles.filter((profile) => profile.role === 'admin').length },
          { label: 'Платени планови', value: profiles.filter((profile) => !['free', 'basic', null, undefined].includes(profile.plan)).length },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(120px,140px)_minmax(140px,160px)_120px_44px] gap-4 px-6 py-4 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
          <span>Корисник</span>
          <span>Улога</span>
          <span>План</span>
          <span>Акција</span>
          <span></span>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 font-black">Нема профили што одговараат на пребарувањето.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredProfiles.map((profile) => (
              <div key={profile.id} className="grid grid-cols-[minmax(0,2fr)_minmax(120px,140px)_minmax(140px,160px)_120px_44px] gap-4 px-6 py-4 items-center">
                <div className="min-w-0">
                  <p className="font-black text-slate-900 truncate">{profile.name || 'Без име'}</p>
                  <p className="text-sm font-bold text-slate-400 truncate">{profile.email || 'Нема е-маил'}</p>
                  {profile.id === currentUser?.id && (
                    <span className="inline-flex mt-2 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">Твој профил</span>
                  )}
                </div>

                <select
                  value={profile.role || 'user'}
                  onChange={(e) => patchProfile(profile.id, 'role', e.target.value)}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-3 font-black text-slate-700 outline-none focus:border-indigo-500"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>

                <select
                  value={profile.plan || 'free'}
                  onChange={(e) => patchProfile(profile.id, 'plan', e.target.value)}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-3 font-black text-slate-700 outline-none focus:border-indigo-500"
                >
                  {planOptions.map((plan) => (
                    <option key={plan} value={plan}>{plan}</option>
                  ))}
                </select>

                <button
                  onClick={() => saveProfile(profile)}
                  disabled={savingId === profile.id}
                  className="px-4 py-3 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Save size={14} /> {savingId === profile.id ? '...' : 'Зачувај'}
                </button>

                {profile.id === currentUser?.id ? (
                  <span />
                ) : (
                  <button
                    onClick={() => deleteAccount(profile)}
                    disabled={deletingId === profile.id}
                    title="Трајно бришење на сметката"
                    aria-label={`Избриши ја сметката на ${profile.name || profile.email}`}
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all inline-flex items-center justify-center disabled:opacity-60"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> Скорешни грешки
          </h3>
          <button
            onClick={loadErrorLog}
            disabled={errorLogLoading}
            className="px-4 py-2 bg-white border border-slate-100 rounded-xl font-black text-slate-700 text-sm hover:border-slate-200 hover:bg-slate-50 transition-all shadow-sm inline-flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={14} className={errorLogLoading ? 'animate-spin' : ''} /> Освежи
          </button>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          {errorLogLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((row) => <div key={row} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}
            </div>
          ) : errorLog.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-bold">Нема забележани грешки во последните 30 дена. 🎉</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {errorLog.map((entry) => (
                <div key={entry.id} className="px-6 py-4 flex items-start gap-4">
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${entry.source === 'server' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                    {entry.source}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-700 break-words">{entry.message}</p>
                    {entry.url && <p className="text-xs text-slate-400 truncate mt-0.5">{entry.url}</p>}
                  </div>
                  <span className="shrink-0 text-xs font-bold text-slate-400 whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString('mk-MK')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <MessageCircle size={18} className="text-indigo-500" /> Прашања и фидбек
          </h3>
          <button
            onClick={loadSupportMessages}
            disabled={supportLoading}
            className="px-4 py-2 bg-white border border-slate-100 rounded-xl font-black text-slate-700 text-sm hover:border-slate-200 hover:bg-slate-50 transition-all shadow-sm inline-flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={14} className={supportLoading ? 'animate-spin' : ''} /> Освежи
          </button>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          {supportLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((row) => <div key={row} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}
            </div>
          ) : supportMessages.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-bold">Нема пораки засега.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {supportMessages.map((entry) => (
                <div key={entry.id} className="px-6 py-4 flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-700 break-words whitespace-pre-wrap">{entry.message}</p>
                    <p className="text-xs text-slate-400 mt-1 truncate">
                      {entry.email || 'Непознат корисник'}{entry.page_url ? ` · ${entry.page_url}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-slate-400 whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString('mk-MK')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTab;