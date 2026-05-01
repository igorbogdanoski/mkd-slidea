import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Save, Globe, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ProfileTab = ({ user }) => {
  const [name, setName] = useState('');
  const [publicTeacher, setPublicTeacher] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [error, setError] = useState('');

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
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (!user?.id) return;
    setSaving(true);
    setError('');
    const payload = { id: user.id, name: name.trim() || null, public_teacher: publicTeacher };
    const { error: err } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(0), 2200);
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

      <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-sm space-y-6">
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
    </motion.div>
  );
};

export default ProfileTab;
