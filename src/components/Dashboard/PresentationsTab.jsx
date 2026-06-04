import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ErrorBoundary from '../ErrorBoundary';
import IllustrationPickerModal from '../IllustrationPickerModal';

const BrokenCard = () => (
  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden opacity-50">
    <div className="h-48 bg-slate-100 flex items-center justify-center">
      <span className="text-slate-400 text-sm font-bold">⚠ Грешка при вчитување</span>
    </div>
    <div className="p-8">
      <p className="font-black text-slate-300">Настанот не е достапен</p>
    </div>
  </div>
);

const cardColors = ['bg-indigo-600','bg-violet-600','bg-emerald-600','bg-amber-500','bg-rose-600','bg-cyan-600'];

const formatDate = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Пред момент';
  if (m < 60) return `Пред ${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Пред ${h} ${h === 1 ? 'час' : 'часа'}`;
  const d = Math.floor(h / 24);
  return `Пред ${d} ${d === 1 ? 'ден' : 'дена'}`;
};

const PresentationsTab = ({ allEvents, eventsLoading, setSelectedEvent, setView }) => {
  const [pickerTarget, setPickerTarget] = useState(null);
  const [localCovers, setLocalCovers] = useState({});

  const getCover = (ev) => localCovers[ev.id] !== undefined ? localCovers[ev.id] : ev.cover_image;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Мои настани</h2>
          <p className="text-slate-400 font-bold">Кликни на настан за да ги видиш резултатите или да го отвориш повторно.</p>
        </div>
        <button onClick={() => { localStorage.removeItem('active_event_code'); setView('host'); }} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
          + Нов настан
        </button>
      </div>

      {eventsLoading ? (
        <div className="grid grid-cols-3 gap-8">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-[2.5rem] h-64 animate-pulse border border-slate-100" />)}
        </div>
      ) : allEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="text-7xl mb-6">📭</div>
          <h3 className="text-2xl font-black text-slate-300 mb-2">Сè уште нема настани</h3>
          <p className="text-slate-200 font-bold mb-8">Создај го твојот прв интерактивен час</p>
          <button onClick={() => { localStorage.removeItem('active_event_code'); setView('host'); }} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            + Нова презентација
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allEvents.map((ev, idx) => {
            const cover = getCover(ev);
            return (
              <ErrorBoundary key={ev.id} fallback={<BrokenCard />}>
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-indigo-50 transition-all hover:-translate-y-1">
                <div
                  className={`h-48 p-8 flex items-end relative ${cover ? '' : cardColors[idx % cardColors.length]}`}
                  style={cover ? { backgroundImage: `url(${cover})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                >
                  {cover && <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />}
                  <button
                    onClick={(e) => { e.stopPropagation(); setPickerTarget(ev); }}
                    className="absolute top-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white rounded-xl px-3 py-1.5 flex items-center gap-1.5 font-black text-xs"
                    title="Смени слика на насловот"
                  >
                    <Camera size={13} /> Смени слика
                  </button>
                  <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                    <span className="text-3xl text-white">📊</span>
                  </div>
                  <div className="absolute bottom-6 right-6 z-10 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30 text-white font-black text-xs">
                    #{ev.code}
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="font-black text-xl text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {ev.title || 'Без наслов'}
                  </h3>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-6">{formatDate(ev.created_at)}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedEvent(ev)}
                      className="flex-1 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                    >
                      📊 Резултати
                    </button>
                    <button
                      onClick={() => { localStorage.setItem('active_event_code', ev.code); setView('host'); }}
                      className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-xs hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                    >
                      ▶ Отвори
                    </button>
                  </div>
                </div>
              </div>
              </ErrorBoundary>
            );
          })}
        </div>
      )}

      <IllustrationPickerModal
        isOpen={!!pickerTarget}
        onClose={() => setPickerTarget(null)}
        initialQuery={pickerTarget?.title || ''}
        onSelect={async (url) => {
          if (!pickerTarget) return;
          setLocalCovers(prev => ({ ...prev, [pickerTarget.id]: url }));
          setPickerTarget(null);
          await supabase.from('events').update({ cover_image: url }).eq('id', pickerTarget.id);
        }}
      />
    </motion.div>
  );
};

export default PresentationsTab;
