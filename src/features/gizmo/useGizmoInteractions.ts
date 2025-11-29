import { useEffect, useRef, type RefObject } from 'react';
import { Scene, Camera, Vector3, Matrix, AbstractMesh, Color3 } from '@babylonjs/core';
import {
  getAccurateGroundHit,
  getCameraFromEvent,
  getPointerRelativePos,
  createCustomPickingRay
} from '../../utils/raycasting';
import type { BuildingData, GizmoHandleType } from '../../types';
import { MaterialManager } from '../../systems/MaterialManager';

interface UseGizmoInteractionsParams {
  scene: Scene | null;
  planCamera: Camera | null;
  perspectiveCamera: Camera | null;
  planCanvasRef: RefObject<HTMLCanvasElement | null>;
  perspectiveCanvasRef: RefObject<HTMLCanvasElement | null>;
  buildings: BuildingData[];
  selectedBuildingId: string | null;
  onUpdateBuilding: (id: string, updates: Partial<BuildingData>) => void;
  materialManager: MaterialManager | null;
}

export function useGizmoInteractions({
  scene,
  planCamera,
  perspectiveCamera,
  planCanvasRef,
  perspectiveCanvasRef,
  buildings,
  selectedBuildingId,
  onUpdateBuilding,
  materialManager,
}: UseGizmoInteractionsParams): void {
  
  const dragRef = useRef<{
    isDragging: boolean;
    handleType: GizmoHandleType | null;
    startMouseGroundPos: Vector3;
    initialPosition: Vector3;
    initialRotation: number;
    initialWidth: number;
    initialLength: number;
    startHandlePosLocal: Vector3;
    buildingId: string | null;
    activeMesh: AbstractMesh | null; 
  }>({
    isDragging: false,
    handleType: null,
    startMouseGroundPos: Vector3.Zero(),
    initialPosition: Vector3.Zero(),
    initialRotation: 0,
    initialWidth: 0,
    initialLength: 0,
    startHandlePosLocal: Vector3.Zero(),
    buildingId: null,
    activeMesh: null,
  });

  const hoverRef = useRef<{
    currentMesh: AbstractMesh | null;
  }>({
    currentMesh: null,
  });

  const restoreMaterial = (mesh: AbstractMesh) => {
    if (!materialManager || mesh.isDisposed()) return;
    if (mesh.metadata?.baseColor) {
      const hex = (mesh.metadata.baseColor as Color3).toHexString();
      mesh.material = materialManager.getGizmoMaterial(hex);
    }
  };

  useEffect(() => {
    const planCanvas = planCanvasRef.current;
    const perspectiveCanvas = perspectiveCanvasRef.current;

    if (!scene || !planCanvas || !perspectiveCanvas || !planCamera || !perspectiveCamera || !materialManager) return;

    const canvases = [planCanvas, perspectiveCanvas];

    const performPick = (e: PointerEvent) => {
      const camera = getCameraFromEvent(e, planCamera, perspectiveCamera, planCanvas, perspectiveCanvas);
      if (!camera) return null;
      const canvas = e.target as HTMLCanvasElement;
      const { x, y } = getPointerRelativePos(e, canvas);
      const ray = createCustomPickingRay(x, y, canvas, camera);

      const canPickGizmo = (mesh: any) => {
        return mesh.isPickable && 
               mesh.isVisible && 
               mesh.metadata?.isGizmo === true &&
               (mesh.layerMask & camera.layerMask) !== 0; 
      };

      let pickResult = scene.pickWithRay(ray, canPickGizmo, false);
      
      if (!pickResult || !pickResult.hit) {
         pickResult = scene.pickWithRay(ray, (mesh) => 
            mesh.isPickable && 
            mesh.isVisible && 
            !mesh.metadata?.isGizmo &&
            (mesh.layerMask & camera.layerMask) !== 0, 
         false);
      }
      const groundPoint = getAccurateGroundHit(scene, x, y, canvas, camera);
      return { pickResult, groundPoint, camera, canvas };
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;

      const canvas = e.target as HTMLCanvasElement;
      canvas.setPointerCapture(e.pointerId);

      const result = performPick(e);
      if (!result) return;
      const { pickResult, groundPoint } = result;

      if (pickResult?.hit && pickResult.pickedMesh && selectedBuildingId) {
        const mesh = pickResult.pickedMesh;
        const meta = mesh.metadata;
        const building = buildings.find(b => b.id === selectedBuildingId);

        if (building && meta?.isGizmo && meta.buildingId === selectedBuildingId) {
          const startPos = groundPoint || new Vector3(building.position.x, 0, building.position.z);

          mesh.material = materialManager.getGizmoActiveMaterial();

          dragRef.current = {
            isDragging: true,
            handleType: meta.type,
            startMouseGroundPos: startPos,
            initialPosition: building.position.clone(),
            initialRotation: building.rotation,
            initialWidth: building.roof.width,
            initialLength: building.roof.length,
            startHandlePosLocal: meta.localPos ? meta.localPos.clone() : Vector3.Zero(),
            buildingId: selectedBuildingId,
            activeMesh: mesh
          };
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (dragRef.current.isDragging && dragRef.current.buildingId) {
        const result = performPick(e);
        if (!result || !result.groundPoint) return;
        const { groundPoint } = result;

        const {
           handleType, startMouseGroundPos, initialPosition, initialRotation,
           initialWidth, initialLength, startHandlePosLocal
        } = dragRef.current;
        const buildingId = dragRef.current.buildingId;

        if (handleType === 'rotate') {
           const startAngle = Math.atan2(startMouseGroundPos.x - initialPosition.x, startMouseGroundPos.z - initialPosition.z);
           const currAngle = Math.atan2(groundPoint.x - initialPosition.x, groundPoint.z - initialPosition.z);
           onUpdateBuilding(buildingId, { rotation: initialRotation + (currAngle - startAngle) });
        } else {
            const mouseDeltaWorld = groundPoint.subtract(startMouseGroundPos);
            const matrix = Matrix.RotationY(initialRotation);
            const inverseRotation = Matrix.RotationY(-initialRotation);
            const startHandlePosWorldOffset = Vector3.TransformCoordinates(startHandlePosLocal, matrix);
            const currentHandlePosWorldOffset = startHandlePosWorldOffset.add(mouseDeltaWorld);
            const localPos = Vector3.TransformCoordinates(currentHandlePosWorldOffset, inverseRotation);

            let minX = -initialWidth / 2, maxX = initialWidth / 2;
            let minZ = -initialLength / 2, maxZ = initialLength / 2;

            switch (handleType) {
            case 'edge-n': minZ = localPos.z; break;
            case 'edge-s': maxZ = localPos.z; break;
            case 'edge-w': minX = localPos.x; break;
            case 'edge-e': maxX = localPos.x; break;
            case 'corner-nw': minX = localPos.x; minZ = localPos.z; break;
            case 'corner-ne': maxX = localPos.x; minZ = localPos.z; break;
            case 'corner-sw': minX = localPos.x; maxZ = localPos.z; break;
            case 'corner-se': maxX = localPos.x; maxZ = localPos.z; break;
            }

            if (maxX - minX < 1) { if ((handleType as string).includes('w')) minX = maxX - 1; else maxX = minX + 1; }
            if (maxZ - minZ < 1) { if ((handleType as string).includes('n')) minZ = maxZ - 1; else maxZ = minZ + 1; }

            const newWidth = maxX - minX;
            const newLength = maxZ - minZ;
            const midX = (minX + maxX) / 2;
            const midZ = (minZ + maxZ) / 2;
            const centerShiftLocal = new Vector3(midX, 0, midZ);
            const centerShiftWorld = Vector3.TransformCoordinates(centerShiftLocal, matrix);

            const building = buildings.find(b => b.id === buildingId);
            if (building) {
              onUpdateBuilding(buildingId, {
                position: initialPosition.add(centerShiftWorld),
                roof: {
                  ...building.roof,
                  width: newWidth,
                  length: newLength,
                } as any,
              });
            }
        }
        return;
      }

      // HOVER LOGIC
      const result = performPick(e);
      if (!result) return;
      const { pickResult } = result;

      const hitMesh = pickResult?.hit && pickResult.pickedMesh ? pickResult.pickedMesh : null;
      const isGizmo = hitMesh?.metadata?.isGizmo === true;

      if (hoverRef.current.currentMesh !== hitMesh) {
        if (hoverRef.current.currentMesh) {
            restoreMaterial(hoverRef.current.currentMesh);
        }
        if (hitMesh && isGizmo) {
            hitMesh.material = materialManager.getGizmoHoverMaterial();
            hoverRef.current.currentMesh = hitMesh;
        } else {
            hoverRef.current.currentMesh = null;
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const canvas = e.target as HTMLCanvasElement;
      canvas.releasePointerCapture(e.pointerId);

      if (dragRef.current.isDragging) {
        if (dragRef.current.activeMesh) {
            const result = performPick(e);
            const stillHovering = result?.pickResult?.pickedMesh === dragRef.current.activeMesh;
            
            if (stillHovering) {
                dragRef.current.activeMesh.material = materialManager.getGizmoHoverMaterial();
                hoverRef.current.currentMesh = dragRef.current.activeMesh;
            } else {
                restoreMaterial(dragRef.current.activeMesh);
                hoverRef.current.currentMesh = null;
            }
        }
        dragRef.current.isDragging = false;
        dragRef.current.activeMesh = null;
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
    scene, planCamera, perspectiveCamera, planCanvasRef, perspectiveCanvasRef,
    buildings, selectedBuildingId, onUpdateBuilding, materialManager
  ]);
}