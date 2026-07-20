import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const TemplatesTab = ({ allTemplates, templatesLoading, applyTemplate }) => {
  const [previewTemplate, setPreviewTemplate] = useState(null);

  return (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12">
    <div className="flex items-center justify-between mb-12">
      <div>
        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Сите шаблони</h2>
        <p className="text-slate-400 font-bold">Официјални + community шаблони за брз старт.</p>
      </div>
    </div>

    {templatesLoading ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm h-80 animate-pulse" />
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {allTemplates.map((temp) => (
          <div key={temp.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group cursor-pointer hover:shadow-2xl hover:shadow-indigo-50 transition-all">
            <div className="h-48 relative overflow-hidden">
              <img src={temp.img} alt={temp.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-4 left-4">
                <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600">
                  {temp.category}
                </span>
              </div>
              {temp.source === 'community' && (
                <div className="absolute top-4 right-4">
                  <span className="bg-emerald-500/95 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    Community
                  </span>
                </div>
              )}
            </div>
            <div className="p-8">
              <h4 className="font-black text-slate-900 mb-6 line-clamp-2">{temp.title}</h4>
              {temp.source === 'community' && (
                <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-4">
                  Користен {temp.usage_count || 0} пати
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => applyTemplate(temp)}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Користи
                </button>
                <button
                  onClick={() => setPreviewTemplate(temp)}
                  className="flex-1 py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-xs hover:bg-slate-100 hover:text-slate-600 transition-all"
                >
                  Преглед
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

    <AnimatePresence>
      {previewTemplate && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setPreviewTemplate(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
            className="bg-white rounded-[2rem] max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-slate-100 flex items-start justify-between gap-4 sticky top-0 bg-white">
              <div>
                <h3 className="font-black text-xl text-slate-900 mb-1">{previewTemplate.title}</h3>
                <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">
                  {(previewTemplate.polls || []).length} прашања · {previewTemplate.category}
                </p>
              </div>
              <button onClick={() => setPreviewTemplate(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-4">
              {(previewTemplate.polls || []).map((p, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl">
                  <p className="font-bold text-slate-800 text-sm mb-2">{i + 1}. {p.question}</p>
                  {Array.isArray(p.options) && (
                    <ul className="space-y-1">
                      {p.options.map((o, oi) => (
                        <li key={oi} className={`text-xs font-bold ${o.is_correct ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {o.is_correct ? '✓ ' : '· '}{o.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <div className="p-8 pt-0">
              <button
                onClick={() => { applyTemplate(previewTemplate); setPreviewTemplate(null); }}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all active:scale-95"
              >
                Користи го шаблонов
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
  );
};

export default TemplatesTab;
