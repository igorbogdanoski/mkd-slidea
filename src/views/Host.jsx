import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, ArrowLeft, Sparkles, Settings, FileDown, BarChart2, Sheet, Upload, FileText, Mail
} from 'lucide-react';
import QRCodeModal from '../components/QRCodeModal';
import CreatePollModal from '../components/CreatePollModal';
import CreateQuizModal from '../components/CreateQuizModal';
import InteractionTypeGrid from '../components/InteractionTypeGrid';
import AIAssistantModal from '../components/AIAssistantModal';
import AIInsightsModal from '../components/AIInsightsModal';
import ExportPDFModal from '../components/ExportPDFModal';
import ParticipantStatsModal from '../components/ParticipantStatsModal';
import { isPro } from '../lib/plans';
import { verifyProPlan } from '../lib/planCheck';
import HostHeader from '../components/Host/HostHeader';
import EventSettingsModal from '../components/Host/EventSettingsModal';
import HostNavBar from '../components/Host/HostNavBar';
import HostPollList from '../components/Host/HostPollList';
import RemoteController from '../components/Host/RemoteController';
import ImportPPTXModal from '../components/ImportPPTXModal';
import PublishTemplateModal from '../components/PublishTemplateModal';
import TemplateGalleryModal from '../components/TemplateGalleryModal';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useLiveAnnouncer } from '../hooks/useLiveAnnouncer';
import { useHostSession } from '../hooks/useHostSession';
import { STARTER_TEMPLATES } from '../lib/starterTemplates';
import { downloadMarkdown } from '../lib/exportMarkdown';

