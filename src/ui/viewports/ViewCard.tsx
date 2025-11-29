import React from 'react';

interface ViewCardProps {
  title: string;
  subtitle?: string;
  position: 'left' | 'right';
  children: React.ReactNode;
  showStatus?: boolean;
}

export const ViewCard: React.FC<ViewCardProps> = ({ title, subtitle, children, showStatus = true }) => {
  return (
    <div className="relative h-full flex flex-col bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="flex-1 relative">{children}</div>
      {showStatus && (
        <div className="px-4 py-2 bg-slate-800/60 border-t border-slate-700/30 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Scroll: Zoom • Right: Rotate • Middle: Pan
          </div>
        </div>
      )}
    </div>
  );
};
