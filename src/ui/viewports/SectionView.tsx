import React, { useEffect } from 'react';
import { useScene } from '../../context/useScene';
import { ViewCard } from './ViewCard';

interface SectionViewProps {
  className?: string;
}

export const SectionView: React.FC<SectionViewProps> = ({
  className,
}) => {
  const { engine, sectionCamera, sectionCanvasRef } = useScene();

  useEffect(() => {
    if (!engine || !sectionCamera || !sectionCanvasRef.current) return;
    const canvas = sectionCanvasRef.current;
    engine.registerView(canvas, sectionCamera);

    const handleResize = () => {
      engine.resize();

      if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
        const ratio = canvas.clientWidth / canvas.clientHeight;
        const height = sectionCamera.orthoTop! - sectionCamera.orthoBottom!;
        const halfHeight = height / 2;

        sectionCamera.orthoLeft = -halfHeight * ratio;
        sectionCamera.orthoRight = halfHeight * ratio;
      }
    };

    const obs = new ResizeObserver(handleResize);
    obs.observe(canvas);
    setTimeout(handleResize, 50);

    return () => {
      obs.disconnect();
      if (engine) engine.unRegisterView(canvas);
    };
  }, [engine, sectionCamera]);

  return (
    <div className={`${className} p-3`}>
      <ViewCard title="Section View" subtitle="Elevation" position="right" showStatus={false}>
        <canvas
          ref={sectionCanvasRef}
          className="w-full h-full block outline-none touch-none cursor-grab active:cursor-grabbing"
          onContextMenu={(e) => e.preventDefault()}
          tabIndex={0}
        />

        {/* Interaction Hint Overlay - Added z-20 to fix disappearance */}
        <div className="absolute bottom-4 left-4 pointer-events-none select-none z-20">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 backdrop-blur-[2px] border border-white/10 rounded-full shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
             <svg className="w-3 h-3 text-blue-400 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
             </svg>
             <span className="text-[10px] font-medium text-slate-300/90 tracking-wide">
               Double-click gizmos to edit
             </span>
          </div>
        </div>

      </ViewCard>
    </div>
  );
};
