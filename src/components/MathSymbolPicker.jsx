import React from 'react';

const SYMBOLS = ['+', '-', '×', '÷', '=', '≠', '<', '>', '≤', '≥', '±', '∞', 'π', '√', '∑', '∆', '∫', '≈', '°', '²', '³', 'α', 'β', 'γ', 'θ'];

const MathSymbolPicker = ({ onInsert }) => {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {SYMBOLS.map((symbol) => (
          <button
            key={symbol}
            type="button"
            onClick={() => onInsert(symbol)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
            aria-label={`Вметни симбол ${symbol}`}
          >
            {symbol}
          </button>
        ))}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
        Брз внес за математички симболи и формули
      </p>
    </div>
  );
};

export default MathSymbolPicker;