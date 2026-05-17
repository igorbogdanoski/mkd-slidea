import React from 'react';
import { X, UserPlus, Copy, Eye, EyeOff, RotateCcw, Trophy, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { isPro } from '../../lib/plans';

const toInputDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
};

const fromInputDateTime = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const EventSettingsModal = ({
  isOpen,
  onClose,
  event,
  setEvent,
  user,
  polls,
  allowMultipleVotes,
  setAllowMultipleVotes,
  embedTab,
  setEmbedTab,
  embedCopied,
  setEmbedCopied,
  showPwd,
  setShowPwd,
  resetAllResults,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl z-10 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-[2rem]" />
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black">Поставки на настанот</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Multiple votes */}
          <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
            <div>
              <p className="font-black text-slate-900">Повеќекратно гласање</p>
              <p className="text-sm text-slate-400 font-bold mt-0.5">Учесниците можат да гласаат повеќепати по Refresh</p>
            </div>
            <button
              onClick={() => {
                const next = !allowMultipleVotes;
                setAllowMultipleVotes(next);
                localStorage.setItem('setting_multiple_votes', String(next));
              }}
              className={`relative w-14 h-7 rounded-full transition-colors ${allowMultipleVotes ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${allowMultipleVotes ? 'translate-x-7' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Q&A moderation */}
          <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
            <div>
              <p className="font-black text-slate-900">Модерација на прашања</p>
              <p className="text-sm text-slate-400 font-bold mt-0.5">Прашањата од публиката чекаат одобрување</p>
            </div>
            <button
              onClick={async () => {
                const next = !event.questions_moderation;
                await supabase.from('events').update({ questions_moderation: next }).eq('id', event.id);
                setEvent(prev => ({ ...prev, questions_moderation: next }));
              }}
              className={`relative w-14 h-7 rounded-full transition-colors ${event.questions_moderation ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${event.questions_moderation ? 'translate-x-7' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Event title */}
          <div className="p-5 bg-slate-50 rounded-2xl">
            <p className="font-black text-slate-900 mb-3">Наслов на настанот</p>
            <input
              type="text"
              defaultValue={event.title || ''}
              onBlur={async (e) => {
                if (e.target.value.trim()) {
                  await supabase.from('events').update({ title: e.target.value.trim() }).eq('id', event.id);
                }
              }}
              className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-bold focus:border-indigo-600 outline-none transition-all"
              placeholder="Мојот настан"
            />
          </div>

          {/* Cover image */}
          <div className="p-5 bg-slate-50 rounded-2xl">
            <p className="font-black text-slate-900 mb-1">Насловна слика</p>
            <p className="text-sm text-slate-400 font-bold mb-3">URL на слика која се прикажува на картичката на настанот</p>
            {event.cover_image && (
              <div className="mb-3 relative group w-full h-24 rounded-xl overflow-hidden border border-slate-200">
                <img src={event.cover_image} alt="Cover" className="w-full h-full object-cover" />
                <button
                  onClick={async () => {
                    await supabase.from('events').update({ cover_image: null }).eq('id', event.id);
                    setEvent(prev => ({ ...prev, cover_image: null }));
                  }}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >✕</button>
              </div>
            )}
            <input
              type="url"
              defaultValue={event.cover_image || ''}
              onBlur={async (e) => {
                const val = e.target.value.trim() || null;
                await supabase.from('events').update({ cover_image: val }).eq('id', event.id);
                setEvent(prev => ({ ...prev, cover_image: val }));
              }}
              className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-bold focus:border-indigo-600 outline-none transition-all text-sm"
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          {/* Co-host */}
          <div className="p-5 bg-slate-50 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="w-4 h-4 text-slate-600" />
              <p className="font-black text-slate-900">Ко-домаќин</p>
            </div>
            <p className="text-sm text-slate-400 font-bold mb-4">Сподели пристап до овој настан со колега</p>
            {event.cohost_code ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-white border-2 border-indigo-100 rounded-xl px-4 py-3">
                  <span className="flex-1 font-black text-indigo-700 tracking-widest text-lg">{event.cohost_code}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(event.cohost_code); }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Копирај"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Ко-домаќинот го внесува овој код на почетната страница
                </p>
                <button
                  onClick={async () => {
                    await supabase.from('events').update({ cohost_code: null }).eq('id', event.id);
                    setEvent(prev => ({ ...prev, cohost_code: null }));
                  }}
                  className="text-xs font-black text-red-400 hover:text-red-600 transition-colors uppercase tracking-widest"
                >
                  Откажи ко-домаќин пристап
                </button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  const code = Array.from(crypto.getRandomValues(new Uint8Array(5)))
                    .map(b => b.toString(36)).join('').toUpperCase().slice(0, 8);
                  await supabase.from('events').update({ cohost_code: code }).eq('id', event.id);
                  setEvent(prev => ({ ...prev, cohost_code: code }));
                }}
                className="w-full py-3 bg-white border-2 border-dashed border-slate-200 text-slate-500 rounded-xl font-black text-sm hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Генерирај ко-домаќин код
              </button>
            )}
          </div>

          {/* Event password */}
          <div className="p-5 bg-slate-50 rounded-2xl">
            <p className="font-black text-slate-900 mb-1">Лозинка за настанот</p>
            <p className="text-sm text-slate-400 font-bold mb-3">Учесниците мора да ја внесат пред да влезат</p>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                defaultValue={event.password || ''}
                onBlur={async (e) => {
                  const val = e.target.value.trim() || null;
                  await supabase.from('events').update({ password: val }).eq('id', event.id);
                  setEvent(prev => ({ ...prev, password: val }));
                }}
                placeholder="Без лозинка"
                className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-bold focus:border-indigo-600 outline-none transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {event.password && (
              <p className="mt-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                🔒 Настанот е заштитен со лозинка
              </p>
            )}
          </div>

          {/* Async / Homework mode */}
          <div className="p-5 bg-slate-50 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-black text-slate-900">Асинхрон (Homework) режим</p>
                <p className="text-sm text-slate-400 font-bold mt-0.5">Настанот останува отворен без наставник онлајн</p>
              </div>
              <button
                onClick={async () => {
                  const next = !event.async_mode;
                  const deadline = next
                    ? (event.async_deadline || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString())
                    : null;
                  await supabase.from('events').update({ async_mode: next, async_deadline: deadline }).eq('id', event.id);
                  setEvent(prev => ({ ...prev, async_mode: next, async_deadline: deadline }));
                }}
                className={`relative w-14 h-7 rounded-full transition-colors ${event.async_mode ? 'bg-emerald-600' : 'bg-slate-200'}`}
              >
                <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${event.async_mode ? 'translate-x-7' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Краен рок</label>
              <input
                type="datetime-local"
                disabled={!event.async_mode}
                value={toInputDateTime(event.async_deadline)}
                onChange={async (e) => {
                  const iso = fromInputDateTime(e.target.value);
                  await supabase.from('events').update({ async_deadline: iso }).eq('id', event.id);
                  setEvent(prev => ({ ...prev, async_deadline: iso }));
                }}
                className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-bold focus:border-emerald-500 outline-none transition-all disabled:opacity-50"
              />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                {event.async_mode
                  ? 'Учесниците можат да одговараат до рокот.'
                  : 'Вклучи го режимот за 24-48h homework сценарио.'}
              </p>
            </div>
          </div>

          {/* Brand color (Pro) */}
          <div className={`p-5 bg-slate-50 rounded-2xl relative ${!isPro(user) ? 'opacity-70' : ''}`}>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-black text-slate-900">Брендирачка боја</p>
              {!isPro(user) && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-white uppercase tracking-widest">Pro</span>
              )}
            </div>
            <p className="text-sm text-slate-400 font-bold mb-4">Акцентна боја во Презентерот</p>
            <div className={`flex items-center gap-2 flex-wrap ${!isPro(user) ? 'pointer-events-none' : ''}`} aria-disabled={!isPro(user)}>
              {['#6366f1','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#0ea5e9'].map(c => (
                <button
                  key={c}
                  onClick={async () => {
                    if (!isPro(user)) return;
                    await supabase.from('events').update({ brand_color: c }).eq('id', event.id);
                    setEvent(prev => ({ ...prev, brand_color: c }));
                  }}
                  className="w-9 h-9 rounded-full border-4 transition-all hover:scale-110 active:scale-95"
                  style={{
                    backgroundColor: c,
                    borderColor: (event.brand_color || '#6366f1') === c ? c : 'transparent',
                    boxShadow: (event.brand_color || '#6366f1') === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none',
                  }}
                />
              ))}
              <label className="w-9 h-9 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-all overflow-hidden relative" title="Прилагодена боја">
                <span className="text-slate-400 text-xs font-black">+</span>
                <input
                  type="color"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  value={event.brand_color || '#6366f1'}
                  onChange={async (e) => {
                    if (!isPro(user)) return;
                    await supabase.from('events').update({ brand_color: e.target.value }).eq('id', event.id);
                    setEvent(prev => ({ ...prev, brand_color: e.target.value }));
                  }}
                />
              </label>
            </div>
          </div>

          {/* Brand font (Pro) */}
          <div className={`p-5 bg-slate-50 rounded-2xl relative ${!isPro(user) ? 'opacity-70' : ''}`}>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-black text-slate-900">Брендирачки фонт</p>
              {!isPro(user) && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-white uppercase tracking-widest">Pro</span>
              )}
            </div>
            <p className="text-sm text-slate-400 font-bold mb-4">Стилот на букви во Презентерот (системски — без додатни барања)</p>
            <div className={`grid grid-cols-2 gap-2 ${!isPro(user) ? 'pointer-events-none' : ''}`} aria-disabled={!isPro(user)}>
              {[
                { id: '',                                                                  label: 'Стандарден' },
                { id: '"Georgia", "Times New Roman", serif',                               label: 'Сериф' },
                { id: 'ui-rounded, "SF Pro Rounded", "Hiragino Sans", system-ui, sans-serif', label: 'Заоблен' },
                { id: 'ui-monospace, "SF Mono", Menlo, "Roboto Mono", monospace',          label: 'Моноспејс' },
              ].map(f => {
                const isSelected = (event.brand_font || '') === f.id;
                return (
                  <button
                    key={f.label}
                    onClick={async () => {
                      if (!isPro(user)) return;
                      const next = f.id || null;
                      await supabase.from('events').update({ brand_font: next }).eq('id', event.id);
                      setEvent(prev => ({ ...prev, brand_font: next }));
                    }}
                    className={`px-3 py-2 rounded-xl border-2 text-sm font-black transition-all text-left ${isSelected ? 'border-indigo-600 bg-white text-indigo-700 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300'}`}
                    style={f.id ? { fontFamily: f.id } : undefined}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Share to Google Classroom / Microsoft Teams */}
          {(() => {
            const joinUrl = `${window.location.origin}/event/${event.code}`;
            const title = encodeURIComponent(event.title || `Интерактивен час #${event.code}`);
            const msg   = encodeURIComponent(`Приклучи се на нашиот интерактивен час! Код: ${event.code}`);
            return (
              <div className="p-5 bg-slate-50 rounded-2xl">
                <p className="font-black text-slate-900 mb-1">Сподели со класот</p>
                <p className="text-sm text-slate-400 font-bold mb-3">Директно во Google Classroom или Microsoft Teams</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://classroom.google.com/share?url=${encodeURIComponent(joinUrl)}&title=${title}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-100 rounded-xl text-sm font-black text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#4285F4"/><path d="M17 8H7a1 1 0 00-1 1v6a1 1 0 001 1h10a1 1 0 001-1V9a1 1 0 00-1-1zm-5 5.5L7.5 11h9L12 13.5z" fill="white"/></svg>
                    Google Classroom
                  </a>
                  <a
                    href={`https://teams.microsoft.com/share?href=${encodeURIComponent(joinUrl)}&msgText=${msg}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-100 rounded-xl text-sm font-black text-slate-600 hover:border-purple-300 hover:text-purple-600 transition-all"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#6264A7"><path d="M20 3H4C2.9 3 2 3.9 2 5v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1z"/></svg>
                    Microsoft Teams
                  </a>
                  <a
                    href={`https://zoom.us/teaching`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={e => { e.preventDefault(); navigator.clipboard.writeText(joinUrl).catch(()=>{}); alert('Линкот е копиран — налепи го во Zoom Chat!'); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-100 rounded-xl text-sm font-black text-slate-600 hover:border-sky-300 hover:text-sky-600 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#2D8CFF"><rect width="24" height="24" rx="4" fill="#2D8CFF"/><path d="M5 8.5A1.5 1.5 0 016.5 7h7A1.5 1.5 0 0115 8.5V14a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 015 14V8.5zm10 1.5l3.5-2v7L15 13.5V10z" fill="white"/></svg>
                    Zoom (копирај линк)
                  </a>
                </div>
              </div>
            );
          })()}

          {/* Embed code (iframe / script / WordPress / Moodle) */}
          {(() => {
            const origin = window.location.origin;
            const code = event.code;
            const snippets = {
              iframe: `<iframe src="${origin}/event/${code}/embed?utm_source=embed&utm_medium=iframe" width="100%" height="480" frameborder="0" loading="lazy" style="border:0;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08)"></iframe>`,
              script: `<div data-mkd-slidea="${code}" data-height="480"></div>\n<script async src="${origin}/embed.js"></script>`,
              wordpress: `[mkd_slidea code="${code}" height="480"]\n\n<!-- Note: WordPress site administrators must add this shortcode to functions.php (a 10-line snippet documented in the Slidea help center). -->`,
              moodle: `<iframe src="${origin}/event/${code}/embed?utm_source=moodle&utm_medium=lms" width="100%" height="480" frameborder="0" allowfullscreen style="border:0;border-radius:12px;"></iframe>\n\n<!-- Moodle: Уреди активност → Додај HTML блок → Налепи го кодот -->\n<!-- За LTI/External Tool интеграција посети: ${origin}/integrations#moodle -->`,
            };
            const labels = { iframe: 'iFrame', script: 'Script', wordpress: 'WordPress', moodle: 'Moodle' };
            const value = snippets[embedTab];
            const copy = async () => {
              try {
                await navigator.clipboard.writeText(value);
                setEmbedCopied(true);
                setTimeout(() => setEmbedCopied(false), 1800);
              } catch { /* ignore */ }
            };
            return (
              <div className="p-5 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-black text-slate-900">Embed на вашата страница</p>
                </div>
                <p className="text-sm text-slate-400 font-bold mb-3">
                  Вградете ги анкетите на блог, веб-страница или WordPress
                </p>
                <div className="flex gap-1 mb-3 p-1 bg-white border-2 border-slate-100 rounded-xl">
                  {Object.keys(snippets).map((key) => (
                    <button
                      key={key}
                      onClick={() => setEmbedTab(key)}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                        embedTab === key
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-indigo-600'
                      }`}
                    >
                      {labels[key]}
                    </button>
                  ))}
                </div>
                <textarea
                  readOnly
                  rows={embedTab === 'wordpress' ? 4 : 3}
                  value={value}
                  onFocus={(e) => e.target.select()}
                  className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-mono text-xs text-slate-600 resize-none focus:outline-none focus:border-indigo-300"
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    onClick={copy}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all ${
                      embedCopied
                        ? 'bg-emerald-600 text-white border-2 border-emerald-600'
                        : 'bg-white border-2 border-slate-100 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5" /> {embedCopied ? 'Копирано!' : `Копирај ${labels[embedTab]}`}
                  </button>
                  {embedTab === 'script' && (
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Auto-resize · Lazy load
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Logo upload (Pro) */}
          <div className={`p-5 bg-slate-50 rounded-2xl ${!isPro(user) ? 'opacity-70' : ''}`}>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-black text-slate-900">Лого</p>
              {!isPro(user) && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-white uppercase tracking-widest">Pro</span>
              )}
            </div>
            <p className="text-sm text-slate-400 font-bold mb-4">Се прикажува во Презентерот наместо MKD Slidea</p>
            <div className={`flex items-center gap-4 ${!isPro(user) ? 'pointer-events-none' : ''}`} aria-disabled={!isPro(user)}>
              {event.logo_url ? (
                <div className="relative group">
                  <img src={event.logo_url} alt="Лого" className="h-14 w-auto max-w-[120px] object-contain rounded-xl bg-white border border-slate-200 p-1" />
                  <button
                    onClick={async () => {
                      await supabase.from('events').update({ logo_url: null }).eq('id', event.id);
                      setEvent(prev => ({ ...prev, logo_url: null }));
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >✕</button>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 font-black text-xl">?</div>
              )}
              <label className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isPro(user) ? 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30' : 'border-slate-200'}`}>
                <span className="text-sm font-black text-slate-400">{event.logo_url ? 'Замени лого' : 'Прикачи лого'}</span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">PNG, JPG, SVG · max 2MB</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={!isPro(user)}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const ext = file.name.split('.').pop();
                    const path = `${event.id}.${ext}`;
                    const { error } = await supabase.storage.from('event-logos').upload(path, file, { upsert: true });
                    if (error) { alert('Грешка при прикачување. Проверете дали bucket-от постои.'); return; }
                    const { data: urlData } = supabase.storage.from('event-logos').getPublicUrl(path);
                    await supabase.from('events').update({ logo_url: urlData.publicUrl }).eq('id', event.id);
                    setEvent(prev => ({ ...prev, logo_url: urlData.publicUrl }));
                  }}
                />
              </label>
            </div>
          </div>

          {/* Lock audience */}
          <div className="mt-5 p-5 bg-slate-50 rounded-2xl flex items-center justify-between">
            <div>
              <p className="font-black text-slate-900">Заклучи публиката</p>
              <p className="text-sm text-slate-400 font-bold mt-0.5">
                {event.is_locked ? 'Учесниците не можат да гласаат' : 'Учесниците можат да гласаат'}
              </p>
            </div>
            <button
              onClick={async () => {
                const next = !event.is_locked;
                await supabase.from('events').update({ is_locked: next }).eq('id', event.id);
                setEvent(prev => ({ ...prev, is_locked: next }));
              }}
              className={`relative w-14 h-7 rounded-full transition-colors ${event.is_locked ? 'bg-red-500' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${event.is_locked ? 'translate-x-7' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Per-event scoreboard link */}
          <a
            href={`/event/${event.code}/scores`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-4 hover:bg-amber-100 transition-colors group"
          >
            <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5 text-amber-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-slate-900">Скорборд на сесијата</p>
              <p className="text-sm text-slate-500 font-bold mt-0.5 truncate">
                /event/{event.code}/scores · живо ажурирање
              </p>
            </div>
            <ArrowLeft className="w-4 h-4 text-amber-600 rotate-180 group-hover:translate-x-1 transition-transform" />
          </a>

          {/* Public scoreboard opt-in */}
          <div className="mt-3 p-5 bg-slate-50 rounded-2xl flex items-center justify-between">
            <div className="flex-1 pr-4">
              <p className="font-black text-slate-900 flex items-center gap-2">
                Јавен скорборд 🏆
              </p>
              <p className="text-sm text-slate-400 font-bold mt-0.5">
                {event.is_public_scoreboard
                  ? 'Победниците се прикажуваат на /scoreboard'
                  : 'Резултатите се приватни (стандардно)'}
              </p>
            </div>
            <button
              onClick={async () => {
                const next = !event.is_public_scoreboard;
                await supabase.from('events').update({ is_public_scoreboard: next }).eq('id', event.id);
                setEvent(prev => ({ ...prev, is_public_scoreboard: next }));
              }}
              className={`relative w-14 h-7 rounded-full transition-colors ${event.is_public_scoreboard ? 'bg-amber-500' : 'bg-slate-200'}`}
              aria-label="Јавен скорборд"
            >
              <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${event.is_public_scoreboard ? 'translate-x-7' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Danger zone */}
          {polls.length > 0 && (
            <div className="mt-5 p-5 bg-red-50 border border-red-100 rounded-2xl">
              <p className="font-black text-red-700 text-sm mb-3 uppercase tracking-widest">Danger zone</p>
              <button
                onClick={async () => {
                  await resetAllResults();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-red-200 text-red-500 rounded-xl font-black text-sm hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Ресетирај ги сите резултати
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-6 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all"
          >
            Зачувај и затвори
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventSettingsModal;
