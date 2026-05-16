import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Pen, Eraser, Trash2, X, Minus, Plus } from 'lucide-react';

const COLORS = [
  { hex: '#ef4444', label: 'Црвена' },
  { hex: '#f59e0b', label: 'Жолта' },
  { hex: '#10b981', label: 'Зелена' },
  { hex: '#6366f1', label: 'Виолетова' },
  { hex: '#ffffff', label: 'Бела' },
];

export default function DrawingCanvas({ active, onClose }) {
  const canvasRef = useRef(null);
  const ctxRef    = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef(null);

  const [tool,  setTool]  = useState('pen');
  const [color, setColor] = useState('#ef4444');
  const [size,  setSize]  = useState(4);

  // Resize canvas to match window
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imgData = ctxRef.current?.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineCap   = 'round';
    ctx.lineJoin  = 'round';
    ctxRef.current = ctx;
    if (imgData) ctx.putImageData(imgData, 0, 0);
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [resize]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const src    = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const startDraw = useCallback((e) => {
    if (!active) return;
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e);
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.arc(lastPos.current.x, lastPos.current.y, (tool === 'eraser' ? size * 4 : size) / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : color;
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.fill();
    }
  }, [active, tool, color, size]);

  const draw = useCallback((e) => {
    if (!drawing.current || !active) return;
    e.preventDefault();
    const ctx = ctxRef.current;
    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth   = size * 4;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth   = size;
    }
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  }, [active, tool, color, size]);

  const endDraw = useCallback(() => {
    drawing.current = false;
    lastPos.current = null;
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    ctxRef.current?.clearRect(0, 0, canvas.width, canvas.height);
  };

  if (!active) return null;

  return (
    <>
      {/* Full-screen canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-40"
        style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none' }}
        onPointerDown={startDraw}
        onPointerMove={draw}
        onPointerUp={endDraw}
        onPointerLeave={endDraw}
      />

      {/* Floating toolbar */}
      <div
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-2xl"
        style={{ background: 'rgba(15,10,40,0.92)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}
        onPointerDown={e => e.stopPropagation()}
      >
        {/* Tool buttons */}
        <button
          onClick={() => setTool('pen')}
          className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all ${tool === 'pen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          title="Пенкало (P)"
        >
          <Pen className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all ${tool === 'eraser' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          title="Гума (E)"
        >
          <Eraser className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Colors */}
        {COLORS.map(c => (
          <button
            key={c.hex}
            onClick={() => { setColor(c.hex); setTool('pen'); }}
            title={c.label}
            className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
            style={{
              background: c.hex,
              borderColor: color === c.hex && tool === 'pen' ? '#fff' : 'transparent',
              boxShadow: color === c.hex && tool === 'pen' ? `0 0 0 2px ${c.hex}` : 'none',
            }}
          />
        ))}

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Size */}
        <button
          onClick={() => setSize(s => Math.max(2, s - 2))}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <Minus className="w-3 h-3" />
        </button>
        <div className="flex items-center justify-center w-6">
          <div className="rounded-full bg-white" style={{ width: Math.min(size * 2.5, 20), height: Math.min(size * 2.5, 20) }} />
        </div>
        <button
          onClick={() => setSize(s => Math.min(20, s + 2))}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <Plus className="w-3 h-3" />
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Clear */}
        <button
          onClick={clearCanvas}
          className="flex items-center justify-center w-9 h-9 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
          title="Исчисти сè"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          title="Затвори цртање (D)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode indicator */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full text-xs font-bold"
        style={{ background: 'rgba(99,102,241,0.9)', color: '#fff' }}>
        ✏️ Режим на цртање — притисни D за излез
      </div>
    </>
  );
}
