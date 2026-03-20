import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Plus, ArrowRight, Presentation, Globe, MonitorPlay, Users } from 'lucide-react';

const Landing = ({ code, setCode, setView }) => {
  return (
    <motion.div
      key="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative overflow-hidden"
    >
      {/* Promo Join Bar */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-4 text-white">
          <span className="font-bold text-lg">Се приклучувате како учесник?</span>
          <div className="flex bg-white/20 p-1 rounded-2xl backdrop-blur-md border border-white/30 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Внеси го кодот" 
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="bg-transparent px-4 py-2 outline-none placeholder:text-white/70 font-bold w-full md:w-40"
            />
            <button 
              onClick={() => setView('join')}
              className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-black hover:bg-indigo-50 transition-colors"
            >
              Влези
            </button>
          </div>
        </div>
      </div>

      {/* Main Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="text-left">
          <motion.h1 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-6xl md:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-[1.1]"
          >
            Слајдови кои <span className="text-indigo-600">слушаат</span>,<br />
            Идеи кои <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600">водат.</span>
          </motion.h1>
          <p className="text-xl text-slate-500 mb-10 max-w-xl leading-relaxed">
            Направете ги вашите презентации двонасочна улица. Најдобрата македонска платформа за квизови, анкети и моќна интеракција во живо.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="bg-indigo-50 p-3 rounded-2xl w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="font-black mb-2">Готови шаблони</h3>
              <p className="text-sm text-slate-400 font-medium">Пронајдете го вашиот совршен дизајн веднаш.</p>
              <button className="mt-4 text-indigo-600 font-bold text-sm flex items-center gap-1">Земи бесплатно <ArrowRight className="w-4 h-4" /></button>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="bg-violet-50 p-3 rounded-2xl w-fit mb-4 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-black mb-2">AI Креирање</h3>
              <p className="text-sm text-slate-400 font-medium">Инстант слајдови со помош на вештачка интелигенција.</p>
              <button className="mt-4 text-violet-600 font-bold text-sm flex items-center gap-1">Креирај со AI <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setView('host')}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
              Започни сега
            </button>
            <button className="bg-white text-slate-700 px-8 py-4 rounded-2xl font-black text-lg border-2 border-slate-100 hover:border-indigo-600 transition-all">
              Погледни демо
            </button>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 bg-white p-4 rounded-[3rem] shadow-2xl border border-slate-100"
          >
            <div className="bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                  <Users className="w-5 h-5" />
                </div>
                <span className="font-black text-slate-400">ПРАШАЊЕ ВО ЖИВО</span>
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-10 leading-snug">Кој е главниот град на Македонија?</h2>
              <div className="space-y-4">
                <div className="p-5 bg-white rounded-2xl border-2 border-indigo-600 shadow-lg shadow-indigo-100 font-black text-indigo-600 flex justify-between items-center">
                  Скопје
                  <div className="w-3 h-3 bg-indigo-600 rounded-full animate-ping"></div>
                </div>
                <div className="p-5 bg-white rounded-2xl border-2 border-slate-100 font-bold text-slate-400">Битола</div>
                <div className="p-5 bg-white rounded-2xl border-2 border-slate-100 font-bold text-slate-400">Охрид</div>
              </div>
            </div>
          </motion.div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-100/50 rounded-full blur-3xl -z-10"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-100/50 rounded-full blur-2xl -z-10"></div>
        </div>
      </div>

      {/* Integrations Section */}
      <div className="bg-white py-24 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4 text-slate-900">Интегрирајте беспрекорно</h2>
          <p className="text-slate-500 mb-16 max-w-2xl mx-auto font-medium">
            Спречете го постојаното менување апликации. MKD Slidea работи таму каде што се вашите состаноци.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-sm border border-red-100">
                <Presentation className="w-8 h-8" />
              </div>
              <span className="font-bold text-xs text-slate-400">PowerPoint</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                <Globe className="w-8 h-8" />
              </div>
              <span className="font-bold text-xs text-slate-400">Google Slides</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                <MonitorPlay className="w-8 h-8" />
              </div>
              <span className="font-bold text-xs text-slate-400">Teams / Zoom</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Landing;
