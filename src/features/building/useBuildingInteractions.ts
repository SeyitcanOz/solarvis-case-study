import { useEffect, useRef, type RefObject } from 'react';
import { Scene, Mesh, ArcRotateCamera, Vector3 } from '@babylonjs/core';
import type { BuildingData, InteractionMode } from '../../types';
import {
  getAccurateGroundHit,
  getCameraFromEvent,
  getPointerRelativePos,
  createCustomPickingRay
} from '../../utils/raycasting'; 
import { BUILDING_CONFIG } from '../../config/building';

interface BuildingInteractionsProps {
  scene: Scene | null;
  planCamera: ArcRotateCamera | null;
  perspectiveCamera: ArcRotateCamera | null;
  planCanvasRef: RefObject<HTMLCanvasElement | null>;
  perspectiveCanvasRef: RefObject<HTMLCanvasElement | null>;
  buildings: BuildingData[];
  interactionMode: InteractionMode;
  selectedBuildingId: string | null;
  ghostMeshes: Mesh[];
  onAddBuilding: (building: BuildingData) => void;
  onSelectBuilding: (id: string | null) => void;
  onUpdateBuilding: (id: string, updates: Partial<BuildingData>) => void;
}

interface DragState {
  isDragging: boolean;
  startMouseGroundPos: Vector3;
  initialPosition: Vector3;
  buildingId: string | null;
}

export const useBuildingInteractions = ({
  scene,
  planCamera,
  perspectiveCamera,
  planCanvasRef,
  perspectiveCanvasRef,
  buildings,
  interactionMode,
  selectedBuildingId,
  ghostMeshes,
  onAddBuilding,
  onSelectBuilding,
  onUpdateBuilding,
}: BuildingInteractionsProps) => {
  const dragRef = useRef<DragState>({
    isDragging: false,
    startMouseGroundPos: Vector3.Zero(),
    initialPosition: Vector3.Zero(),
    buildingId: null,
  });

  useEffect(() => {
    const planCanvas = planCanvasRef.current;
    const perspectiveCanvas = perspectiveCanvasRef.current;

    if (!scene || !planCanvas || !perspectiveCanvas || !planCamera || !perspectiveCamera) return;

    const canvases = [planCanvas, perspectiveCanvas];

    const performPick = (e: PointerEvent) => {
      const camera = getCameraFromEvent(e, planCamera, perspectiveCamera, planCanvas, perspectiveCanvas);
      if (!camera) return null;
      const canvas = e.target as HTMLCanvasElement;
      const { x, y } = getPointerRelativePos(e, canvas);
      const ray = createCustomPickingRay(x, y, canvas, camera);

      const pickResult = scene.pickWithRay(
        ray,
        (mesh) => {
          if (!mesh.isPickable) return false;
          // Allow hitting Gizmos (do not filter them out here)
          // Ignore isVisible check to fix Section View visibility issues
          return true;
        },
        false
      );
      const groundPoint = getAccurateGroundHit(scene, x, y, canvas, camera);
      return { pickResult, groundPoint };
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;

      const canvas = e.target as HTMLCanvasElement;
      canvas.setPointerCapture(e.pointerId);

      const result = performPick(e);
      if (!result) return;
      const { pickResult, groundPoint } = result;

      // Stop Deselect on Gizmo Click
      if (pickResult?.hit && (pickResult.pickedMesh?.metadata?.isGizmo || pickResult.pickedMesh?.metadata?.isSectionGizmo)) {
        return; 
      }

      // 1. PLACEMENT MODE
      if (interactionMode !== 'select' && groundPoint) {
        const finalPos = groundPoint;
        const roofType = interactionMode === 'place-flat' ? 'flat' : 'gable';
        
        // Correctly handle discriminated unions for defaults
        if (roofType === 'flat') {
          const defaults = BUILDING_CONFIG.defaults.flat;
          onAddBuilding({
            id: crypto.randomUUID(),
            type: 'flat',
            position: finalPos,
            rotation: defaults.rotation,
            roof: {
              width: defaults.roof.width,
              length: defaults.roof.length,
              thickness: defaults.roof.thickness,
            },
            extension: defaults.extension,
            wallHeight: defaults.wallHeight,
          });
        } else {
          const defaults = BUILDING_CONFIG.defaults.gable;
          onAddBuilding({
            id: crypto.randomUUID(),
            type: 'gable',
            position: finalPos,
            rotation: defaults.rotation,
            roof: {
              width: defaults.roof.width,
              length: defaults.roof.length,
              slope: defaults.roof.slope,
            },
            extension: defaults.extension,
            wallHeight: defaults.wallHeight,
          });
        }
        return;
      }

      // 2. SELECT MODE
      if (interactionMode === 'select') {
        if (pickResult?.hit && pickResult.pickedMesh?.metadata?.buildingId) {
          const clickedBuildingId = pickResult.pickedMesh.metadata.buildingId;
          
          if (!pickResult.pickedMesh.metadata.isGizmo) {
             onSelectBuilding(clickedBuildingId);

             if (clickedBuildingId === selectedBuildingId && groundPoint) {
                const building = buildings.find(b => b.id === selectedBuildingId);
                if (building) {
                  dragRef.current = {
                    isDragging: true,
                    startMouseGroundPos: groundPoint,
                    initialPosition: building.position.clone(),
                    buildingId: selectedBuildingId,
                  };
                }
             }
          }
        } else {
          onSelectBuilding(null);
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const result = performPick(e);
      if (!result) return;
      const { groundPoint } = result;

      if (interactionMode !== 'select' && groundPoint && ghostMeshes.length > 0) {
        ghostMeshes.forEach(m => {
          m.position.x = groundPoint.x;
          m.position.z = groundPoint.z;
        });
      }

      if (dragRef.current.isDragging && groundPoint && dragRef.current.buildingId) {
        const diff = groundPoint.subtract(dragRef.current.startMouseGroundPos);
        const newPosition = dragRef.current.initialPosition.add(diff);
        onUpdateBuilding(dragRef.current.buildingId, { position: newPosition });
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const canvas = e.target as HTMLCanvasElement;
      canvas.releasePointerCapture(e.pointerId);

      if (dragRef.current.isDragging) {
        dragRef.current.isDragging = false;
        dragRef.current.buildingId = null;
      }
    };

    canvases.forEach(c => {
      c.addEventListener('pointerdown', handlePointerDown);
      c.addEventListener('pointermove', handlePointerMove);
      c.addEventListener('pointerup', handlePointerUp);
      c.addEventListener('pointerleave', handlePointerUp);
    });

    return () => {
      canvases.forEach(c => {
        c.removeEventListener('pointerdown', handlePointerDown);
        c.removeEventListener('pointermove', handlePointerMove);
        c.removeEventListener('pointerup', handlePointerUp);
        c.removeEventListener('pointerleave', handlePointerUp);
      });
    };
  }, [
    scene,
    planCamera,
    perspectiveCamera,
    planCanvasRef,
    perspectiveCanvasRef,
    buildings,
    interactionMode,
    selectedBuildingId,
    ghostMeshes,
    onAddBuilding,
    onSelectBuilding,
    onUpdateBuilding,
  ]);
};