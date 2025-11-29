import React, { useEffect } from 'react';
import { Camera, ArcRotateCamera } from '@babylonjs/core';
import { useScene } from '../../context/useScene';
import { Building } from '../building/Building';
import { TransformGizmo } from '../gizmo/TransformGizmo';
import { SectionGizmo } from '../gizmo/SectionGizmo';
import { createGroundPlane } from '../map/GroundFactory';
import type { BuildingData, InteractionMode } from '../../types';
import { usePlanControls, usePerspectiveControls, useSectionControls } from '../camera/useCameraControls';
import { useGhostBuilding } from '../building/useGhostBuilding';
import { useBuildingInteractions } from '../building/useBuildingInteractions';
import { useGizmoInteractions } from '../gizmo/useGizmoInteractions';
import { useSectionGizmoInteractions, type InputRequest } from '../gizmo/useSectionGizmoInteractions';
import { useViewDependentRendering } from './useViewDependentRendering';
import { INTERACTION_CONFIG } from '../../config/interaction';
import { CAMERA_CONFIG } from '../../config/camera';

interface SceneOrchestratorProps {
  buildings: BuildingData[];
  interactionMode: InteractionMode;
  selectedBuildingId: string | null;
  onAddBuilding: (building: BuildingData) => void;
  onSelectBuilding: (id: string | null) => void;
  onUpdateBuilding: (id: string, updates: Partial<BuildingData>) => void;
  satelliteImageUrl?: string;
  roofTransparency: number;
  show3DGuides: boolean;
  show3DGizmos: boolean;
  onOpenInput: (req: InputRequest) => void;
}

const updateCameraLayerMasks = (
  planCam: Camera,
  perspCam: Camera,
  sectionCam: Camera | null,
  show3DGizmos: boolean,
) => {
  planCam.layerMask = 0xFFFFFFFF ^ INTERACTION_CONFIG.layerMasks.sectionGizmos;

  if (show3DGizmos) {
    perspCam.layerMask = 0xFFFFFFFF ^ INTERACTION_CONFIG.layerMasks.sectionGizmos;
  } else {
    perspCam.layerMask = 0xFFFFFFFF ^ (INTERACTION_CONFIG.layerMasks.gizmos | INTERACTION_CONFIG.layerMasks.sectionGizmos);
  }

  if (sectionCam) {
      sectionCam.layerMask = 0xFFFFFFFF ^ INTERACTION_CONFIG.layerMasks.gizmos;
  }
};

