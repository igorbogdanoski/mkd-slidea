import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Plus, Crown, Shield, AlertTriangle, Mail, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ROLE_BADGES = {
  owner: { icon: Crown, label: 'Сопственик', color: 'bg-amber-50 text-amber-700' },
  admin: { icon: Shield, label: 'Админ', color: 'bg-indigo-50 text-indigo-700' },
  member: { icon: Users, label: 'Член', color: 'bg-slate-50 text-slate-600' },
  viewer: { icon: Users, label: 'Гледач', color: 'bg-slate-50 text-slate-400' },
};

const PLAN_LABEL = {
  free: 'Бесплатен',
  school: 'Училишен',
  enterprise: 'Корпоративен',
};

const OrganizationsTab = ({ user }) => {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: rpcErr } = await supabase.rpc('my_organizations');
      if (rpcErr) throw rpcErr;
      setOrgs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Не успеа вчитувањето.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const createOrg = async (e) => {
    e?.preventDefault?.();
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    setCreating(true);
    setError('');
    try {
      const slug = trimmed.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 40);
      const { error: insErr } = await supabase
        .from('organizations')
        .insert([{
          name: trimmed,
          slug: slug || null,
          domain: domain.trim() || null,
          created_by: user.id,
        }]);
      if (insErr) throw insErr;
      setName('');
      setDomain('');
      await load();
    } catch (err) {
      setError(err?.message || 'Креирањето не успеа.');
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12 text-slate-400 font-bold">
        Најави се за да управуваш со твоите организации.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-black text-slate-900 mb-2 flex items-center gap-3">
          <Building2 className="w-7 h-7 text-indigo-500" />
          Организации
        </h2>
        <p className="text-sm font-bold text-slate-400">
          Поврзете училиште, НВО или фирма со повеќе наставници/хостови, единствен билинг и брендирање.
        </p>
      </div>

      <form onSubmit={createOrg} className="bg-white border-2 border-slate-100 rounded-3xl p-6 space-y-3">
        <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-500" /> Креирај нова организација
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="на пр. „СОУ Гимназија Скопје"
            maxLength={120}
            className="px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 placeholder-slate-300 focus:border-indigo-500 outline-none"
          />
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="домен (опц.) — sou-gimnazija.edu.mk"
            maxLength={120}
            className="px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 placeholder-slate-300 focus:border-indigo-500 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={creating || name.trim().length < 2}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Креирај
        </button>
        {error && (
          <p className="text-sm font-bold text-red-500 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> {error}
          </p>
        )}
      </form>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-300 font-bold flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Вчитува...
          </div>
        ) : orgs.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-100 rounded-3xl p-12 text-center text-slate-400 font-bold">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            Сè уште немаш организација. Креирај една погоре.
          </div>
        ) : (
          orgs.map((o) => {
            const badge = ROLE_BADGES[o.role] || ROLE_BADGES.member;
            const Icon = badge.icon;
            return (
              <div key={o.id} className="bg-white border-2 border-slate-100 rounded-3xl p-6 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-slate-900 truncate">{o.name}</h4>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${badge.color} inline-flex items-center gap-1`}>
                      <Icon className="w-3 h-3" /> {badge.label}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-400">
                    {PLAN_LABEL[o.plan] || o.plan} · {o.member_count || 0}/{o.seats} места
                  </div>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest transition-all inline-flex items-center gap-2"
                  title="Покани член (наскоро)"
                  disabled
                >
                  <Mail className="w-3.5 h-3.5" /> Покани
                </button>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default OrganizationsTab;
