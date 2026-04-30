import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, Share2, Mail, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('mk-MK', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
};

const daysLeft = (iso) => {
  if (!iso) return 0;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.ceil((t - Date.now()) / 86400000));
};

const ReferralsTab = ({ user }) => {
  const [stats, setStats] = useState({ total: 0, rewarded: 0, pending: 0, pro_until: null });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const referralUrl = useMemo(() => {
    if (!user?.id) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://slidea.mismath.net';
    return `${origin}/?ref=${user.id}`;
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('my_referral_stats');
        if (!cancelled && !error && Array.isArray(data) && data[0]) {
          setStats({
            total: data[0].total || 0,
            rewarded: data[0].rewarded || 0,
            pending: data[0].pending || 0,
            pro_until: data[0].pro_until || null,
          });
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  };

  const shareText = encodeURIComponent('Пробај го MKD Slidea — бесплатни интерактивни квизови и анкети за наставници!');
  const shareUrlEnc = encodeURIComponent(referralUrl);

  const shareLinks = [
    { label: 'Facebook',   href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrlEnc}` },
    { label: 'X / Twitter', href: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrlEnc}` },
    { label: 'WhatsApp',   href: `https://wa.me/?text=${shareText}%20${shareUrlEnc}` },
    { label: 'Email',      href: `mailto:?subject=${encodeURIComponent('MKD Slidea — препорака')}&body=${shareText}%0A%0A${shareUrlEnc}` },
  ];

  const proDays = daysLeft(stats.pro_until);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-12 max-w-5xl mx-auto"
    >
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-700 rounded-full text-xs font-black uppercase tracking-widest mb-3">
          <Gift className="w-3.5 h-3.5" /> Програма за препораки
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
          Покани наставник, добиј 1 месец Pro
        </h2>
        <p className="text-slate-500 font-bold">
          За секој наставник што се регистрира преку твојата врска и го создаде својот прв настан, добиваш <strong>+30 дена Pro</strong> бесплатно.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Препораки</p>
          <p className="text-4xl font-black text-slate-900">{loading ? '—' : stats.total}</p>
          <p className="text-xs font-bold text-slate-400 mt-2">Регистрирани преку твоја врска</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
          <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-3">Наградени</p>
          <p className="text-4xl font-black text-emerald-600">{loading ? '—' : stats.rewarded}</p>
          <p className="text-xs font-bold text-slate-400 mt-2">Создадоа барем еден настан</p>
        </div>
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100">
          <p className="text-xs font-black uppercase tracking-widest mb-3 opacity-80 flex items-center gap-1">
            <Crown className="w-3.5 h-3.5" /> Pro статус
          </p>
          <p className="text-4xl font-black">
            {loading ? '—' : (proDays > 0 ? `${proDays} дена` : '0')}
          </p>
          <p className="text-xs font-bold opacity-80 mt-2">
            {stats.pro_until && proDays > 0
              ? `До ${formatDate(stats.pro_until)}`
              : 'Покани прв колега за да започнеш'}
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm mb-6">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Твоја врска за препорака</p>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            readOnly
            value={referralUrl}
            onFocus={(e) => e.target.select()}
            className="flex-1 px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-sm text-slate-700 focus:outline-none focus:border-indigo-300"
          />
          <button
            onClick={copy}
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-sm transition-all ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
            }`}
          >
            {copied ? <><Check className="w-4 h-4" /> Копирано!</> : <><Copy className="w-4 h-4" /> Копирај врска</>}
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Share2 className="w-3.5 h-3.5" /> Сподели директно
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {shareLinks.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-2xl font-black text-sm transition-all border-2 border-transparent hover:border-indigo-200"
            >
              {s.label === 'Email' && <Mail className="w-4 h-4" />}
              {s.label}
            </a>
          ))}
        </div>
      </div>

      <div className="mt-8 p-5 bg-amber-50 border-2 border-amber-100 rounded-2xl">
        <p className="text-sm font-bold text-amber-800">
          <strong>Како функционира:</strong> Препорачаниот наставник мора да се регистрира преку твојата врска и да го создаде својот прв настан. Тогаш добиваш +30 дена Pro автоматски.
        </p>
      </div>
    </motion.div>
  );
};

export default ReferralsTab;
