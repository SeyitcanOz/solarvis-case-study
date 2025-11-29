import { useEffect, useRef, type RefObject } from 'react';
import { Scene, ArcRotateCamera, StandardMaterial, Mesh, Color3 } from '@babylonjs/core';
import type { BuildingData } from '../../types';
import { SECTION_GIZMO_CONFIG } from '../../config/sectionGizmo';
import { createCustomPickingRay, getPointerRelativePos } from '../../utils/raycasting';

// Input Request Definition
export interface InputRequest {
  title: string;
  initialValue: number;
  min: number;
  max?: number;
  onConfirm: (val: number) => void;
}

interface UseSectionGizmoInteractionsParams {
  scene: Scene | null;
  sectionCamera: ArcRotateCamera | null;
  sectionCanvasRef: RefObject<HTMLCanvasElement | null>;
  buildings: BuildingData[];
  selectedBuildingId: string | null;
  onUpdateBuilding: (id: string, updates: Partial<BuildingData>) => void;
  onOpenInput: (request: InputRequest) => void;
}

export function useSectionGizmoInteractions({
  scene,
  sectionCamera,
  sectionCanvasRef,
  buildings,
  selectedBuildingId,
  onUpdateBuilding,
  onOpenInput,
}: UseSectionGizmoInteractionsParams): void {
  const dragRef = useRef<{
    isDragging: boolean;
    gizmoType: 'totalHeight' | 'ridge' | 'eave' | 'slope' | null;
    buildingId: string | null;
    startY: number;
    initialWallHeight: number;
    initialSlope: number;
    initialRidgeHeight: number;
    handleMesh: Mesh | null;
  }>({
    isDragging: false,
    gizmoType: null,
    buildingId: null,
    startY: 0,
    initialWallHeight: 0,
    initialSlope: 0,
    initialRidgeHeight: 0,
    handleMesh: null,
  });

  const hoverRef = useRef<Mesh | null>(null);

  const clickRef = useRef<{
    lastClickTime: number;
    lastGizmoType: string | null;
  }>({
    lastClickTime: 0,
    lastGizmoType: null,
  });

  const materialsRef = useRef<{
    base: StandardMaterial | null;
    hover: StandardMaterial | null;
    active: StandardMaterial | null;
  }>({
    base: null,
    hover: null,
    active: null,
  });

  // Init Materials
  useEffect(() => {
    if (!scene) return;
    
    let baseMat = scene.getMaterialByName('sectionGizmoHandleMat') as StandardMaterial;
    if (!baseMat) { /* Assumed created in component */ }
    materialsRef.current.base = baseMat;

    let hoverMat = scene.getMaterialByName('sectionGizmoHoverMat') as StandardMaterial;
    if (!hoverMat) {
      hoverMat = new StandardMaterial('sectionGizmoHoverMat', scene);
      hoverMat.emissiveColor = Color3.FromHexString(SECTION_GIZMO_CONFIG.colors.hover);
      hoverMat.disableLighting = true;
    }
    materialsRef.current.hover = hoverMat;

    let activeMat = scene.getMaterialByName('sectionGizmoActiveMat') as StandardMaterial;
    if (!activeMat) {
      activeMat = new StandardMaterial('sectionGizmoActiveMat', scene);
      activeMat.emissiveColor = Color3.FromHexString(SECTION_GIZMO_CONFIG.colors.active);
      activeMat.disableLighting = true;
    }
    materialsRef.current.active = activeMat;
  }, [scene]);

  useEffect(() => {
    const canvas = sectionCanvasRef.current;
    if (!scene || !canvas || !sectionCamera) return;

    const pickGizmo = (e: PointerEvent): Mesh | null => {
        const { x, y } = getPointerRelativePos(e, canvas);
        const ray = createCustomPickingRay(x, y, canvas, sectionCamera);
        const pickResult = scene.pickWithRay(ray, (mesh) => {
          return (
            mesh.isPickable &&
            mesh.metadata?.isSectionGizmo === true &&
            mesh.metadata?.buildingId === selectedBuildingId &&
            (mesh.layerMask & sectionCamera.layerMask) !== 0
          );
        });
        return pickResult?.hit ? (pickResult.pickedMesh as Mesh) : null;
    };

    const restoreBaseMaterial = (mesh: Mesh) => {
      if (!mesh.isDisposed()) {
         const baseMat = scene.getMaterialByName('sectionGizmoButtonMat') as StandardMaterial;
         if (baseMat) mesh.material = baseMat;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (!selectedBuildingId) return;

      canvas.setPointerCapture(e.pointerId);

      const hitMesh = pickGizmo(e);
      if (!hitMesh) return;

      const building = buildings.find((b) => b.id === selectedBuildingId);
      if (!building) return;

      const gizmoType = hitMesh.metadata?.type as 'totalHeight' | 'ridge' | 'eave' | 'slope';
      if (!gizmoType) return;

      // --- DOUBLE CLICK LOGIC ---
      const now = Date.now();
      if (
        clickRef.current.lastGizmoType === gizmoType &&
        now - clickRef.current.lastClickTime < SECTION_GIZMO_CONFIG.doubleClick.timeout
      ) {
        handleDoubleClick(building, gizmoType, onUpdateBuilding, onOpenInput);
        clickRef.current.lastClickTime = 0;
        clickRef.current.lastGizmoType = null;
        return;
      }
      clickRef.current.lastClickTime = now;
      clickRef.current.lastGizmoType = gizmoType;

      // Start Drag Logic
      let slope = 0;
      let ridgeHeight = 0;
      if(building.type === 'gable') {
          slope = building.roof.slope;
          const slopeRad = (slope * Math.PI) / 180;
          const halfWidth = building.roof.width / 2;
          const rise = halfWidth * Math.tan(slopeRad);
          ridgeHeight = building.wallHeight + rise;
      }

      if (materialsRef.current.active) {
        hitMesh.material = materialsRef.current.active;
      }
      hoverRef.current = hitMesh;

      dragRef.current = {
        isDragging: true,
        gizmoType,
        buildingId: selectedBuildingId,
        startY: e.clientY,
        initialWallHeight: building.wallHeight,
        initialSlope: slope,
        initialRidgeHeight: ridgeHeight,
        handleMesh: hitMesh,
      };
    };

    const handlePointerMove = (e: PointerEvent) => {
        // --- DRAG LOGIC ---
        if (dragRef.current.isDragging && dragRef.current.buildingId) {
            // Convert mouse movement to world space delta
            // Moving mouse UP (negative clientY delta) increases height (positive heightDelta)
            const deltaY = dragRef.current.startY - e.clientY;
            const sensitivity = SECTION_GIZMO_CONFIG.drag.sensitivity;
            const heightDelta = deltaY * sensitivity;

            const building = buildings.find((b) => b.id === dragRef.current.buildingId);
            if (!building) return;

            const { gizmoType, initialWallHeight, initialRidgeHeight } = dragRef.current;
            const { minWallHeight, minSlope, maxSlope } = SECTION_GIZMO_CONFIG.drag;
            const halfWidth = building.roof.width / 2;

            // FLAT ROOF: Simple height adjustment
            if (gizmoType === 'totalHeight' && building.type === 'flat') {
              const newWallHeight = Math.max(minWallHeight, initialWallHeight + heightDelta);
              onUpdateBuilding(building.id, { wallHeight: newWallHeight });
            }
            // GABLE ROOF - RIDGE HANDLE: Dragging the peak (top of triangle)
            // Strategy: Fix the eave (wall height), adjust slope to reach new ridge height
            else if (gizmoType === 'ridge' && building.type === 'gable') {
              // Calculate new ridge height from mouse delta
              const newRidgeHeight = initialRidgeHeight + heightDelta;

              // Rise = vertical distance from eave to ridge
              const newRise = Math.max(0, newRidgeHeight - building.wallHeight);

              // Convert rise/run to slope angle using arctangent
              // slope (degrees) = atan(rise / halfWidth) × 180/π
              const newSlope = Math.atan(newRise / halfWidth) * (180 / Math.PI);
              const clampedSlope = Math.max(minSlope, Math.min(maxSlope, newSlope));

              onUpdateBuilding(building.id, { roof: { ...building.roof, slope: clampedSlope } as any });
            }
            // GABLE ROOF - SLOPE HANDLE: Dragging the midpoint of the roof face
            // Strategy: Midpoint is at (wallHeight + rise/2). When dragged, we reverse-engineer the rise needed.
            else if (gizmoType === 'slope' && building.type === 'gable') {
              // Calculate where the midpoint currently is
              const initialRise = initialRidgeHeight - initialWallHeight;
              const initialMidPointHeight = initialWallHeight + (initialRise / 2);

              // Apply mouse delta to get target midpoint height
              const targetMidPointHeight = initialMidPointHeight + heightDelta;

              // Reverse-engineer the rise: if midpoint is at wall + rise/2,
              // then rise = 2 × (midpoint - wall)
              let targetRise = 2 * (targetMidPointHeight - initialWallHeight);
              targetRise = Math.max(0, targetRise);

              // Convert rise to slope angle
              const newSlope = Math.atan(targetRise / halfWidth) * (180 / Math.PI);
              const clampedSlope = Math.max(minSlope, Math.min(maxSlope, newSlope));

              onUpdateBuilding(building.id, { roof: { ...building.roof, slope: clampedSlope } as any });
            }
            // GABLE ROOF - EAVE HANDLE: Dragging the wall top (where roof meets wall)
            // Strategy: Fix the ridge height, adjust wall height and slope together
            else if (gizmoType === 'eave' && building.type === 'gable') {
              // Calculate target wall height from mouse delta
              let targetWallHeight = Math.max(minWallHeight, initialWallHeight + heightDelta);

              // Calculate required rise to maintain fixed ridge height
              let targetRise = initialRidgeHeight - targetWallHeight;
              if (targetRise < 0) targetRise = 0;

              // Convert to slope angle
              const targetSlopeDeg = Math.atan(targetRise / halfWidth) * (180 / Math.PI);

              let finalSlope = targetSlopeDeg;
              let finalWallHeight = targetWallHeight;

              // Handle slope constraints: if slope would be too shallow/steep,
              // clamp slope and adjust wall height to maintain ridge position
              if (targetSlopeDeg < minSlope) {
                finalSlope = minSlope;
                const riseAtMin = halfWidth * Math.tan((minSlope * Math.PI) / 180);
                finalWallHeight = initialRidgeHeight - riseAtMin;
              } else if (targetSlopeDeg > maxSlope) {
                finalSlope = maxSlope;
                const riseAtMax = halfWidth * Math.tan((maxSlope * Math.PI) / 180);
                finalWallHeight = initialRidgeHeight - riseAtMax;
              }

              finalWallHeight = Math.max(minWallHeight, finalWallHeight);

              onUpdateBuilding(building.id, {
                wallHeight: finalWallHeight,
                roof: { ...building.roof, slope: finalSlope } as any,
              });
            }
            return;
        }
        
        // --- HOVER LOGIC ---
        const hitMesh = pickGizmo(e);
        if (hoverRef.current && hoverRef.current !== hitMesh) {
            restoreBaseMaterial(hoverRef.current);
            hoverRef.current = null;
        }
        if (hitMesh && hitMesh !== hoverRef.current) {
            if (materialsRef.current.hover) {
            hitMesh.material = materialsRef.current.hover;
            }
            hoverRef.current = hitMesh;
        }
    };

    const handlePointerUp = (e: PointerEvent) => {
        canvas.releasePointerCapture(e.pointerId);
        if (dragRef.current.isDragging && dragRef.current.handleMesh) {
            const hitMesh = pickGizmo(e);
            const stillHovering = hitMesh === dragRef.current.handleMesh;
            if (stillHovering && materialsRef.current.hover) {
                dragRef.current.handleMesh.material = materialsRef.current.hover;
                hoverRef.current = dragRef.current.handleMesh;
            } else {
                restoreBaseMaterial(dragRef.current.handleMesh);
                hoverRef.current = null;
            }
            dragRef.current.isDragging = false;
            dragRef.current.handleMesh = null;
        }
    };

    const handlePointerLeave = (e: PointerEvent) => {
        if (dragRef.current.isDragging) { handlePointerUp(e); return; }
        if (hoverRef.current) { restoreBaseMaterial(hoverRef.current); hoverRef.current = null; }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [scene, sectionCamera, sectionCanvasRef, buildings, selectedBuildingId, onUpdateBuilding, onOpenInput]);
}

// Helper to trigger Modal
function handleDoubleClick(
  building: BuildingData,
  gizmoType: string,
  onUpdateBuilding: (id: string, updates: Partial<BuildingData>) => void,
  onOpenInput: (req: InputRequest) => void
) {
  // FLAT ROOF
  if (gizmoType === 'totalHeight' && building.type === 'flat') {
    onOpenInput({
      title: 'Set Wall Height',
      initialValue: building.wallHeight,
      min: SECTION_GIZMO_CONFIG.drag.minWallHeight,
      onConfirm: (val) => onUpdateBuilding(building.id, { wallHeight: val }),
    });
  }
  // GABLE ROOF
  else if (building.type === 'gable') {
    // Calculate current ridge height for initialization
    const halfWidth = building.roof.width / 2;
    const slopeRad = (building.roof.slope * Math.PI) / 180;
    const rise = halfWidth * Math.tan(slopeRad);
    const ridgeHeight = building.wallHeight + rise;

    // 1. RIDGE -> Set Total Height
    if (gizmoType === 'ridge') {
      onOpenInput({
        title: 'Set Ridge Height',
        initialValue: ridgeHeight, // Pass calculated height
        min: building.wallHeight, // Ridge cannot be below eave
        onConfirm: (val) => {
           // Calculate new slope from new height
           const newRise = Math.max(0, val - building.wallHeight);
           const newSlope = Math.atan(newRise / halfWidth) * (180 / Math.PI);
           onUpdateBuilding(building.id, { roof: { ...building.roof, slope: newSlope } as any });
        },
      });
    } 
    
    // 2. SLOPE -> Set Angle
    else if (gizmoType === 'slope') {
      onOpenInput({
        title: 'Set Roof Slope',
        initialValue: building.roof.slope,
        min: SECTION_GIZMO_CONFIG.drag.minSlope,
        max: SECTION_GIZMO_CONFIG.drag.maxSlope,
        onConfirm: (val) => onUpdateBuilding(building.id, { roof: { ...building.roof, slope: val } as any }),
      });
    } 
    
    // 3. EAVE -> Set Wall Height
    else if (gizmoType === 'eave') {
      onOpenInput({
        title: 'Set Eave Height',
        initialValue: building.wallHeight,
        min: SECTION_GIZMO_CONFIG.drag.minWallHeight,
        onConfirm: (val) => onUpdateBuilding(building.id, { wallHeight: val }),
      });
    }
  }
}