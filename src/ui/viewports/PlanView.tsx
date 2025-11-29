import React, { useEffect } from 'react';
import { useScene } from '../../context/useScene';
import { ViewCard } from './ViewCard';

interface PlanViewProps {
  className?: string;
  interactionMode?: 'select' | 'place-flat' | 'place-gable';
  onSetInteractionMode?: (mode: 'select' | 'place-flat' | 'place-gable') => void;
  isSettingsOpen?: boolean;
  onToggleSettings?: () => void;
  settingsPanel?: React.ReactNode;
  propertiesPanel?: React.ReactNode;
}

export const PlanView: React.FC<PlanViewProps> = ({
  className,
  interactionMode = 'select',
  onSetInteractionMode,
  isSettingsOpen = false,
  onToggleSettings,
  settingsPanel,
  propertiesPanel
}) => {
  const { engine, planCamera, planCanvasRef } = useScene();

  useEffect(() => {
    if (!engine || !planCamera || !planCanvasRef.current) return;
    const canvas = planCanvasRef.current;
    engine.registerView(canvas, planCamera);

    const handleResize = () => {
        engine.resize();
        if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
            const ratio = canvas.clientWidth / canvas.clientHeight;
            const height = planCamera.orthoTop! - planCamera.orthoBottom!;
            const halfHeight = height / 2;
            planCamera.orthoLeft = -halfHeight * ratio;
            planCamera.orthoRight = halfHeight * ratio;
        }
    };

    const obs = new ResizeObserver(handleResize);
    obs.observe(canvas);
    setTimeout(handleResize, 50);

    return () => {
      obs.disconnect();
      if (engine) engine.unRegisterView(canvas);
    };
  }, [engine, planCamera]);

  return (
    <div className={`${className} p-3`}>
      <ViewCard title="Plan View" subtitle="Top-down orthographic" position="left">
        <canvas
          ref={planCanvasRef}
          className="w-full h-full block outline-none touch-none cursor-crosshair"
          onContextMenu={(e) => e.preventDefault()}
          tabIndex={0}
        />
        {onSetInteractionMode && (
          <div className="absolute top-4 left-4 flex gap-2 pointer-events-auto z-20">
            <button
              onClick={() => onSetInteractionMode(interactionMode === 'place-flat' ? 'select' : 'place-flat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-slate-700/90 text-slate-200 hover:bg-slate-600/90 border ${
                interactionMode === 'place-flat' ? 'border-slate-400' : 'border-slate-600/50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="4" y="10" width="16" height="8" rx="1" /><line x1="4" y1="10" x2="20" y2="10" /></svg>
              <span>Flat Roof</span>
            </button>
            <button
              onClick={() => onSetInteractionMode(interactionMode === 'place-gable' ? 'select' : 'place-gable')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-slate-700/90 text-slate-200 hover:bg-slate-600/90 border ${
                interactionMode === 'place-gable' ? 'border-slate-400' : 'border-slate-600/50'
              }`}
            >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4 18 L4 12 L12 6 L20 12 L20 18" strokeLinejoin="round" /><line x1="4" y1="12" x2="20" y2="12" /></svg>
              <span>Dual Pitch</span>
            </button>
            {interactionMode !== 'select' && (
              <button
                onClick={() => onSetInteractionMode('select')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-slate-700/90 text-slate-200 hover:bg-slate-600/90 border border-slate-600/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
                <span>Cancel</span>
              </button>
            )}
          </div>
        )}

        {/* Settings Button - Top Right */}
        {onToggleSettings && (
          <div className="absolute top-4 right-4 pointer-events-auto z-20">
            <button
              onClick={onToggleSettings}
              title="Settings"
              className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 border shadow-sm ${
                isSettingsOpen
                  ? 'bg-slate-600 border-slate-500 text-white'
                  : 'bg-slate-700/90 border-slate-600/50 text-slate-300 hover:bg-slate-600/90'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        )}

        {/* Settings Panel */}
        {settingsPanel}

        {/* Properties Panel */}
        {propertiesPanel}
      </ViewCard>
    </div>
  );
};
