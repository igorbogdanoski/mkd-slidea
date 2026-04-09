import React, { useMemo, useState } from 'react';
import { X, UploadCloud } from 'lucide-react';

const PublishTemplateModal = ({ isOpen, onClose, onPublish, polls = [] }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Community');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canPublish = useMemo(() => {
    return title.trim().length >= 3 && polls.length > 0;
  }, [title, polls.length]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canPublish || submitting) return;
    setSubmitting(true);
    try {
      await onPublish({
        title: title.trim(),
        category: category.trim() || 'Community',
        description: description.trim(),
      });
      setTitle('');
      setCategory('Community');
      setDescription('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Објави како Community Template</h3>
            <p className="text-slate-500 font-bold text-sm mt-1">Овој шаблон ќе биде видлив за други наставници.</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Име на шаблон</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Пр. Квиз: Физика - 7 одд"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none font-semibold"
                required
                minLength={3}
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Категорија</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Education"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Опис (опционално)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Краток опис за цел/возраст/теми"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none font-semibold resize-none"
            />
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-600 font-semibold">
            Ќе се објават {polls.length} активности од тековниот настан.
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-black hover:bg-slate-50 transition-colors"
            >
              Откажи
            </button>
            <button
              type="submit"
              disabled={!canPublish || submitting}
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              {submitting ? 'Објавувам...' : 'Објави'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublishTemplateModal;
