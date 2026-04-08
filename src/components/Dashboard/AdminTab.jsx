import React, { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, Shield, Save } from 'lucide-react';
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
    loadProfiles();
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
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(120px,140px)_minmax(140px,160px)_120px] gap-4 px-6 py-4 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
          <span>Корисник</span>
          <span>Улога</span>
          <span>План</span>
          <span>Акција</span>
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
              <div key={profile.id} className="grid grid-cols-[minmax(0,2fr)_minmax(120px,140px)_minmax(140px,160px)_120px] gap-4 px-6 py-4 items-center">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTab;