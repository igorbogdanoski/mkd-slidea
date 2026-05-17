import React from 'react';
import { motion } from 'framer-motion';
import { Download, ExternalLink, Presentation, GraduationCap, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

const openExternal = (url) => window.open(url, '_blank', 'noopener,noreferrer');

const IntegrationsTab = ({ setView }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12 max-w-6xl mx-auto">
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
      <div>
        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Интеграции</h2>
        <p className="text-slate-400 font-bold max-w-2xl">
          Сè што ви треба за да ја поврзете MKD Slidea со PowerPoint, Google Workspace/Classroom и училишна администрација.
        </p>
      </div>
      <button
        onClick={() => openExternal('/integrations/index.html')}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-all"
      >
        <ExternalLink size={16} /> Отвори Integration Hub
      </button>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* PowerPoint */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
          <Presentation size={26} />
        </div>
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3">Microsoft PowerPoint</p>
          <h3 className="text-2xl font-black text-slate-900 mb-3">Add-in подготвен за sideload</h3>
          <p className="text-slate-500 font-medium leading-relaxed">
            Преземете го manifest фајлот и инсталирајте го додатокот локално во PowerPoint за тестирање и интерно користење.
          </p>
        </div>
        <div className="space-y-3 mb-8">
          {['Production URL вградена во manifest', 'One-click task pane за презентации', 'Подготвено за Microsoft 365 admin/publishing процес'].map(item => (
            <div key={item} className="flex items-start gap-3 text-sm font-bold text-slate-700">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto flex flex-col sm:flex-row gap-3">
          <button onClick={() => openExternal('/ppt-addin/manifest.xml')} className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all">
            <Download size={16} /> Преземи manifest
          </button>
          <button onClick={() => openExternal('/integrations/index.html#microsoft')} className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-black hover:bg-slate-200 transition-all">
            <ExternalLink size={16} /> Види чекори
          </button>
        </div>
      </div>

      {/* Google */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
          <GraduationCap size={26} />
        </div>
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-3">Google Workspace / Classroom</p>
          <h3 className="text-2xl font-black text-slate-900 mb-3">Google login и Slides add-on assets</h3>
          <p className="text-slate-500 font-medium leading-relaxed">
            Наставниците можат да се најават со Google сметка, а Apps Script фајловите се подготвени за Google Slides sidebar инсталација.
          </p>
        </div>
        <div className="space-y-3 mb-8">
          {['Google sign-in е достапен во login modal', 'Компатибилно со Google Workspace училишни сметки', 'Code.gs и Sidebar.html се подготвени за Apps Script deployment'].map(item => (
            <div key={item} className="flex items-start gap-3 text-sm font-bold text-slate-700">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={() => openExternal('/google-slides-addon/Code.gs')} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 transition-all">
            <Download size={16} /> Code.gs
          </button>
          <button onClick={() => openExternal('/google-slides-addon/Sidebar.html')} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-50 text-emerald-700 font-black hover:bg-emerald-100 transition-all">
            <Download size={16} /> Sidebar.html
          </button>
          <button onClick={() => openExternal('/integrations/index.html#google')} className="sm:col-span-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-black hover:bg-slate-200 transition-all">
            <ExternalLink size={16} /> Види Google setup
          </button>
        </div>
      </div>

      {/* e-Дневник */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
          <FileSpreadsheet size={26} />
        </div>
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3">e-дневник</p>
          <h3 className="text-2xl font-black text-slate-900 mb-3">Извоз на оценки и активност</h3>
          <p className="text-slate-500 font-medium leading-relaxed">
            Од статистики по учесник извезувате CSV со ученик, одговори, точни одговори, поени, комплетираност и последна активност.
          </p>
        </div>
        <div className="space-y-3 mb-8">
          {['Подготвено за Excel и административна обработка', 'Фокус на поучесничка аналитика за наставници', 'Вградено во Host view преку Participant Stats modal'].map(item => (
            <div key={item} className="flex items-start gap-3 text-sm font-bold text-slate-700">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto flex flex-col sm:flex-row gap-3">
          <button onClick={() => setView('host')} className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 text-white font-black hover:bg-amber-600 transition-all">
            <FileSpreadsheet size={16} /> Отвори Host
          </button>
          <button onClick={() => openExternal('/integrations/index.html#ednevnik')} className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-black hover:bg-slate-200 transition-all">
            <ExternalLink size={16} /> Види формат
          </button>
        </div>
      </div>
    </div>

    <div className="mt-10 bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">Статус</p>
        <h3 className="text-2xl font-black mb-2">Product-side integrations се затворени</h3>
        <p className="text-slate-300 font-bold max-w-3xl">
          Единствен преостанат чекор надвор од кодот е external marketplace publishing кај Microsoft/Google, што се прави преку нивните developer портали.
        </p>
      </div>
      <button onClick={() => openExternal('/integrations/index.html#publishing')} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white text-slate-900 font-black hover:bg-slate-100 transition-all">
        <ExternalLink size={16} /> Publishing чекори
      </button>
    </div>
  </motion.div>
);

export default IntegrationsTab;
