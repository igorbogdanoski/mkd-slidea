import { useEffect, useRef, useState } from 'react';

const POSITIVE = ['❤️', '👍', '🔥', '👏'];
const NEGATIVE = ['😮', '😢', '👎', '😡'];

const sentimentOf = (emoji) => {
  if (POSITIVE.includes(emoji)) return 1;
  if (NEGATIVE.includes(emoji)) return -1;
  return 0;
};

// Persists incoming live reactions into a longer time-series buffer suitable
// for sentiment / energy analysis. Reactions in the live feed disappear after
// ~4s, so we capture them here keyed by id.
export function useSentimentBuffer(reactions, { windowMs = 5 * 60 * 1000, maxEntries = 600 } = {}) {
  const seenRef = useRef(new Set());
  const [buffer, setBuffer] = useState([]);

  useEffect(() => {
    if (!reactions?.length) return;
    const additions = [];
    for (const r of reactions) {
      const key = r.id ?? `${r.emoji}-${r.timestamp}`;
      if (seenRef.current.has(key)) continue;
      seenRef.current.add(key);
      additions.push({
        id: key,
        emoji: r.emoji,
        sentiment: sentimentOf(r.emoji),
        t: r.timestamp || Date.now(),
      });
    }
    if (!additions.length) return;
    setBuffer((prev) => {
      const next = [...prev, ...additions];
      const cutoff = Date.now() - windowMs;
      const trimmed = next.filter((x) => x.t >= cutoff);
      return trimmed.length > maxEntries ? trimmed.slice(-maxEntries) : trimmed;
    });
  }, [reactions, windowMs, maxEntries]);

  // Build per-15s bins for the last `windowMs`
  const bins = [];
  const binMs = 15 * 1000;
  const now = Date.now();
  const start = now - windowMs;
  const totalBins = Math.ceil(windowMs / binMs);
  for (let i = 0; i < totalBins; i += 1) {
    bins.push({ start: start + i * binMs, count: 0, score: 0 });
  }
  for (const e of buffer) {
    const idx = Math.floor((e.t - start) / binMs);
    if (idx >= 0 && idx < bins.length) {
      bins[idx].count += 1;
      bins[idx].score += e.sentiment;
    }
  }

  const recent = bins.slice(-4);
  const recentCount = recent.reduce((a, b) => a + b.count, 0);
  const recentScore = recent.reduce((a, b) => a + b.score, 0);
  const energy =
    recentCount === 0 ? 'idle' : recentCount >= 6 ? 'high' : recentCount >= 2 ? 'medium' : 'low';
  const mood =
    recentScore > 1 ? 'positive' : recentScore < -1 ? 'negative' : 'neutral';

  return { bins, energy, mood, total: buffer.length };
}
