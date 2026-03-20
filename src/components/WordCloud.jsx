import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

const WordCloud = ({ words, width = 600, height = 400 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!words || words.length === 0) return;

    // Clear existing
    d3.select(svgRef.current).selectAll("*").remove();

    const layout = cloud()
      .size([width, height])
      .words(words.map(d => ({ text: d.text, size: 10 + d.value * 15 })))
      .padding(5)
      .rotate(() => (~~(Math.random() * 6) - 3) * 30)
      .font("Inter")
      .fontSize(d => d.size)
      .on("end", draw);

    layout.start();

    function draw(words) {
      d3.select(svgRef.current)
        .attr("width", layout.size()[0])
        .attr("height", layout.size()[1])
        .append("g")
        .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
        .selectAll("text")
        .data(words)
        .enter().append("text")
        .style("font-size", d => d.size + "px")
        .style("font-family", "Inter")
        .style("font-weight", "900")
        .style("fill", () => d3.schemeTableau10[Math.floor(Math.random() * 10)])
        .attr("text-anchor", "middle")
        .attr("transform", d => "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")")
        .text(d => d.text)
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);
    }
  }, [words, width, height]);

  return (
    <div className="flex justify-center items-center bg-white/50 backdrop-blur-sm rounded-[3rem] p-8 border border-slate-100 shadow-xl">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default WordCloud;