const Host = ({ setView, user }) => {
  const { announce } = useLiveAnnouncer();
  const navigate = useNavigate();
  const [proCheckPending, setProCheckPending] = useState(false);

  // Server-verifies the caller's real plan before running a Pro-gated action.
  // The "Pro" badge on these buttons is just a hint — this is the actual
  // enforcement point, since the client's local `user.plan` can't be trusted.
  const runIfPro = async (action) => {
    if (proCheckPending) return;
    setProCheckPending(true);
    try {
      const allowed = await verifyProPlan();
      if (allowed) {
        action();
      } else {
        navigate('/pricing');
      }
    } finally {
      setProCheckPending(false);
    }
  };

  // UI-only state — session data lives in useHostSession
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [showInteractionGrid, setShowInteractionGrid] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('poll');
  const [editingPoll, setEditingPoll] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [isRemoteMode, setIsRemoteMode] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isPublishTemplateOpen, setIsPublishTemplateOpen] = useState(false);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);
  const [embedTab, setEmbedTab] = useState('iframe');
  const [embedCopied, setEmbedCopied] = useState(false);

  const session = useHostSession(user);
  const {
    event, setEvent,
    polls,
    loading,
    activePollIndex, setActivePollIndex,
    pendingQuestions,
    timerRemaining,
    recapSending,
    recapSent,
    draggedIndex, setDraggedIndex,
    dragOverIndex, setDragOverIndex,
    pollIndexInitialized,
    adaptiveSuggestion,
    setAllowMultipleVotes,
  } = session;

  // Lives on events.allow_multiple_votes (not localStorage) — participants on
  // other devices need to see it too, not just this host's own browser.
  const allowMultipleVotes = !!event?.allow_multiple_votes;

  const shortcutHandlersRef = useRef({});
  shortcutHandlersRef.current.goNext = session.goNext;
  shortcutHandlersRef.current.goPrev = session.goPrev;

  useKeyboardShortcuts({
    'T': () => setIsTemplateGalleryOpen(true),
    't': () => setIsTemplateGalleryOpen(true),
    'A': () => setIsAIModalOpen(true),
    'a': () => setIsAIModalOpen(true),
    'Q': () => { setSelectedType('quiz'); setIsCreateQuizOpen(true); },
    'q': () => { setSelectedType('quiz'); setIsCreateQuizOpen(true); },
    'P': () => { setSelectedType('poll'); setIsCreatePollOpen(true); },
    'p': () => { setSelectedType('poll'); setIsCreatePollOpen(true); },
    'ArrowRight': () => shortcutHandlersRef.current.goNext?.(),
    'ArrowLeft':  () => shortcutHandlersRef.current.goPrev?.(),
    'Space':      () => shortcutHandlersRef.current.goNext?.(),
  });

  // Honor pending intent from Dashboard empty-state CTAs / onboarding wizard
  useEffect(() => {
    if (loading || !event?.id) return;
    const action = localStorage.getItem('pending_host_action');
    const starterId = localStorage.getItem('pending_starter_template_id');

    if (starterId) {
      localStorage.removeItem('pending_starter_template_id');
      const tpl = STARTER_TEMPLATES.find((t) => t.id === starterId);
      if (tpl) {
        session.applyStarterTemplate(tpl);
        try { localStorage.removeItem('pending_community_template'); } catch { /* ignore */ }
        return;
      }
      try {
        const raw = localStorage.getItem('pending_community_template');
        if (raw) {
          const cTpl = JSON.parse(raw);
          localStorage.removeItem('pending_community_template');
          if (cTpl && Array.isArray(cTpl.polls) && cTpl.polls.length > 0) {
            session.applyStarterTemplate({ title: cTpl.title, polls: cTpl.polls });
            return;
          }
        }
      } catch { /* ignore malformed payload */ }
      return;
    }

    if (!action) return;
    localStorage.removeItem('pending_host_action');
    if (action === 'templates') setIsTemplateGalleryOpen(true);
    else if (action === 'ai') setIsAIModalOpen(true);
    else if (action === 'import') setIsImportOpen(true);
  }, [loading, event?.id]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); session.goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); session.goPrev(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activePollIndex, polls]);

  const handleInteractionSelect = (type) => {
    setSelectedType(type);
    if (type === 'quiz') setIsCreateQuizOpen(true);
    else setIsCreatePollOpen(true);
  };

  const onEditPoll = (poll) => {
    setEditingPoll(poll);
    setSelectedType(poll.type || 'poll');
    if (poll.is_quiz) setIsCreateQuizOpen(true);
    else setIsCreatePollOpen(true);
  };

  if (loading) return <div className="pt-32 text-center font-bold">Се вчитува...</div>;
  if (!event) return <div className="pt-32 text-center font-bold text-red-500">Грешка.</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-6 pt-12 pb-24">
      <QRCodeModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} eventCode={event.code} />

      <EventSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        event={event}
        setEvent={setEvent}
        user={user}
        polls={polls}
        allowMultipleVotes={allowMultipleVotes}
        setAllowMultipleVotes={setAllowMultipleVotes}
        embedTab={embedTab}
        setEmbedTab={setEmbedTab}
        embedCopied={embedCopied}
        setEmbedCopied={setEmbedCopied}
        showPwd={showPwd}
        setShowPwd={setShowPwd}
        resetAllResults={session.resetAllResults}
      />
      <CreatePollModal
        isOpen={isCreatePollOpen}
        onClose={() => { setIsCreatePollOpen(false); setEditingPoll(null); }}
        onSave={async (data) => {
          await session.onSavePoll(data, editingPoll);
          setEditingPoll(null);
          setIsCreatePollOpen(false);
          setIsCreateQuizOpen(false);
          setShowInteractionGrid(false);
        }}
        type={selectedType}
        initialData={editingPoll}
      />
      <CreateQuizModal
        isOpen={isCreateQuizOpen}
        onClose={() => { setIsCreateQuizOpen(false); setEditingPoll(null); }}
        onSave={async (data) => {
          await session.onSavePoll(data, editingPoll);
          setEditingPoll(null);
          setIsCreatePollOpen(false);
          setIsCreateQuizOpen(false);
          setShowInteractionGrid(false);
        }}
        initialData={editingPoll}
      />
      <AIAssistantModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onGenerate={(data) => session.onSavePoll(data, null)}
        user={user}
        adaptiveSuggestion={adaptiveSuggestion}
      />
      <AIInsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        event={event}
        polls={polls}
      />
      <ExportPDFModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        event={event}
        polls={polls}
      />
      <ParticipantStatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        event={event}
        polls={polls}
      />
      <ImportPPTXModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={session.handlePPTXImport}
      />
      <PublishTemplateModal
        isOpen={isPublishTemplateOpen}
        onClose={() => setIsPublishTemplateOpen(false)}
        onPublish={session.publishTemplate}
        polls={polls}
      />
      <TemplateGalleryModal
        isOpen={isTemplateGalleryOpen}
        onClose={() => setIsTemplateGalleryOpen(false)}
        onApply={async (tpl) => {
          await session.applyStarterTemplate(tpl);
          setIsTemplateGalleryOpen(false);
        }}
      />

      <HostHeader event={event} setIsQRModalOpen={setIsQRModalOpen} setView={setView} isRemoteMode={isRemoteMode} setIsRemoteMode={setIsRemoteMode} />
      {isRemoteMode && (
        <RemoteController
          polls={polls}
          activePollIndex={activePollIndex}
          setActivePoll={session.setActivePoll}
          eventCode={event.code}
          event={event}
          onToggleLock={async () => {
            const next = await session.toggleLock();
            announce(next ? 'Гласањето е заклучено.' : 'Гласањето е отклучено.', { assertive: true });
          }}
          onReset={session.resetAllResults}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12">
          <AnimatePresence mode="wait">
            {showInteractionGrid ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowInteractionGrid(false)}
                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" /> Назад кон активностите
                  </button>
                  <h3 className="text-2xl font-black">Избери тип на активност</h3>
                  <div className="w-24" />
                </div>
                <InteractionTypeGrid onSelect={handleInteractionSelect} />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"
              >
                <div className="p-8 md:p-12">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                    <div>
                      <h3 className="text-3xl font-black mb-2">Сите активности</h3>
                      <p className="text-slate-400 font-bold">Управувај со прашањата за твојата публика.</p>
                    </div>
                    <div className="flex flex-wrap gap-4 justify-end">
                      <button
                        onClick={() => setShowInteractionGrid(true)}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                      >
                        <Plus className="w-6 h-6" /> Додај активност
                      </button>
                      <button
                        onClick={() => setIsAIModalOpen(true)}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black text-lg hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                      >
                        <Sparkles className="w-6 h-6 text-indigo-600" /> Креирај со AI
                      </button>
                      <button
                        onClick={() => setIsImportOpen(true)}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black text-lg hover:border-violet-600 hover:text-violet-600 transition-all shadow-sm active:scale-95"
                      >
                        <Upload className="w-6 h-6 text-violet-600" /> Увези PPTX
                      </button>
                      <button
                        onClick={() => setIsTemplateGalleryOpen(true)}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black text-lg hover:border-amber-500 hover:text-amber-600 transition-all shadow-sm active:scale-95"
                        title="Избери од 20 готови шаблони"
                      >
                        <Sparkles className="w-6 h-6 text-amber-500" /> Шаблони
                      </button>
                      {polls.length > 0 && (
                        <button
                          onClick={() => setIsPublishTemplateOpen(true)}
                          className="flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black text-lg hover:border-emerald-600 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
                          title="Објави како Community Template"
                        >
                          <Upload className="w-6 h-6 text-emerald-600" /> Објави шаблон
                        </button>
                      )}
                      {polls.length > 0 && (
                        <>
                          <button
                            onClick={() => setIsStatsOpen(true)}
                            className="flex items-center justify-center gap-2 px-5 py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-black hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                            title="Статистики по учесник"
                            aria-label="Статистики по учесник"
                          >
                            <BarChart2 className="w-5 h-5" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => runIfPro(session.exportToCSV)}
                              disabled={proCheckPending}
                              className="flex items-center justify-center gap-2 px-5 py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-black hover:border-emerald-200 hover:text-emerald-600 transition-all shadow-sm active:scale-95 disabled:opacity-60"
                              title="Извоз CSV/Excel"
                              aria-label="Извоз во CSV / Excel"
                            >
                              <Sheet className="w-5 h-5" />
                            </button>
                            {!isPro(user) && <span className="absolute -top-2 -right-2 bg-amber-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide pointer-events-none">Pro</span>}
                          </div>
                          <div className="relative">
                            <button
                              onClick={() => runIfPro(() => setIsExportOpen(true))}
                              disabled={proCheckPending}
                              className="flex items-center justify-center gap-2 px-5 py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-black hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm active:scale-95 disabled:opacity-60"
                              title="Извоз PDF"
                              aria-label="Извоз во PDF"
                            >
                              <FileDown className="w-5 h-5" />
                            </button>
                            {!isPro(user) && <span className="absolute -top-2 -right-2 bg-amber-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide pointer-events-none">Pro</span>}
                          </div>
                          <button
                            onClick={() => downloadMarkdown(event, polls)}
                            className="flex items-center justify-center gap-2 px-5 py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-black hover:border-slate-300 hover:text-slate-700 transition-all shadow-sm active:scale-95"
                            title="Извоз во Markdown"
                            aria-label="Извоз во Markdown"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => runIfPro(() => setIsInsightsOpen(true))}
                              disabled={proCheckPending}
                              className="flex items-center justify-center gap-2 px-5 py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-black hover:border-violet-200 hover:text-violet-600 transition-all shadow-sm active:scale-95 disabled:opacity-60"
                              title="AI Insights по час"
                              aria-label="AI Insights — анализа по час"
                            >
                              <Sparkles className="w-5 h-5" />
                            </button>
                            {!isPro(user) && <span className="absolute -top-2 -right-2 bg-amber-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide pointer-events-none">Pro</span>}
                          </div>
                          <button
                            onClick={session.sendSessionRecap}
                            disabled={recapSending || recapSent}
                            className={`flex items-center justify-center gap-2 px-5 py-4 border-2 rounded-2xl font-black transition-all shadow-sm active:scale-95 ${recapSent ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'} disabled:opacity-60 disabled:cursor-not-allowed`}
                            title={recapSent ? 'Рекапот е испратен на е-маил' : 'Прати AI рекап на е-маил'}
                            aria-label="Прати AI рекап по е-маил"
                          >
                            {recapSending ? (
                              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Mail className="w-5 h-5" />
                            )}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center justify-center gap-2 px-5 py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-black hover:border-slate-300 hover:text-slate-700 transition-all shadow-sm active:scale-95"
                        title="Поставки"
                        aria-label="Отвори поставки на настан"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {polls.length === 0 ? (
                      <div className="p-24 text-center bg-slate-50/50 rounded-[2.5rem] border-4 border-dashed border-slate-100">
                        <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <Plus className="w-10 h-10 text-slate-200" />
                        </div>
                        <h4 className="text-xl font-black text-slate-400 mb-2">Сè уште немате активности</h4>
                        <p className="text-slate-300 font-bold mb-8">Започнете со додавање на првата интеракција за вашата публика.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <button
                            onClick={() => setShowInteractionGrid(true)}
                            className="px-8 py-3 bg-white border-2 border-slate-100 text-slate-400 rounded-xl font-black hover:border-indigo-600 hover:text-indigo-600 transition-all"
                          >
                            Започни рачно
                          </button>
                          <button
                            onClick={() => setIsAIModalOpen(true)}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                          >
                            <Sparkles className="w-5 h-5" /> Креирај со AI
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <HostNavBar
                          activePollIndex={activePollIndex}
                          polls={polls}
                          goNext={session.goNext}
                          goPrev={session.goPrev}
                          timerRemaining={timerRemaining}
                          startTimer={session.startTimer}
                          stopTimer={session.stopTimer}
                          event={event}
                          toggleLock={session.toggleLock}
                          onEndSession={async () => {
                            if (!window.confirm('Заврши ја сесијата? Учесниците ќе видат „Сесијата е завршена" и нема да можат да гласаат.')) return;
                            await session.endSession();
                            setIsStatsOpen(true);
                            announce('Сесијата е завршена.', { assertive: true });
                          }}
                        />
                        <HostPollList
                          polls={polls}
                          activePollIndex={activePollIndex}
                          setActivePoll={session.setActivePoll}
                          onEdit={onEditPoll}
                          onDelete={session.onDeletePoll}
                          onDuplicate={session.onDuplicatePoll}
                          onPollUpdated={session.refreshPolls}
                          draggedIndex={draggedIndex}
                          setDraggedIndex={setDraggedIndex}
                          dragOverIndex={dragOverIndex}
                          setDragOverIndex={setDragOverIndex}
                          handleDrop={session.handleDrop}
                          pendingQuestions={pendingQuestions}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Host;
