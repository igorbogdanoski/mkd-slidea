import React from 'react';
import { ShieldCheck, Check, Trash2, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import SlideThumbnailStrip from '../SlideThumbnailStrip';
import PollCard from './PollCard';

const HostPollList = ({
  polls,
  activePollIndex,
  setActivePoll,
  onEdit,
  onDelete,
  onDuplicate,
  onPollUpdated,
  draggedIndex,
  setDraggedIndex,
  dragOverIndex,
  setDragOverIndex,
  handleDrop,
  pendingQuestions,
}) => {
  const activePoll = polls[activePollIndex];
  const pendingOptions = activePoll?.needs_moderation
    ? (activePoll.options || []).filter(o => o.is_approved === false)
    : [];

  return (
    <div className="space-y-4">
      {/* Moderation queue */}
      {pendingOptions.length > 0 && (
        <div className="bg-violet-50 border-2 border-violet-200 rounded-[2rem] p-6 mb-2">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-violet-600" />
            <span className="font-black text-violet-700 uppercase tracking-widest text-xs">Чекаат одобрување ({pendingOptions.length})</span>
          </div>
          <div className="space-y-2">
            {pendingOptions.map(opt => (
              <div key={opt.id} className="flex items-center justify-between bg-white rounded-2xl px-5 py-3 border border-violet-100">
                <span className="font-bold text-slate-700">{opt.text}</span>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await supabase.from('options').update({ is_approved: true }).eq('id', opt.id);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs transition-all"
                  >
                    <Check size={14} /> Одобри
                  </button>
                  <button
                    onClick={async () => {
                      await supabase.from('options').delete().eq('id', opt.id);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-black text-xs transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Q&A moderation queue */}
      {pendingQuestions.length > 0 && (
        <div className="bg-sky-50 border-2 border-sky-200 rounded-[2rem] p-6 mb-2">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-sky-600" />
            <span className="font-black text-sky-700 uppercase tracking-widest text-xs">Прашања — чекаат одобрување ({pendingQuestions.length})</span>
          </div>
          <div className="space-y-2">
            {pendingQuestions.map(q => (
              <div key={q.id} className="flex items-start justify-between bg-white rounded-2xl px-5 py-3 border border-sky-100 gap-4">
                <div>
                  <p className="font-bold text-slate-700">{q.text}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{q.author}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={async () => {
                      await supabase.from('questions').update({ is_approved: true }).eq('id', q.id);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs transition-all"
                  >
                    <Check size={14} /> Одобри
                  </button>
                  <button
                    onClick={async () => {
                      await supabase.from('questions').delete().eq('id', q.id);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-black text-xs transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {polls.length > 1 && (
        <SlideThumbnailStrip
          polls={polls}
          activePollIndex={activePollIndex}
          onSelect={setActivePoll}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {polls.map((poll, index) => (
          <div
            key={poll.id}
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
            onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }}
            onDrop={() => handleDrop(index)}
            className={`transition-all ${dragOverIndex === index && draggedIndex !== index ? 'scale-[1.02] ring-2 ring-indigo-400 ring-offset-2 rounded-xl' : ''} ${draggedIndex === index ? 'opacity-40' : ''}`}
          >
            <PollCard
              poll={poll}
              index={index}
              activePollIndex={activePollIndex}
              setActivePoll={setActivePoll}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onPollUpdated={onPollUpdated}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HostPollList;
