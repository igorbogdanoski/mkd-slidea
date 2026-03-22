import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

// Macedonian + common stop-words (case-insensitive)
const STOP_WORDS = new Set([
  'и','на','во','за','со','од','до','но','да','е','се','го','ја','ги','им','му',
  'не','ќе','дека','кога','ако','а','или','оти','па','та','тоа','тој','таа','тие',
  'ние','вие','јас','ти','овде','таму','сега','уште','веќе','многу','малку','исто',
  'само','така','овој','оваа','ова','оној','онаа','она','кој','која','кое','кои',
  'без','над','под','пред','после','меѓу','преку','при','против','зад','крај',
  'покрај','how','the','is','are','was','and','for','that','this','with','have',
  'will','from','they','what','about','which','when','there','their','can',
]);

// Vibrant color palette — indigo/violet/emerald/amber/rose
const COLORS = [
  '#6366f1', '#8b5cf6', '#a78bfa',
  '#10b981', '#34d399',
  '#f59e0b', '#fbbf24',
  '#ef4444', '#f472b6',
  '#06b6d4', '#38bdf8',
];

const WordCloud = ({ words }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!words || words.length === 0) return;

    // Merge case-insensitive duplicates, filter stop-words
    const merged = new Map();
    for (const w of words) {
      if (!w.text || w.votes <= 0) continue;
      const key = w.text.trim().toLowerCase();
      if (STOP_WORDS.has(key) || key.length < 2) continue;
      if (merged.has(key)) {
        merged.get(key).votes += w.votes;
      } else {
        merged.set(key, { text: w.text.trim(), votes: w.votes });
      }
    }

    const data = Array.from(merged.values()).map(w => ({
      text: w.text,
      size: Math.max(22, Math.min(10 + w.votes * 18, 110)),
    }));

    if (data.length === 0) return;

    const container = svgRef.current?.parentElement;
    const width = container ? Math.min(container.clientWidth || 900, 900) : 900;
    const height = Math.round(width * 0.58);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const layout = cloud()
      .size([width, height])
      .words(data)
      .padding(12)
      .rotate(() => (Math.random() > 0.75 ? 90 : 0))
      .fontSize(d => d.size)
      .on('end', draw);

    layout.start();

    function draw(placedWords) {
      const g = svg
        .attr('viewBox', `0 0 ${width} ${height}`)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

      g.selectAll('text')
        .data(placedWords)
        .enter()
        .append('text')
        .style('font-size', '1px')
        .style('font-family', '"Inter", "Segoe UI", system-ui, sans-serif')
        .style('font-weight', '900')
        .style('fill', () => COLORS[Math.floor(Math.random() * COLORS.length)])
        .style('cursor', 'default')
        .style('user-select', 'none')
        .attr('text-anchor', 'middle')
        .attr('transform', d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
        .text(d => d.text)
        // Fade + grow in
        .transition()
        .duration(600)
        .delay((_, i) => i * 40)
        .ease(d3.easeCubicOut)
        .style('font-size', d => `${d.size}px`);
    }
  }, [words]);

  const hasWords = words && words.some(w => w.votes > 0);

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-800/20 rounded-[4rem] border border-slate-700/50 p-8 min-h-[400px]">
      {hasWords ? (
        <svg
          ref={svgRef}
          className="w-full h-full max-h-[560px]"
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        <div className="text-center text-slate-500">
          <div className="text-6xl mb-4">☁️</div>
          <p className="font-black text-2xl">Чекаме одговори...</p>
          <p className="text-slate-600 font-bold mt-2">Зборовите ќе се pojавaт овде во живо</p>
        </div>
      )}
    </div>
  );
};

export default WordCloud;
