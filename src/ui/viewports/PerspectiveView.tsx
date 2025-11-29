import React, { useEffect, useState } from 'react';
import { useScene } from '../../context/useScene';
import { ViewCard } from './ViewCard';

interface PerspectiveViewProps {
  className?: string;
  showGuides?: boolean;
  onToggleGuides?: () => void;
  showGizmos?: boolean;
  onToggleGizmos?: () => void;
}

export const PerspectiveView: React.FC<PerspectiveViewProps> = ({
  className,
  showGuides = true,
  onToggleGuides,
  showGizmos = true,
  onToggleGizmos,
}) => {
  const { engine, perspectiveCamera, perspectiveCanvasRef } = useScene();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (!engine || !perspectiveCamera || !perspectiveCanvasRef.current) return;
    const canvas = perspectiveCanvasRef.current;
    engine.registerView(canvas, perspectiveCamera);
    const resize = () => engine.resize();
    const obs = new ResizeObserver(resize);
    obs.observe(canvas);
    setTimeout(() => engine.resize(), 50);
    return () => {
      obs.disconnect();
      if (engine) engine.unRegisterView(canvas);
    };
  }, [engine, perspectiveCamera]);

  return (
    <div className={`${className} p-3`}>
      <ViewCard title="3D View" subtitle="Interactive perspective" position="right" showStatus={false}>
        <canvas
          ref={perspectiveCanvasRef}
          className="w-full h-full block outline-none touch-none cursor-grab active:cursor-grabbing"
          onContextMenu={(e) => e.preventDefault()}
          tabIndex={0}
        />

        {/* Settings Wrapper */}
        {(onToggleGuides || onToggleGizmos) && (
          <div className="absolute top-4 right-4 pointer-events-auto z-20">

            {/* 1. Gear Button */}
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              title="View Settings"
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

            {/* 2. Dropdown Menu */}
            {isSettingsOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur border border-slate-600/50 rounded-lg shadow-xl p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                <div className="flex items-center gap-2 border-b border-slate-700/50 pb-2">
                  <span className="text-xs font-semibold text-slate-400  tracking-wider">Display Options</span>
                </div>

                {/* Guide Lines Toggle */}
                {onToggleGuides && (
                  <div className="flex items-center justify-between group cursor-pointer" onClick={onToggleGuides}>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      <span className="text-sm text-slate-200 font-medium">Guide Lines</span>
                    </div>

                    <button
                      type="button"
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        showGuides ? 'bg-blue-600' : 'bg-slate-600'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          showGuides ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}

                {/* Gizmos Toggle */}
                {onToggleGizmos && (
                  <div className="flex items-center justify-between group cursor-pointer" onClick={onToggleGizmos}>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      <span className="text-sm text-slate-200 font-medium">Transform Gizmos</span>
                    </div>

                    <button
                      type="button"
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        showGizmos ? 'bg-blue-600' : 'bg-slate-600'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          showGizmos ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </ViewCard>
    </div>
  );
};
