import React from 'react';
import { motion } from 'framer-motion';

const TemplatesTab = ({ allTemplates, templatesLoading, useTemplate }) => (
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
              <img src={temp.img} alt={temp.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
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
                  onClick={() => useTemplate(temp)}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Користи
                </button>
                <button className="flex-1 py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-xs hover:bg-slate-100 transition-all">
                  Преглед
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </motion.div>
);

export default TemplatesTab;
