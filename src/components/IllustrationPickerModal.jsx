import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Upload, Wand2, Loader2, Check, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

// Sprint 7.B + 7.E — Multi-source illustration picker.
// Tabs:
//   1. Openverse (Creative Commons search, no API key needed)
//   2. Upload (Supabase Storage `slide-images` bucket — user-scoped folder)
//   3. AI Generate (Pollinations.ai — free, no key, public CDN)
const TABS = [
  { id: 'search',   label: 'Бесплатни илустрации', icon: Search },
  { id: 'upload',   label: 'Прикачи своја',        icon: Upload },
  { id: 'generate', label: 'Генерирај со AI',      icon: Wand2 },
];

const OPENVERSE = 'https://api.openverse.org/v1/images/?page_size=24&license_type=all-cc&q=';

const IllustrationPickerModal = ({ isOpen, onClose, onSelect, initialQuery = '' }) => {
  const [tab, setTab] = useState('search');
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [genPrompt, setGenPrompt] = useState(initialQuery);
  const [genUrl, setGenUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setGenPrompt(initialQuery);
      setResults([]);
      setError('');
      setGenUrl('');
    }
  }, [isOpen, initialQuery]);

  const searchOpenverse = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(OPENVERSE + encodeURIComponent(q));
      if (!res.ok) throw new Error('Openverse search failed');
      const data = await res.json();
      setResults(Array.isArray(data?.results) ? data.results : []);
    } catch (err) {
      setError('Грешка при пребарување. Обидете се повторно.');
    } finally {
      setLoading(false);
    }
  };

  const choose = (url, meta = {}) => {
    if (typeof onSelect === 'function') onSelect(url, meta);
    onClose();
  };

  const handleUpload = async (file) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      setError('Дозволени се само слики.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('Сликата е поголема од 4MB.');
      return;
    }
    if (!user?.id) {
      setError('Мора да сте најавени за прикачување.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('slide-images')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('slide-images').getPublicUrl(path);
      const publicUrl = data?.publicUrl;
      if (!publicUrl) throw new Error('No public URL');
      choose(publicUrl, { source: 'upload', path });
    } catch (err) {
      console.error(err);
      setError('Грешка при прикачување.');
    } finally {
      setUploading(false);
    }
  };

  const generateWithPollinations = async () => {
    const p = genPrompt.trim();
    if (p.length < 3) return;
    setGenerating(true);
    setError('');
    try {
      // Free, no key, returns image directly. Add seed + nologo + size for stable output.
      const seed = Math.floor(Math.random() * 1_000_000);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        `${p}, educational illustration, clean, vibrant, flat design`
      )}?width=1024&height=576&nologo=true&seed=${seed}`;
      // Preload to confirm availability before showing.
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      setGenUrl(url);
    } catch {
      setError('AI генерирањето не успеа. Обидете се повторно.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="illu-picker-title"
          >
            <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-slate-50">
              <div>
                <h3 id="illu-picker-title" className="text-2xl font-black text-slate-900">Илустрација за активноста</h3>
                <p className="text-slate-400 font-bold text-sm mt-1">Пребарај, прикачи или генерирај — бесплатно.</p>
              </div>
              <button onClick={onClose} aria-label="Затвори" className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                <X size={22} />
              </button>
            </div>

            <div className="flex gap-2 px-8 pt-4 border-b border-slate-50">
              {TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setError(''); }}
                    className={`flex items-center gap-2 px-4 py-3 -mb-px border-b-2 font-black text-xs uppercase tracking-widest transition-all ${
                      tab === t.id
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              {error && (
                <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 font-bold text-sm">
                  {error}
                </div>
              )}

              {tab === 'search' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Пр: Питагорова теорема, сончев систем..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') searchOpenverse(); }}
                      className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all"
                    />
                    <button
                      onClick={searchOpenverse}
                      disabled={loading || query.trim().length < 2}
                      className="px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Пребарај
                    </button>
                  </div>
                  <p className="text-xs font-bold text-slate-400">
                    Резултатите доаѓаат од Openverse (Creative Commons). Атрибуцијата автоматски се чува.
                  </p>
                  {results.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {results.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => choose(r.url, {
                            source: 'openverse',
                            id: r.id,
                            title: r.title,
                            creator: r.creator,
                            license: r.license,
                            license_url: r.license_url,
                            attribution: r.attribution,
                            foreign_landing_url: r.foreign_landing_url,
                          })}
                          className="group relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 hover:border-indigo-500 transition-all"
                          title={`${r.title || ''} · ${r.creator || ''} · ${r.license || ''}`}
                        >
                          <img src={r.thumbnail || r.url} alt={r.title || ''} className="w-full h-full object-cover" loading="lazy" />
                          <span className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/20 transition-all" />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-white/90 text-[9px] font-black text-slate-700 uppercase">
                            {r.license || 'CC'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {!loading && results.length === 0 && query && (
                    <p className="text-center text-sm font-bold text-slate-400 py-8">Нема резултати. Обидете се со друг збор.</p>
                  )}
                </div>
              )}

              {tab === 'upload' && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files?.[0]); }}
                    className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUpload(e.target.files?.[0])}
                    />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        <p className="font-black text-slate-500">Се прикачува...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="font-black text-slate-700 mb-1">Повлечи слика овде или кликни</p>
                        <p className="text-xs font-bold text-slate-400">PNG, JPG, WEBP, GIF · max 4MB</p>
                      </>
                    )}
                  </div>
                  {!user?.id && (
                    <p className="text-xs font-bold text-amber-600">Прикачувањето бара најава.</p>
                  )}
                </div>
              )}

              {tab === 'generate' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Опис (на македонски или англиски)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Пр: илустрација на сончев систем со сите планети, светли бои, рамен дизајн..."
                      value={genPrompt}
                      onChange={(e) => setGenPrompt(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all resize-none"
                    />
                  </div>
                  <button
                    onClick={generateWithPollinations}
                    disabled={generating || genPrompt.trim().length < 3}
                    className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {generating ? 'Се генерира...' : 'Генерирај'}
                  </button>
                  <p className="text-xs font-bold text-slate-400">
                    Бесплатно преку Pollinations.ai · потребна е интернет конекција.
                    <a href="https://pollinations.ai" target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-indigo-500 hover:underline">
                      Дознај повеќе <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                  {genUrl && (
                    <div className="space-y-3">
                      <img src={genUrl} alt="AI генерирана илустрација" className="w-full rounded-2xl border-2 border-slate-100" />
                      <button
                        onClick={() => choose(genUrl, { source: 'pollinations', prompt: genPrompt })}
                        className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" /> Употреби ја
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default IllustrationPickerModal;
