import { useState } from 'react';
import { Sigma, ChevronDown, ChevronUp } from 'lucide-react';

// Sprint 19 — proširen pickr za matematika.
// Kategorii: Osnovni / Algebra / Geometrija / Trigonometrija / Logika i mnozestva / Grcki / Strelki.
// Templates wrap-aat marker tokens: kursorot se postavuva kade {| |} postoel.
const CATEGORIES = [
  {
    id: 'basic', label: 'Основни',
    items: ['+', '-', '×', '÷', '·', '=', '≠', '≈', '≡', '<', '>', '≤', '≥', '±', '∓', '%', '‰', '°', '′', '″', '∞', '∅'],
  },
  {
    id: 'powers', label: 'Степени и индекси',
    items: ['²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '⁰', 'ⁿ', '₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉', '½', '¼', '¾', '⅓', '⅔', '⅛'],
  },
  {
    id: 'algebra', label: 'Алгебра',
    items: ['√', '∛', '∜', '∑', '∏', '∫', '∮', '∂', '∇', 'Δ', '∝', '∥', '⊥', '!', '⁻¹', '↦', 'lim', 'log', 'ln', 'sin', 'cos', 'tan', 'cot'],
  },
  {
    id: 'geometry', label: 'Геометрија',
    items: ['∠', '∡', '∢', '△', '▱', '◯', '⌒', '∥', '⊥', '≅', '∼', '⊿', '□', '▭', '⌀', '↔', '°'],
  },
  {
    id: 'sets', label: 'Логика и множества',
    items: ['∈', '∉', '∋', '⊂', '⊃', '⊆', '⊇', '∪', '∩', '∖', '∀', '∃', '∄', '¬', '∧', '∨', '⇒', '⇔', 'ℕ', 'ℤ', 'ℚ', 'ℝ', 'ℂ', 'ℙ'],
  },
  {
    id: 'greek', label: 'Грчки',
    items: ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'π', 'ρ', 'σ', 'τ', 'φ', 'χ', 'ψ', 'ω', 'Δ', 'Π', 'Σ', 'Ω', 'Φ', 'Θ'],
  },
  {
    id: 'arrows', label: 'Стрелки и валути',
    items: ['→', '←', '↑', '↓', '↔', '↕', '⇒', '⇐', '⇔', '↦', '⟶', '⟵', '€', '$', '£', '¥', '₪'],
  },
];

// Wrap-templates: '{|' marks the cursor target (selection range).
const TEMPLATES = [
  { label: 'a²', value: '{|}²', hint: 'Степен' },
  { label: 'a^n', value: '{|}ⁿ', hint: 'n-ти степен' },
  { label: '√x', value: '√({|})', hint: 'Корен' },
  { label: 'a/b', value: '({|})/(b)', hint: 'Дропка' },
  { label: 'sin(x)', value: 'sin({|})', hint: 'sin' },
  { label: 'cos(x)', value: 'cos({|})', hint: 'cos' },
  { label: 'log(x)', value: 'log({|})', hint: 'логаритам' },
  { label: '∫f(x)dx', value: '∫{|}dx', hint: 'интеграл' },
  { label: 'Σ', value: '∑(i=1..n) {|}', hint: 'сума' },
  { label: '|x|', value: '|{|}|', hint: 'апс. вредност' },
  { label: '(a,b)', value: '({|}; b)', hint: 'пар' },
];

const MathSymbolPicker = ({ onInsert, compact = false }) => {
  const [activeTab, setActiveTab] = useState(CATEGORIES[0].id);
  const [open, setOpen] = useState(!compact);

  const insert = (token) => {
    if (typeof onInsert === 'function') onInsert(token);
  };

  const active = CATEGORIES.find((c) => c.id === activeTab) || CATEGORIES[0];

  return (
    <div className="space-y-2 bg-slate-50/60 border border-slate-100 rounded-2xl p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-1"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest">
          <Sigma className="w-3.5 h-3.5 text-indigo-500" />
          Математички симболи
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <>
          <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveTab(c.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                  activeTab === c.id
                    ? 'bg-indigo-600 text-white shadow shadow-indigo-100'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {active.items.map((symbol) => (
              <button
                key={symbol}
                type="button"
                onClick={() => insert(symbol)}
                className="min-w-[36px] px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                aria-label={`Вметни симбол ${symbol}`}
              >
                {symbol}
              </button>
            ))}
          </div>

          <div className="pt-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1.5">
              Брзи формули
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => insert(t.value)}
                  title={t.hint}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs hover:bg-indigo-100 transition-all"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MathSymbolPicker;
