import { Scene, Mesh, Vector3 } from '@babylonjs/core';
import type { BuildingData } from '../../types';
import { MaterialManager } from '../../systems/MaterialManager';
import { createWalls } from './BuildingFactory';
import { createRoof } from './RoofFactory';
import { createGuideLines } from './GuideFactory';

// --- HELPER: Dimension Calculation ---
const getComponentDimensions = (data: BuildingData, componentType: string) => {
  const isGable = data.type === 'gable';
  const wallWidth = data.roof.width - 2 * data.extension;
  const wallLength = isGable ? data.roof.length : data.roof.length - 2 * data.extension;

  // Calculate Roof Height (Y) for scaling
  // Flat: Thickness
  // Gable: Ridge Rise (height of the triangle part)
  let roofHeight = 1;
  if (data.type === 'flat') {
      roofHeight = data.roof.thickness;
  } else {
      // Gable Rise = (Width/2) * tan(slope)
      const slopeRad = (data.roof.slope * Math.PI) / 180;
      // Ensure we don't divide by zero or have 0 height later
      roofHeight = Math.max(0.01, (data.roof.width / 2) * Math.tan(slopeRad));
  }

  // Calculate Ridge Guide Total Height (from ground)
  let ridgeTotalHeight = 1;
  if (data.type === 'gable') {
      ridgeTotalHeight = data.wallHeight + roofHeight;
  }

  switch (componentType) {
    case 'wall': return { x: wallWidth, y: data.wallHeight, z: wallLength };
    case 'roof': return { x: data.roof.width, y: roofHeight, z: data.roof.length };
    case 'footprint': return { x: wallWidth, y: 1, z: wallLength };
    case 'extension': return { x: data.roof.width, y: 1, z: data.roof.length };
    case 'ridge': return { x: 1, y: ridgeTotalHeight, z: data.roof.length }; 
    default: return { x: 1, y: 1, z: 1 };
  }
};

/**
 * Creates a complete building (Walls + Roof + Guides)
 */
export const createCompleteBuilding = (
  building: BuildingData,
  scene: Scene,
  materialManager: MaterialManager
): Mesh[] => {
  const meshes: Mesh[] = [];
  meshes.push(createWalls(building, scene, materialManager));
  meshes.push(...createRoof(building, scene, materialManager));
  meshes.push(...createGuideLines(building, scene));

  meshes.forEach(mesh => {
    mesh.computeWorldMatrix(true);
    mesh.refreshBoundingInfo();
  });

  return meshes;
};

/**
 * Decides whether to Scale/Move existing meshes (Fast) or Recreate them (Slow).
 */
export const updateBuildingMeshes = (
  currentMeshes: Mesh[],
  prevData: BuildingData | null,
  currData: BuildingData,
  scene: Scene,
  materialManager: MaterialManager
): { meshes: Mesh[]; baseData: BuildingData } => {
  
  // 1. Check if we need a full rebuild
  // We generally only need to rebuild if the TOPOLOGY (Type) changes.
  // Almost all geometric changes (Width, Length, Height, Slope, Extension) 
  // can now be handled via scaling/positioning in the Fast Path.
  const needsRebuild = !prevData ||
    currentMeshes.length === 0 ||
    prevData.type !== currData.type;

  if (needsRebuild) {
    // --- SLOW PATH: DESTROY & RECREATE ---
    currentMeshes.forEach(m => !m.isDisposed() && m.dispose());
    const newMeshes = createCompleteBuilding(currData, scene, materialManager);
    return { meshes: newMeshes, baseData: currData };
  }

  // --- FAST PATH: UPDATE IN PLACE ---
  currentMeshes.forEach((mesh) => {
    if (mesh.isDisposed()) return;

    // A. Update Rotation
    mesh.rotation.y = currData.rotation;

    // B. Identify Component Type
    let type = 'unknown';
    if (mesh.name.includes('walls')) type = 'wall';
    else if (mesh.name.includes('Roof')) type = 'roof';
    else if (mesh.name.includes('footprint')) type = 'footprint';
    else if (mesh.name.includes('extension')) type = 'extension';
    else if (mesh.name.includes('ridge')) type = 'ridge';

    // C. Update Scale (New Dims / Old Dims)
    const oldDims = getComponentDimensions(prevData, type);
    const newDims = getComponentDimensions(currData, type);

    if (oldDims.x && oldDims.z && oldDims.y) {
      if (type === 'wall') {
        mesh.scaling.x = newDims.x / oldDims.x;
        mesh.scaling.z = newDims.z / oldDims.z;
        mesh.scaling.y = newDims.y / oldDims.y;
      } else if (type === 'ridge') {
        mesh.scaling.z = newDims.z / oldDims.z;
        // Scale Y to adjust ridge height (since guide origin is at Y=0)
        mesh.scaling.y = newDims.y / oldDims.y; 
      } else {
        // Roofs, Footprints, Extensions
        mesh.scaling.x = newDims.x / oldDims.x;
        mesh.scaling.z = newDims.z / oldDims.z;
        
        // Apply Y scaling to Roofs (handles Slope change or Flat Thickness change)
        if (type === 'roof') {
            mesh.scaling.y = newDims.y / oldDims.y;
        }
      }
    }

    // D. Update Position
    mesh.position.x = currData.position.x;
    mesh.position.z = currData.position.z;

    if (type === 'wall') {
      mesh.position.y = currData.wallHeight / 2;
    } else if (type === 'roof') {
      if (currData.type === 'flat') {
        const thickness = currData.roof.thickness;
        mesh.position.y = currData.wallHeight + thickness / 2;
      } else {
        // Gable roof origin is at the eaves (wall top)
        mesh.position.y = currData.wallHeight;
      }
    } else if (type === 'footprint' || type === 'extension') {
      mesh.position.y = 0;
    } else if (type === 'ridge') {
      // Ridge guide origin is 0, height is handled via Y-scaling calculated above
      mesh.position.y = 0;
    }

    mesh.computeWorldMatrix(true);
    // Update metadata ID in case ID changed (copy/paste scenarios)
    if (mesh.metadata) mesh.metadata.buildingId = currData.id;
  });

  // Return existing meshes, but KEEP prevData as the baseData
  // because the meshes are still technically built based on that geometry, just scaled.
  return { meshes: currentMeshes, baseData: prevData };
};