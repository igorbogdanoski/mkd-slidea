import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceCommands } from '../hooks/useVoiceCommands';

const VoiceControlButton = ({ handlers, className = '' }) => {
  const { supported, listening, lastHeard, toggle } = useVoiceCommands(handlers);

  if (!supported) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={toggle}
        aria-label={listening ? 'Исклучи гласовни команди' : 'Вклучи гласовни команди'}
        title={listening ? 'Слушам... (клик за стоп)' : 'Гласовни команди (следна/претходна/заклучи/отклучи)'}
        className={`relative p-2.5 rounded-xl border-2 transition-all ${
          listening
            ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-md shadow-rose-100'
            : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'
        }`}
      >
        {listening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        {listening && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
        )}
      </button>
      {listening && lastHeard && (
        <span
          className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[160px] truncate"
          title={lastHeard}
        >
          „{lastHeard}"
        </span>
      )}
    </div>
  );
};

export default VoiceControlButton;
