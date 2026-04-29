import React from 'react';

// Viral badge shown on participant-facing surfaces (Free plan).
// Clickable link drives organic acquisition.
export default function PoweredByBadge({ code, variant = 'light', utm = 'badge' }) {
  const href = `https://slidea.mismath.net/?utm_source=event&utm_medium=${encodeURIComponent(utm)}`;
  const isDark = variant === 'dark';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
        isDark
          ? 'text-slate-500 hover:text-indigo-300'
          : 'text-slate-400 hover:text-indigo-600'
      }`}
      aria-label="Powered by MKD Slidea"
    >
      {code && <span className="opacity-60">#{code} ·</span>}
      <span>Powered by</span>
      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>MKD <span className="text-indigo-500">Slidea</span></span>
    </a>
  );
}
