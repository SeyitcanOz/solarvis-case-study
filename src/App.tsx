import { useState, useCallback, useEffect } from 'react';
import { SceneProvider } from './context/SceneContext';
import { PlanView } from './ui/viewports/PlanView';
import { PerspectiveView } from './ui/viewports/PerspectiveView';
import { SectionView } from './ui/viewports/SectionView';
import { SceneOrchestrator } from './features/scene/SceneOrchestrator';
import { InputModal } from './ui/InputModal';
import type { InputRequest } from './features/gizmo/useSectionGizmoInteractions';
import { availableMaps, getDefaultMap, getMapById } from './config/maps';
import { BUILDING_CONFIG } from './config/building';
import type { BuildingData, InteractionMode } from './types';
import {
  ControlPanel,
  SettingsPanel,
  BuildingPropertiesPanel,
  BuildingPropertiesButton
} from './ui/ControlPanel';

function App() {
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('select');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [roofTransparency, setRoofTransparency] = useState<number>(BUILDING_CONFIG.transparency.default);

  // View Settings State
  const [show3DGuides, setShow3DGuides] = useState<boolean>(false);
  const [show3DGizmos, setShow3DGizmos] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showBuildingProps, setShowBuildingProps] = useState<boolean>(false);

  // Map State
  const [currentMapId, setCurrentMapId] = useState<string>(getDefaultMap().id);

  // --- Input Modal State ---
  const [inputState, setInputState] = useState<{
    isOpen: boolean;
    title: string;
    initialValue: number;
    min: number;
    max?: number;
    onConfirm?: (val: number) => void;
  }>({
    isOpen: false,
    title: '',
    initialValue: 0,
    min: 0,
  });

  const handleOpenInput = useCallback((req: InputRequest) => {
    setInputState({
      isOpen: true,
      title: req.title,
      initialValue: req.initialValue,
      min: req.min,
      max: req.max,
      onConfirm: req.onConfirm,
    });
  }, []);

  const handleInputConfirm = (val: number) => {
    if (inputState.onConfirm) {
      inputState.onConfirm(val);
    }
    setInputState(prev => ({ ...prev, isOpen: false }));
  };

  const handleAddBuilding = useCallback((building: BuildingData) => {
    setBuildings((prev) => [...prev, building]);
    setSelectedBuildingId(building.id);
    setInteractionMode('select');
  }, []);

  const handleUpdateBuilding = useCallback((id: string, updates: Partial<BuildingData>) => {
    setBuildings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } as BuildingData : b))
    );
  }, []);

  const handleDeleteBuilding = useCallback(() => {
    if (selectedBuildingId) {
      setBuildings((prev) => prev.filter((b) => b.id !== selectedBuildingId));
      setSelectedBuildingId(null);
    }
  }, [selectedBuildingId]);

  const handleMapChange = useCallback((mapId: string) => {
    setCurrentMapId(mapId);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC - Cancel building placement mode
      if (event.key === 'Escape') {
        if (interactionMode !== 'select') {
          setInteractionMode('select');
          event.preventDefault();
        }
      }

      // Delete - Remove selected building
      if (event.key === 'Delete' && selectedBuildingId) {
        handleDeleteBuilding();
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [interactionMode, selectedBuildingId, handleDeleteBuilding]);

  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId) || null;
  const currentMap = getMapById(currentMapId) || getDefaultMap();

  return (
    <SceneProvider>
      <div className="w-screen h-screen flex bg-gray-900 overflow-hidden relative">

        {/* Global Controls - Instructions Overlay */}
        <ControlPanel interactionMode={interactionMode} />

        {/* LEFT PANEL: PLAN VIEW (60%) */}
        <div className="w-[60%] h-full border-r border-gray-700 relative">
          <PlanView
            className="w-full h-full"
            interactionMode={interactionMode}
            onSetInteractionMode={setInteractionMode}
            isSettingsOpen={isSettingsOpen}
            onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
            settingsPanel={
              isSettingsOpen && (
                <SettingsPanel
                  roofTransparency={roofTransparency}
                  onSetRoofTransparency={setRoofTransparency}
                  availableMaps={availableMaps}
                  currentMapId={currentMapId}
                  onMapChange={handleMapChange}
                  onClose={() => setIsSettingsOpen(false)}
                />
              )
            }
            propertiesPanel={
              <>
                {selectedBuilding && (
                  <BuildingPropertiesButton
                    isOpen={showBuildingProps}
                    onClick={() => setShowBuildingProps(!showBuildingProps)}
                  />
                )}
                {selectedBuilding && showBuildingProps && (
                  <BuildingPropertiesPanel
                    building={selectedBuilding}
                    onUpdateBuilding={(updates) => selectedBuildingId && handleUpdateBuilding(selectedBuildingId, updates)}
                    onDeleteBuilding={handleDeleteBuilding}
                    onClose={() => setShowBuildingProps(false)}
                  />
                )}
              </>
            }
          />
        </div>

        {/* RIGHT PANEL: 3D VIEW (top 50%) + SECTION VIEW (bottom 50%) */}
        <div className="w-[40%] h-full flex flex-col relative">
          
          {/* Top Right: Perspective View */}
          <div className="h-[50%] border-b border-gray-700 relative">
            <PerspectiveView
              className="w-full h-full"
              showGuides={show3DGuides}
              onToggleGuides={() => setShow3DGuides(!show3DGuides)}
              showGizmos={show3DGizmos}
              onToggleGizmos={() => setShow3DGizmos(!show3DGizmos)}
            />
          </div>

          {/* Bottom Right: Section View */}
          <div className="h-[50%] relative">
            <SectionView
              className="w-full h-full"
            />

            <InputModal 
              isOpen={inputState.isOpen}
              title={inputState.title}
              initialValue={inputState.initialValue}
              min={inputState.min}
              max={inputState.max}
              onClose={() => setInputState(prev => ({ ...prev, isOpen: false }))}
              onConfirm={handleInputConfirm}
            />
          </div>
        </div>

        {/* LOGIC & CONTROLS (Non-visual) */}
        <SceneOrchestrator
          buildings={buildings}
          interactionMode={interactionMode}
          selectedBuildingId={selectedBuildingId}
          onAddBuilding={handleAddBuilding}
          onSelectBuilding={setSelectedBuildingId}
          onUpdateBuilding={handleUpdateBuilding}
          satelliteImageUrl={currentMap.imageUrl}
          roofTransparency={roofTransparency}
          show3DGuides={show3DGuides}
          show3DGizmos={show3DGizmos}
          onOpenInput={handleOpenInput}
        />
      </div>
    </SceneProvider>
  );
}

export default App;