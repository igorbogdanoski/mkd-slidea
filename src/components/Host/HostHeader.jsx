import React from 'react';
import { Zap, QrCode, MonitorPlay, Smartphone } from 'lucide-react';

const HostHeader = ({ event, setIsQRModalOpen, setView, isRemoteMode, setIsRemoteMode }) => {
  if (!event) return null;
  
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
      <div className="flex items-center gap-4">
        <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100">
          <Zap className="text-white w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black">Контролна табла</h2>
          <p className="text-slate-400 text-sm font-bold">Управувајте со {event.code}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
        <button 
          onClick={() => setIsRemoteMode(!isRemoteMode)} 
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${isRemoteMode ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
        >
          <Smartphone className="w-4 h-4" /> Remote
        </button>
        <button onClick={() => setIsQRModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl font-mono font-bold text-slate-600 text-lg transition-all group">
          <QrCode className="w-5 h-5 group-hover:rotate-12 transition-transform" /> #{event.code}
        </button>
        <button onClick={() => window.open(`/event/${event.code}/present`, '_blank')} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl font-bold text-sm transition-all">
          <MonitorPlay className="w-4 h-4" /> Презентација
        </button>
        <button onClick={() => setView('landing')} className="flex items-center gap-2 px-4 py-2 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-all text-sm">Затвори</button>
      </div>
    </div>
  );
};

export default HostHeader;
