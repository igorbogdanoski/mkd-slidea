import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Save, Globe, Check, AlertTriangle, Download, Bell, BellOff, Trash2, Shield, Moon, Sun } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useDarkMode } from '../../hooks/useDarkMode';

const downloadCSV = (filename, rows) => {
  const csv = rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const ProfileTab = ({ user }) => {
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [name, setName] = useState('');
  const [publicTeacher, setPublicTeacher] = useState(false);
  const [emailDigest, setEmailDigest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('profiles')
        .select('name, public_teacher')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (err && err.code !== 'PGRST116') setError(err.message);
      setName(data?.name || user?.name || '');
      setPublicTeacher(!!data?.public_teacher);
      setEmailDigest(!!data?.email_digest);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (!user?.id) return;
    setSaving(true);
    setError('');
    const payload = { id: user.id, name: name.trim() || null, public_teacher: publicTeacher, email_digest: emailDigest };
    const { error: err } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(0), 2200);
  };

  const exportData = async () => {
    if (!user?.id || exporting) return;
    setExporting(true);
    try {
      const { data: events } = await supabase.from('events').select('id, title, code, created_at').eq('user_id', user.id);
      if (!events?.length) { setExporting(false); return; }
      const eventIds = events.map(e => e.id);
      const { data: polls } = await supabase.from('polls').select('id, event_id, question, type').in('event_id', eventIds);
      const pollIds = polls?.map(p => p.id) || [];
      const { data: votes } = pollIds.length
        ? await supabase.from('votes').select('poll_id, option_index, session_id, created_at').in('poll_id', pollIds)
        : { data: [] };

      // Events CSV
      downloadCSV(`mkd-slidea-events-${new Date().toISOString().slice(0,10)}.csv`, [
        ['Наслов', 'Код', 'Создаден'],
        ...events.map(e => [e.title, e.code, e.created_at]),
      ]);

      // Votes CSV
      if (votes?.length) {
        const pollMap = Object.fromEntries((polls || []).map(p => [p.id, p]));
        const eventMap = Object.fromEntries(events.map(e => [e.id, e]));
        setTimeout(() => {
          downloadCSV(`mkd-slidea-votes-${new Date().toISOString().slice(0,10)}.csv`, [
            ['Настан', 'Прашање', 'Тип', 'Индекс на опција', 'Сесија', 'Датум'],
            ...(votes || []).map(v => {
              const poll = pollMap[v.poll_id];
              const ev = poll ? eventMap[poll.event_id] : null;
              return [ev?.title || '', poll?.question || '', poll?.type || '', v.option_index, v.session_id, v.created_at];
            }),
          ]);
        }, 600);
      }
    } catch { /* ignore */ }
    setExporting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-12 max-w-3xl mx-auto"
    >
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest mb-3">
          <User className="w-3.5 h-3.5" /> Профил
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Мој профил</h2>
        <p className="text-slate-500 font-bold">Управувај со твоето јавно име и видливоста на скорбордот.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border-2 border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
        <div>
          <label htmlFor="profile-name" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
            Име за прикажување
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="на пр. Игор Богданоски"
            maxLength={80}
            disabled={loading}
            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 placeholder-slate-300 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="border-t border-slate-100 pt-6">
          <label className="flex items-start gap-4 cursor-pointer group">
            <button
              type="button"
              role="switch"
              aria-checked={publicTeacher}
              onClick={() => setPublicTeacher((v) => !v)}
              disabled={loading}
              className={`relative flex-shrink-0 mt-1 w-12 h-7 rounded-full transition-all ${
                publicTeacher ? 'bg-emerald-500' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  publicTeacher ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <div>
              <p className="font-black text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-500" /> Јавен наставник
              </p>
              <p className="text-sm text-slate-500 font-bold mt-1">
                Прикажи го твоето име на јавниот <a href="/scoreboard" className="text-indigo-600 hover:underline">/scoreboard</a> кога имаш настани со вклучен „Јавен скорборд". Може да го исклучиш во секое време.
              </p>
            </div>
          </label>
        </div>

        {error && (
          <p className="text-sm font-bold text-red-500 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          {savedAt > 0 && (
            <span className="text-sm font-black text-emerald-600 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Зачувано!
            </span>
          )}
          <button
            type="submit"
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" /> {saving ? 'Се зачувува...' : 'Зачувај'}
          </button>
        </div>
      </form>

      {/* Notification preferences + Appearance */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border-2 border-slate-100 dark:border-slate-700 shadow-sm mt-6">
        <h3 className="font-black text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
          {emailDigest ? <Bell className="w-4 h-4 text-indigo-500" /> : <BellOff className="w-4 h-4 text-slate-300" />}
          Нотификации &amp; Изглед
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-5">Контролирај е-маил пораки и тема на интерфејсот.</p>

        <label className="flex items-center justify-between cursor-pointer group mb-5">
          <div>
            <p className="font-black text-slate-800 dark:text-slate-200 text-sm">Неделен дигест</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">Резиме на твоите настани и статистики секоја недела.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={emailDigest}
            onClick={() => setEmailDigest(v => !v)}
            disabled={loading}
            className={`relative flex-shrink-0 w-12 h-7 rounded-full transition-all ${emailDigest ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${emailDigest ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </label>

        <div className="border-t border-slate-100 dark:border-slate-700 pt-5">
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
              {isDark
                ? <Moon className="w-4 h-4 text-indigo-400" />
                : <Sun className="w-4 h-4 text-amber-500" />}
              <div>
                <p className="font-black text-slate-800 dark:text-slate-200 text-sm">Темна тема</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">Прекинувач за темен/светол режим на интерфејсот.</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              aria-label="Вклучи/исклучи темна тема"
              onClick={toggleDark}
              className={`relative flex-shrink-0 w-12 h-7 rounded-full transition-all ${isDark ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Се зачувува...' : 'Зачувај'}
          </button>
        </div>
      </div>

      {/* Data export / GDPR */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border-2 border-slate-100 dark:border-slate-700 shadow-sm mt-6">
        <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-400" /> Твоите податоци (GDPR)
        </h3>
        <p className="text-sm text-slate-500 font-bold mb-5">
          Во согласност со GDPR, имаш право да ги преземеш или избришеш твоите податоци.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={exportData}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Се извезува...' : 'Преземи CSV (настани + гласови)'}
          </button>
          <a
            href={`mailto:support@mismath.net?subject=Барање за бришење на податоци&body=Барам бришење на сите мои податоци. Мој е-маил: ${user?.email || ''}`}
            className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-sm hover:bg-red-100 transition-all border border-red-100"
          >
            <Trash2 className="w-4 h-4" /> Барај бришење на сметка
          </a>
        </div>
        <p className="text-xs text-slate-400 font-medium mt-4">
          Барањето за бришење ќе биде обработено во рок од 30 дена согласно GDPR.
        </p>
      </div>
    </motion.div>
  );
};

export default ProfileTab;
