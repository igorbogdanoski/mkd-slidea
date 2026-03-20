import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Dashboard/Sidebar';
import HomeTab from '../components/Dashboard/HomeTab';
import AnalyticsTab from '../components/Dashboard/AnalyticsTab';

const Dashboard = ({ setView }) => {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab setView={setView} setActiveTab={setActiveTab} />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'presentations':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-12 text-center pt-32"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Мои презентации</h2>
            <p className="text-slate-400 font-bold max-w-md mx-auto mb-12 italic tracking-wide">Тука ќе ги најдете сите ваши претходно креирани анкети и квизови.</p>
            <div className="p-24 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center max-w-4xl mx-auto shadow-sm">
               <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-slate-200 mb-8 shadow-sm">
                  <span className="text-5xl">📄</span>
               </div>
               <h3 className="text-2xl font-black text-slate-400 mb-2">Сè уште немате презентации</h3>
               <p className="text-slate-300 font-bold mb-10">Започнете со креирање на вашата прва интеракција денес!</p>
               <button 
                  onClick={() => setView('host')}
                  className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                >
                  Нова презентација
                </button>
            </div>
          </motion.div>
        );
      case 'templates':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-12"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Сите шаблони</h2>
            <p className="text-slate-400 font-bold mb-12">Започнете брзо со еден од нашите претходно дизајнирани шаблони.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {[1,2,3,4,5,6,7,8].map(i => (
                 <div key={i} className="aspect-[4/3] bg-slate-100 rounded-[2.5rem] animate-pulse" />
               ))}
            </div>
          </motion.div>
        );
      case 'team':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-12 max-w-4xl mx-auto text-center pt-32"
          >
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-16 rounded-[4rem] border-2 border-indigo-100/50 shadow-2xl shadow-indigo-50 relative overflow-hidden group">
               <div className="relative z-10">
                 <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-indigo-600 mx-auto mb-10 shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform duration-500">
                    <span className="text-5xl font-black tracking-tighter">TEAM</span>
                 </div>
                 <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Работете заедно со вашиот тим</h2>
                 <p className="text-xl text-slate-500 font-bold mb-12 leading-relaxed opacity-80 uppercase tracking-widest text-xs">Функција достапна само во Pro и Semester плановите.</p>
                 <button 
                  onClick={() => setActiveTab('plan')}
                  className="px-12 py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 active:scale-95"
                >
                  Надгради сега
                </button>
               </div>
               <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white/40 rounded-full blur-[80px]" />
            </div>
          </motion.div>
        );
      default:
        return (
          <div className="p-12 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mb-8 animate-bounce">
               <span className="text-5xl">⚙️</span>
            </div>
            <h2 className="text-3xl font-black text-slate-300">Наскоро достапно...</h2>
            <p className="text-slate-200 font-bold mt-2 uppercase tracking-widest">Овој дел се подготвува за вас.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans selection:bg-indigo-100 selection:text-indigo-700">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 min-h-screen relative overflow-y-auto h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Dashboard;
