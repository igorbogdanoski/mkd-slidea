import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Zap } from 'lucide-react';

// ─── Top header: logo/title/QR/code/timer (presentational) ────────────────────
const PresenterHeader = ({ event, eventCode, joinUrl, brandColor, logoUrl, subtitle, timerRemaining }) => (
  <div className="flex items-center justify-between mb-16">
    <div className="flex items-center gap-6">
      {logoUrl ? (
        <img src={logoUrl} alt="Лого" loading="lazy" className="h-16 w-auto max-w-[180px] object-contain" />
      ) : (
        <div className="p-4 rounded-3xl shadow-2xl" style={{ backgroundColor: brandColor }}>
          <Zap className="w-10 h-10 text-white fill-white" />
        </div>
      )}
      <div>
        {logoUrl ? (
          <h1 className="text-4xl font-black tracking-tight text-white">
            {event?.title || 'MKD Slidea'}
          </h1>
        ) : (
          <h1 className="text-4xl font-black tracking-tight">
            MKD <span style={{ color: brandColor }}>Slidea</span>
          </h1>
        )}
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">{subtitle}</p>
      </div>
    </div>

    <div className="flex items-center gap-10">
      <div className="text-right">
        <p className="text-slate-500 font-black text-sm uppercase tracking-widest mb-1">Приклучи се на</p>
        <p className="text-3xl font-black" style={{ color: brandColor }}>{window.location.host}</p>
      </div>
      <div className="bg-white p-3 rounded-3xl shadow-2xl border-4 border-slate-800">
        <QRCodeSVG value={joinUrl} size={100} fgColor={brandColor} />
      </div>
      <div className="bg-slate-800 px-8 py-5 rounded-[2rem] border border-slate-700">
        <p className="text-slate-500 font-black text-xs uppercase tracking-widest mb-1 text-center">Код за влезот</p>
        <p className="text-5xl font-black tracking-widest text-white">{eventCode}</p>
      </div>
      {timerRemaining > 0 && (
        <div
          className={`px-8 py-5 rounded-[2rem] border flex flex-col items-center min-w-[120px] ${timerRemaining <= 10 ? 'bg-red-600 border-red-500 animate-pulse' : ''}`}
          style={timerRemaining > 10 ? { backgroundColor: brandColor + '33', borderColor: brandColor + '66' } : {}}
        >
          <p className="font-black text-xs uppercase tracking-widest mb-1 text-white/60">Тајмер</p>
          <p className="text-5xl font-black tabular-nums text-white">
            {String(Math.floor(timerRemaining / 60)).padStart(2,'0')}:{String(timerRemaining % 60).padStart(2,'0')}
          </p>
        </div>
      )}
    </div>
  </div>
);

export default PresenterHeader;
