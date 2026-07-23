import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Floating reactions overlay + cumulative counter ──────────────────────────
const FloatingReactions = ({ reactions }) => {
  // ── Reaction meta — stable random values per reaction id ─────────────
  const reactionMetaRef = useRef({});
  const getReactionMeta = (id) => {
    if (!reactionMetaRef.current[id]) {
      const keys = Object.keys(reactionMetaRef.current);
      if (keys.length > 500) delete reactionMetaRef.current[keys[0]];
      reactionMetaRef.current[id] = {
        xPct:    8  + Math.random() * 80,
        drift:   (Math.random() - 0.5) * 180,
        rot:     (Math.random() - 0.5) * 52,
        scale:   1.4 + Math.random() * 1.1,
        sizePx:  54 + Math.floor(Math.random() * 38),
      };
    }
    return reactionMetaRef.current[id];
  };

  // ── Cumulative reaction counter (persists while reactions auto-expire) ─
  const seenReactionIds = useRef(new Set());
  const [totalReactions, setTotalReactions] = useState(0);
  useEffect(() => {
    let added = 0;
    for (const r of reactions) {
      if (!seenReactionIds.current.has(r.id)) {
        seenReactionIds.current.add(r.id);
        added++;
      }
    }
    if (added > 0) setTotalReactions(t => t + added);
  }, [reactions]);

  return (
    <>
      {/* ── Floating Reactions — world-class ──────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {reactions.map(r => {
            const m = getReactionMeta(r.id);
            return (
              <motion.div
                key={r.id}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: `${m.xPct}%`,
                  fontSize: `${m.sizePx}px`,
                  filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.40)) drop-shadow(0 0 8px rgba(255,255,255,0.20))',
                  willChange: 'transform, opacity',
                  lineHeight: 1,
                }}
                initial={{ y: 0, x: 0, opacity: 0, scale: 0.15, rotate: 0 }}
                animate={{
                  y:       [0,   -90,  -280, -540, -920],
                  x:       [0,   m.drift * 0.25, m.drift, m.drift * 0.65, m.drift * 0.2],
                  opacity: [0,    1,    1,    0.85,  0],
                  scale:   [0.15, 1,    m.scale, m.scale * 0.9, 0.35],
                  rotate:  [0,    m.rot * 0.35, m.rot, m.rot * 0.55, 0],
                }}
                transition={{
                  duration: 5,
                  ease: 'easeOut',
                  times: [0, 0.10, 0.35, 0.70, 1],
                }}
              >
                {r.emoji}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Cumulative reaction counter badge ─────────────────────────── */}
      <AnimatePresence>
        {totalReactions > 0 && (
          <motion.div
            key="reaction-counter"
            initial={{ opacity: 0, scale: 0.7, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute bottom-8 right-8 z-[60] pointer-events-none
              flex items-center gap-2.5
              bg-black/40 backdrop-blur-2xl
              px-5 py-2.5 rounded-[2rem]
              border border-white/15
              shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
          >
            <span className="text-2xl leading-none">💬</span>
            <motion.span
              key={totalReactions}
              initial={{ scale: 1.6, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 700, damping: 22 }}
              className="text-white font-black text-xl tabular-nums"
            >
              {totalReactions}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingReactions;
