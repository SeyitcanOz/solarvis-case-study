import { useState } from 'react';
import type { BuildingData, InteractionMode } from '../types';
import { BUILDING_CONFIG } from '../config/building';
import type { MapConfig } from '../config/maps';

// --- Settings Panel Component ---
interface SettingsPanelProps {
  roofTransparency: number;
  onSetRoofTransparency: (transparency: number) => void;
  availableMaps: MapConfig[];
  currentMapId: string;
  onMapChange: (mapId: string) => void;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  roofTransparency,
  onSetRoofTransparency,
  availableMaps,
  currentMapId,
  onMapChange,
  onClose,
}) => {
  return (
    <div className="absolute top-20 right-4 w-72 bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-xl shadow-2xl pointer-events-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right z-30">
      <div className="px-4 py-3 bg-slate-700/50 border-b border-slate-600/30">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white tracking-wide">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-600/50 rounded transition-colors"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Map Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2 tracking-wider">
            Map Selection
          </label>
          <div className="space-y-2">
            {availableMaps.map((map) => (
              <button
                key={map.id}
                onClick={() => onMapChange(map.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  currentMapId === map.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600/30'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{map.name}</div>
                  {map.description && (
                    <div className="text-xs opacity-70 mt-0.5">{map.description}</div>
                  )}
                </div>
                {currentMapId === map.id && (
                  <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700/50"></div>

        {/* Roof Transparency */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2 tracking-wider">
            Roof Transparency: {Math.round((1 - roofTransparency) * 100)}%
          </label>
          <input
            type="range"
            min={BUILDING_CONFIG.transparency.min}
            max={BUILDING_CONFIG.transparency.max}
            step={BUILDING_CONFIG.transparency.step}
            value={roofTransparency}
            onChange={(e) => onSetRoofTransparency(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1.5">
            <span>Transparent</span>
            <span>Opaque</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Building Properties Panel Component ---
interface BuildingPropertiesPanelProps {
  building: BuildingData;
  onUpdateBuilding: (updates: Partial<BuildingData>) => void;
  onDeleteBuilding: () => void;
  onClose: () => void;
}

export const BuildingPropertiesPanel: React.FC<BuildingPropertiesPanelProps> = ({
  building,
  onUpdateBuilding,
  onDeleteBuilding,
  onClose,
}) => {
  return (
    <div className="absolute right-4 top-4 w-80 bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-xl shadow-2xl pointer-events-auto overflow-hidden animate-in fade-in slide-in-from-right-2 duration-200 z-30">
      <div className="px-4 py-3 bg-slate-700/50 border-b border-slate-600/30">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-semibold text-white">
              {building.type === 'flat' ? 'Flat Roof' : 'Gable Roof'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Building Properties</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDeleteBuilding}
              title="Delete Building (Del)"
              className="px-2.5 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-600/50 rounded transition-colors"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Roof Width */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Roof Width: <span className="text-blue-400 font-semibold">{building.roof.width.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min={BUILDING_CONFIG.limits.roof.width.min}
            step={BUILDING_CONFIG.limits.roof.width.step}
            value={building.roof.width}
            onChange={(e) =>
              onUpdateBuilding({
                roof: {
                  ...building.roof,
                  width: parseFloat(e.target.value),
                } as any,
              })
            }
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
          />
        </div>

        {/* Roof Length */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Roof Length: <span className="text-blue-400 font-semibold">{building.roof.length.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min={BUILDING_CONFIG.limits.roof.length.min}
            step={BUILDING_CONFIG.limits.roof.length.step}
            value={building.roof.length}
            onChange={(e) =>
              onUpdateBuilding({
                roof: {
                  ...building.roof,
                  length: parseFloat(e.target.value),
                } as any,
              })
            }
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
          />
        </div>

        {/* Wall Height */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Wall Height: <span className="text-blue-400 font-semibold">{building.wallHeight.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min={BUILDING_CONFIG.limits.wallHeight.min}
            step={BUILDING_CONFIG.limits.wallHeight.step}
            value={building.wallHeight}
            onChange={(e) =>
              onUpdateBuilding({ wallHeight: parseFloat(e.target.value) })
            }
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
          />
        </div>

        {/* Extension (Overhang) */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Overhang: <span className="text-blue-400 font-semibold">{building.extension.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={BUILDING_CONFIG.limits.extension.min}
            max={Math.min(building.roof.width / 2, building.roof.length / 2) - BUILDING_CONFIG.limits.minDimension}
            step={BUILDING_CONFIG.limits.extension.step}
            value={building.extension}
            onChange={(e) =>
              onUpdateBuilding({ extension: parseFloat(e.target.value) })
            }
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
          />
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Rotation: <span className="text-blue-400 font-semibold">{Math.abs(Math.round((building.rotation * 180) / Math.PI))}°</span>
          </label>
          <input
            type="range"
            min={BUILDING_CONFIG.limits.rotation.min}
            max={BUILDING_CONFIG.limits.rotation.max}
            step={BUILDING_CONFIG.limits.rotation.step}
            value={(building.rotation * 180) / Math.PI}
            onChange={(e) =>
              onUpdateBuilding({
                rotation: (parseFloat(e.target.value) * Math.PI) / 180,
              })
            }
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
          />
        </div>

        {/* Type-specific properties */}
        {building.type === 'gable' && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Roof Slope: <span className="text-blue-400 font-semibold">{building.roof.slope.toFixed(0)}°</span>
            </label>
            <input
              type="range"
              min={BUILDING_CONFIG.limits.roof.slope.min}
              max={BUILDING_CONFIG.limits.roof.slope.max}
              step={BUILDING_CONFIG.limits.roof.slope.step}
              value={building.roof.slope}
              onChange={(e) =>
                onUpdateBuilding({
                  roof: {
                    ...building.roof,
                    slope: parseFloat(e.target.value),
                  } as any,
                })
              }
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
            />
          </div>
        )}

        {building.type === 'flat' && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Roof Thickness: <span className="text-blue-400 font-semibold">{building.roof.thickness.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={BUILDING_CONFIG.limits.roof.thickness.min}
              step={BUILDING_CONFIG.limits.roof.thickness.step}
              value={building.roof.thickness}
              onChange={(e) =>
                onUpdateBuilding({
                  roof: {
                    ...building.roof,
                    thickness: parseFloat(e.target.value),
                  } as any,
                })
              }
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// --- Building Properties Toggle Button ---
interface BuildingPropertiesButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export const BuildingPropertiesButton: React.FC<BuildingPropertiesButtonProps> = ({
  isOpen,
  onClick,
}) => {
  return (
    <div className="absolute top-4 right-16 pointer-events-auto z-20">
      <button
        onClick={onClick}
        title="Building Properties"
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 border shadow-lg ${
          isOpen
            ? 'bg-blue-600 border-blue-500 text-white'
            : 'bg-slate-700/90 border-slate-600/50 text-slate-200 hover:bg-slate-600/90'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="text-sm font-medium">Properties</span>
      </button>
    </div>
  );
};

// --- Main ControlPanel Component ---
interface ControlPanelProps {
  interactionMode: InteractionMode;
}

/**
 * ControlPanel Component
 *
 * Provides instruction overlays for building placement
 */
export const ControlPanel: React.FC<ControlPanelProps> = ({
  interactionMode,
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
      {/* Instructions overlay */}
      {interactionMode !== 'select' && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-xl border border-slate-700/50 pointer-events-none shadow-xl">
          <p className="text-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
            </svg>
            Click on Plan View to place a{' '}
            <span className="font-semibold text-blue-400">
              {interactionMode === 'place-flat' ? 'Flat Roof' : 'Gable Roof'}
            </span>{' '}
            building • Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs border border-slate-600">ESC</kbd> to cancel
          </p>
        </div>
      )}
    </div>
  );
};