export const SceneOrchestrator: React.FC<SceneOrchestratorProps> = ({
  buildings,
  interactionMode,
  selectedBuildingId,
  onAddBuilding,
  onSelectBuilding,
  onUpdateBuilding,
  satelliteImageUrl,
  roofTransparency,
  show3DGuides,
  show3DGizmos,
  onOpenInput,
}) => {
  const { scene, planCamera, perspectiveCamera, sectionCamera, planCanvasRef, perspectiveCanvasRef, sectionCanvasRef, materialManager } = useScene();

  const selectedBuilding = selectedBuildingId ? buildings.find(b => b.id === selectedBuildingId) : null;

  usePlanControls(planCamera, planCanvasRef, perspectiveCamera, perspectiveCanvasRef);
  usePerspectiveControls(perspectiveCamera, perspectiveCanvasRef, planCamera, planCanvasRef);
  useSectionControls(sectionCamera, sectionCanvasRef);
  
  const ghostMeshes = useGhostBuilding(scene, materialManager, interactionMode);
  
  useBuildingInteractions({
    scene, planCamera, perspectiveCamera, planCanvasRef, perspectiveCanvasRef, 
    buildings, interactionMode, selectedBuildingId, ghostMeshes, 
    onAddBuilding, onSelectBuilding, onUpdateBuilding,
  });
  
  useGizmoInteractions({
    scene, planCamera, perspectiveCamera, planCanvasRef, perspectiveCanvasRef,
    buildings, selectedBuildingId, onUpdateBuilding,
    materialManager,
  });

  useSectionGizmoInteractions({
    scene,
    sectionCamera: sectionCamera as ArcRotateCamera,
    sectionCanvasRef,
    buildings,
    selectedBuildingId,
    onUpdateBuilding,
    onOpenInput,
  });

  // --- VIEW-DEPENDENT RENDERING ---
  useViewDependentRendering({
    scene,
    planCamera,
    perspectiveCamera,
    sectionCamera,
    roofTransparency,
    show3DGuides,
    selectedBuildingId,
    materialManager,
  });

  // --- CONTINUOUS CAMERA TRACKING ---
  useEffect(() => {
    if (!scene || !sectionCamera || !selectedBuilding) return;

    const observer = scene.onBeforeRenderObservable.add(() => {
      const pos = selectedBuilding.position;
      const heightCenter = selectedBuilding.wallHeight / 2;
      
      sectionCamera.target.x = pos.x;
      sectionCamera.target.y = heightCenter;
      sectionCamera.target.z = pos.z;
    });

    return () => {
      scene.onBeforeRenderObservable.remove(observer);
    };
  }, [scene, sectionCamera, selectedBuilding]);

  // --- INITIAL AUTO-FIT ---
  useEffect(() => {
    if (!sectionCamera || !selectedBuilding || !sectionCanvasRef.current) return;

    sectionCamera.target.x = selectedBuilding.position.x;
    sectionCamera.target.y = selectedBuilding.wallHeight / 2;
    sectionCamera.target.z = selectedBuilding.position.z;

    const totalHeight = selectedBuilding.type === 'flat'
      ? selectedBuilding.wallHeight + selectedBuilding.roof.thickness
      : selectedBuilding.wallHeight + (selectedBuilding.roof.width / 2) * Math.tan((selectedBuilding.roof.slope * Math.PI) / 180);

    const targetHeight = totalHeight * 1.5;
    const halfHeight = targetHeight / 2;

    const minHalfHeight = CAMERA_CONFIG.section.zoom.min / 2;
    const maxHalfHeight = CAMERA_CONFIG.section.zoom.max / 2;
    const clampedHalfHeight = Math.max(minHalfHeight, Math.min(maxHalfHeight, halfHeight));

    const ratio = sectionCanvasRef.current.clientWidth / sectionCanvasRef.current.clientHeight;

    sectionCamera.orthoTop = clampedHalfHeight;
    sectionCamera.orthoBottom = -clampedHalfHeight;
    sectionCamera.orthoLeft = -clampedHalfHeight * ratio;
    sectionCamera.orthoRight = clampedHalfHeight * ratio;

  }, [sectionCamera, selectedBuildingId, sectionCanvasRef]);

  // --- CAMERA LAYER MASKS ---
  useEffect(() => {
    if (!planCamera || !perspectiveCamera) return;
    updateCameraLayerMasks(planCamera, perspectiveCamera, sectionCamera, show3DGizmos);
  }, [planCamera, perspectiveCamera, sectionCamera, show3DGizmos]);

  // --- MAP/GROUND ---
  useEffect(() => {
    if (!scene) return;
    const ground = createGroundPlane(scene, satelliteImageUrl);
    return () => ground.dispose();
  }, [scene, satelliteImageUrl]);

  return (
    <>
      {buildings.map((building) => (
        <Building
          key={building.id}
          building={building}
          scene={scene}
          isSelected={building.id === selectedBuildingId}
        />
      ))}

      {selectedBuildingId && (() => {
        const sel = buildings.find(b => b.id === selectedBuildingId);
        return sel ? <TransformGizmo building={sel} scene={scene} /> : null;
      })()}

      {selectedBuildingId && (() => {
        const sel = buildings.find(b => b.id === selectedBuildingId);
        return sel ? <SectionGizmo building={sel} scene={scene} /> : null;
      })()}
    </>
  );
};