// ─── Trust Banner ─────────────────────────────────────────────────────────────
const TrustBannerSection = ({ setView }) => (
  <section className="bg-slate-900 py-16">
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="space-y-2">
        <h3 className="text-white text-2xl font-black">Подготвени сте да ја подигнете интеракцијата на следно ниво?</h3>
        <p className="text-slate-300 font-bold">Започнете бесплатно, тестирајте со публика во живо и одлучете без ризик.</p>
      </div>
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => { localStorage.removeItem('active_event_code'); setView('host'); }}
          className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-lg hover:bg-slate-100 transition-all active:scale-95"
        >
          Започни бесплатно
        </button>
        <button
          onClick={() => setView('pricing')}
          className="px-10 py-4 bg-transparent border border-white/20 text-white rounded-2xl font-black text-lg hover:bg-white/10 transition-all active:scale-95"
        >
          Погледни цени
        </button>
      </div>
    </div>
  </section>
);

export default TrustBannerSection;
