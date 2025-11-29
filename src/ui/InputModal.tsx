import React, { useEffect, useRef, useState } from 'react';

interface InputModalProps {
  isOpen: boolean;
  title: string;
  initialValue: number;
  min: number;
  max?: number;
  onClose: () => void;
  onConfirm: (value: number) => void;
}

export const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  title,
  initialValue,
  min,
  max,
  onClose,
  onConfirm,
}) => {
  const [value, setValue] = useState(initialValue.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync value when modal opens
  useEffect(() => {
    if (isOpen) {
      // Format to max 2 decimals for cleaner display on open
      const displayVal = Number.isInteger(initialValue) 
        ? initialValue.toString() 
        : initialValue.toFixed(2);
        
      setValue(displayVal);
      // Small delay to ensure rendering before focus
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(value);
    
    if (isNaN(num)) return;
    
    // Clamp value
    let finalVal = Math.max(min, num);
    if (max !== undefined) finalVal = Math.min(max, finalVal);

    onConfirm(finalVal);
  };

  const isAngle = title.toLowerCase().includes('slope');

  return (
    // Container: Absolute positioning relative to the Viewport container
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] transition-all duration-200">
      
      {/* Modal Card */}
      <div className="w-56 bg-slate-800 border border-slate-600/50 shadow-2xl rounded-xl p-3 animate-in zoom-in-95 fade-in duration-150">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div>
            {/* Removed 'uppercase' class here */}
            <h3 className="text-xs font-bold text-slate-100 tracking-wide">{title}</h3>
            <p className="text-[10px] text-slate-400">
              Range: {min}{isAngle ? '°' : 'm'} {max ? `- ${max}${isAngle ? '°' : 'm'}` : '+'}
            </p>
          </div>
          {/* Close Button */}
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors p-0.5 rounded-md hover:bg-slate-700"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="relative mb-3 group">
            <input
              ref={inputRef}
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-sm font-mono rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-600 group-hover:border-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-2 py-1 text-[11px] font-medium text-slate-400 bg-slate-700/50 hover:bg-slate-700 hover:text-slate-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-2 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-lg shadow-blue-500/20 transition-all"
            >
              Apply
            </button>
          </div>
        </form>
      </div>
      
      {/* Invisible backdrop to close on click-outside */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};