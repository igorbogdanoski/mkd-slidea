import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useEvent } from '../hooks/useEvent';
import { supabase } from '../lib/supabase';

const getSessionId = () => {
  let sid = localStorage.getItem('mkd_session_id');
  if (!sid) {
    sid = crypto.randomUUID?.()
      || 'uid-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    localStorage.setItem('mkd_session_id', sid);
  }
  return sid;
};

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const Embed = () => {
  const { id } = useParams();
  const { event, polls, loading, error, vote } = useEvent(id);
  const [isVoting, setIsVoting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [voteError, setVoteError] = useState('');
  const rootRef = useRef(null);

  const brandColor = event?.brand_color || '#6366f1';

  const activePollId = event?.active_poll_id ? String(event.active_poll_id) : null;
  const rawIndex = activePollId
    ? polls.findIndex((p) => String(p.id) === activePollId)
    : 0;
  const activePollIndex = rawIndex >= 0 ? rawIndex : 0;
  const currentPoll = polls[activePollIndex];
  const currentPollId = currentPoll?.id;

  // Reset vote state when poll changes
  useEffect(() => { setVoted(false); setVoteError(''); }, [currentPollId]);

  // Check DB for existing vote on this poll
  useEffect(() => {
    if (!currentPollId) return;
    const sid = getSessionId();
    supabase.from('votes').select('id').eq('poll_id', currentPollId).eq('session_id', sid).single()
      .then(({ data }) => { if (data) setVoted(true); });
  }, [currentPollId]);

  // Auto-resize parent iframe via postMessage — mount-only, observer handles changes
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const resize = () => {
      window.parent.postMessage({ type: 'mkd-slidea-resize', height: el.scrollHeight }, document.referrer ? new URL(document.referrer).origin : '*');
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleVote = async (optionIndex) => {
    if (voted || isVoting || !currentPoll) return;
    setIsVoting(true);
    setVoteError('');
    try {
      const option = currentPoll.options[optionIndex];
      await vote(option.id);
      const sid = getSessionId();
      await supabase.from('votes').upsert(
        { poll_id: currentPoll.id, session_id: sid, answer_text: option.text, is_correct: option.is_correct ?? null },
        { onConflict: 'poll_id,session_id', ignoreDuplicates: true }
      );
      setVoted(true);
    } catch {
      setVoteError('Гласањето не успеа.');
    } finally {
      setIsVoting(false);
    }
  };

  const visibleOptions = currentPoll?.needs_moderation
    ? (currentPoll.options || []).filter(o => o.is_approved !== false)
    : (currentPoll?.options || []);

  const totalVotes = visibleOptions.reduce((s, o) => s + (o.votes || 0), 0);
  const maxVotes = Math.max(...visibleOptions.map(o => o.votes || 0), 1);
  const resultsVisible = currentPoll?.results_visible !== false;

  return (
    <div ref={rootRef} style={{ fontFamily: 'system-ui, sans-serif', background: '#fff', minHeight: 'unset' }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* Brand bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${brandColor}, #8b5cf6)` }} />

      <div style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontWeight: 700, fontSize: 14 }}>
            Се вчитува...
          </div>
        ) : error || !event ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#ef4444', fontWeight: 700, fontSize: 14 }}>
            Настанот не е пронајден.
          </div>
        ) : !currentPoll ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#cbd5e1', fontWeight: 900, fontSize: 14 }}>
            Чекаме домаќинот да активира анкета...
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPoll.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {/* Poll type badge */}
              <div style={{ marginBottom: 12 }}>
                <span style={{
                  display: 'inline-block',
                  padding: '3px 12px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  backgroundColor: brandColor + '18',
                  color: brandColor,
                }}>
                  {currentPoll.is_quiz ? 'Квиз' : currentPoll.type === 'wordcloud' ? 'Облак' : 'Анкета'}
                </span>
              </div>

              {/* Question */}
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', lineHeight: 1.4, marginBottom: 16, whiteSpace: 'pre-line' }}>
                {currentPoll.question}
              </h2>

              {/* Voted state — results */}
              {voted ? (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <CheckCircle size={18} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#10b981' }}>Гласот е забележан!</span>
                  </div>
                  {resultsVisible && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[...visibleOptions]
                        .sort((a, b) => (b.votes || 0) - (a.votes || 0))
                        .map((opt, i) => {
                          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                          const barW = maxVotes > 0 ? Math.round((opt.votes / maxVotes) * 100) : 0;
                          const color = COLORS[i % COLORS.length];
                          return (
                            <div key={opt.id}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{opt.text}</span>
                                <span style={{ fontSize: 13, fontWeight: 900, color }}>{pct}%</span>
                              </div>
                              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999 }}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${barW}%` }}
                                  transition={{ duration: 0.8, ease: 'circOut' }}
                                  style={{ height: '100%', background: color, borderRadius: 999 }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginTop: 4 }}>
                        {totalVotes} {totalVotes === 1 ? 'одговор' : 'одговори'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Voting options */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {visibleOptions.map((opt, i) => (
                    <motion.button
                      key={opt.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleVote(i)}
                      disabled={isVoting}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 14,
                        border: `2px solid ${brandColor}22`,
                        background: `${brandColor}08`,
                        textAlign: 'left',
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#1e293b',
                        cursor: isVoting ? 'wait' : 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = brandColor + '60'; e.currentTarget.style.background = brandColor + '15'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = brandColor + '22'; e.currentTarget.style.background = brandColor + '08'; }}
                    >
                      {opt.text}
                    </motion.button>
                  ))}
                  {voteError && (
                    <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 700 }}>{voteError}</p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Footer branding */}
      <div style={{ padding: '10px 20px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
        <a
          href={`${window.location.origin}/event/${event?.code || ''}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 10, fontWeight: 900, color: '#cbd5e1', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em' }}
        >
          MKD Slidea
        </a>
      </div>
    </div>
  );
};

export default Embed;
