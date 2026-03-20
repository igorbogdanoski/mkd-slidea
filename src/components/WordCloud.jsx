import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

const WordCloud = ({ words }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!words || words.length === 0) return;

    // Filter out words with no text or 0 votes
    const data = words
      .filter(w => w.text && w.votes > 0)
      .map(w => ({ text: w.text, size: 10 + w.votes * 15 }));

    const width = 800;
    const height = 500;

    d3.select(svgRef.current).selectAll("*").remove();

    const layout = cloud()
      .size([width, height])
      .words(data)
      .padding(10)
      .rotate(() => (~~(Math.random() * 2) * 90))
      .fontSize(d => d.size)
      .on("end", draw);

    layout.start();

    function draw(words) {
      const svg = d3.select(svgRef.current)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

      svg.selectAll("text")
        .data(words)
        .enter().append("text")
        .style("font-size", d => `${d.size}px`)
        .style("font-family", "Black Ops One, system-ui")
        .style("font-weight", "900")
        .style("fill", () => d3.schemeTableau10[Math.floor(Math.random() * 10)])
        .attr("text-anchor", "middle")
        .attr("transform", d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
        .text(d => d.text);
    }
  }, [words]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-800/20 rounded-[4rem] border border-slate-700/50 p-8">
      <svg ref={svgRef} className="w-full h-full max-h-[600px]" preserveAspectRatio="xMidYMid meet" />
    </div>
  );
};

export default WordCloud;
