import React from 'react';

const AnimatedBackground = ({ color = '#6366F1', variant = 'aurora' }) => {
  if (variant === 'none') return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
      <style>{`
        @keyframes slidea-blob {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(8vw, -6vh) scale(1.15); }
          66%  { transform: translate(-6vw, 8vh) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes slidea-grid-pan {
          from { background-position: 0 0; }
          to   { background-position: 80px 80px; }
        }
        .slidea-blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(70px);
          opacity: 0.45;
          will-change: transform;
          animation: slidea-blob 18s ease-in-out infinite;
        }
        .slidea-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 80px 80px;
          animation: slidea-grid-pan 22s linear infinite;
          mask-image: radial-gradient(ellipse at center, black 35%, transparent 75%);
        }
        @media (prefers-reduced-motion: reduce) {
          .slidea-blob, .slidea-grid { animation: none; }
        }
      `}</style>

      {variant === 'aurora' && (
        <>
          <div className="slidea-blob" style={{ top: '-10%', left: '-5%', width: '55vw', height: '55vw', background: color }} />
          <div className="slidea-blob" style={{ bottom: '-15%', right: '-10%', width: '60vw', height: '60vw', background: '#8B5CF6', animationDelay: '-6s' }} />
          <div className="slidea-blob" style={{ top: '30%', right: '20%', width: '35vw', height: '35vw', background: '#EC4899', animationDelay: '-12s', opacity: 0.25 }} />
        </>
      )}

      {variant === 'grid' && <div className="slidea-grid" />}

      {variant === 'mesh' && (
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 20% 25%, ${color}55 0px, transparent 45%),
              radial-gradient(at 80% 30%, #8B5CF655 0px, transparent 45%),
              radial-gradient(at 50% 80%, #EC489955 0px, transparent 50%)
            `,
          }}
        />
      )}
    </div>
  );
};

export default AnimatedBackground;
