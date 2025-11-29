
import { Scene, MeshBuilder, Mesh, Vector3, Color3, LinesMesh } from '@babylonjs/core';
import type { BuildingData } from '../../types';
import { MATERIAL_CONFIG } from '../../config/materials';
import { INTERACTION_CONFIG } from '../../config/interaction';


/**
 * Footprint Guide Line Data (Wall Base)
 */
interface GuideGeometryData {
  corners: Vector3[];
  buildingPosition: Vector3;
  rotation: number;
}

const calculateFootprintGuide = (building: BuildingData): GuideGeometryData => {
  const isGable = building.type === 'gable';

  // Gable = 2-sided overhang (width only), Flat = 4-sided overhang
  const wallWidth = building.roof.width - 2 * building.extension;
  const wallLength = isGable
    ? building.roof.length
    : building.roof.length - 2 * building.extension;

  const halfWidth = wallWidth / 2;
  const halfLength = wallLength / 2;
  // Place slightly above ground to avoid z-fighting with map
  const yOffset = INTERACTION_CONFIG.guides.footprintOffset;

  const corners = [
    new Vector3(-halfWidth, yOffset, -halfLength),
    new Vector3(halfWidth, yOffset, -halfLength),
    new Vector3(halfWidth, yOffset, halfLength),
    new Vector3(-halfWidth, yOffset, halfLength),
    new Vector3(-halfWidth, yOffset, -halfLength),
  ];

  return {
    corners,
    buildingPosition: building.position,
    rotation: building.rotation,
  };
};

/**
 * Extension Guide Line Data (Roof Overhang Projection)
**/
const calculateExtensionGuide = (building: BuildingData): GuideGeometryData => {
  const halfWidth = building.roof.width / 2;
  const halfLength = building.roof.length / 2;

  // Project to GROUND level
  const yOffset = INTERACTION_CONFIG.guides.extensionOffset;

  const corners = [
    new Vector3(-halfWidth, yOffset, -halfLength),
    new Vector3(halfWidth, yOffset, -halfLength),
    new Vector3(halfWidth, yOffset, halfLength),
    new Vector3(-halfWidth, yOffset, halfLength),
    new Vector3(-halfWidth, yOffset, -halfLength),
  ];

  return {
    corners,
    buildingPosition: building.position,
    rotation: building.rotation,
  };
};

/**
 * Ridge Guide Data (Roof Peak for Gable)
 */
const calculateRidgeGuide = (building: BuildingData): GuideGeometryData | null => {
  if (building.type !== 'gable') return null;

  const halfLength = building.roof.length / 2;

  // Calculate Peak Height - type narrowing ensures building.roof.slope exists
  const slopeDegrees = building.roof.slope;
  const slopeRadians = (slopeDegrees * Math.PI) / 180;
  const ridgeRise = (building.roof.width / 2) * Math.tan(slopeRadians);
  const totalHeight = building.wallHeight + ridgeRise;

  // Small offset to ensure it renders on top of the roof mesh
  const yOffset = totalHeight + 0.05;

  const points = [
    new Vector3(0, yOffset, -halfLength),
    new Vector3(0, yOffset, halfLength)
  ];

  return {
    corners: points,
    buildingPosition: building.position,
    rotation: building.rotation,
  };
};

const applyMeshPosition = (mesh: Mesh, x: number, y: number, z: number, rotation: number = 0) => {
  mesh.position.x = x;
  mesh.position.y = y;
  mesh.position.z = z;
  mesh.rotation.y = rotation;
  mesh.computeWorldMatrix(true);
};

const createLineMesh = (
  name: string,
  data: GuideGeometryData,
  colorCfg: { r: number, g: number, b: number },
  scene: Scene,
  isDashed: boolean = false, // Optional flag to tag specific guides (like Ridge)
  metadataProps: Record<string, any> = {}
): Mesh => {
  let mesh: LinesMesh;

  if (isDashed) {
    mesh = MeshBuilder.CreateDashedLines(
      name,
      {
        points: data.corners,
        dashSize: MATERIAL_CONFIG.guideLines.dashSize,
        gapSize: MATERIAL_CONFIG.guideLines.gapSize,
      },
      scene
    );
  } else {
    mesh = MeshBuilder.CreateLines(
      name,
      { points: data.corners },
      scene
    );
  }

  applyMeshPosition(
    mesh,
    data.buildingPosition.x,
    0, // Y is baked into the points geometry
    data.buildingPosition.z,
    data.rotation
  );

  mesh.color = new Color3(colorCfg.r, colorCfg.g, colorCfg.b);
  mesh.isPickable = false;
  mesh.renderingGroupId = INTERACTION_CONFIG.renderingGroups.guides;

  // Merge any custom metadata
  if (Object.keys(metadataProps).length > 0) {
      mesh.metadata = { ...mesh.metadata, ...metadataProps };
  }

  return mesh;
};


export const createGuideLines = (
  building: BuildingData,
  scene: Scene
): Mesh[] => {
  const meshes: Mesh[] = [];

  // 1. Footprint (Red box at base)
  const footprintData = calculateFootprintGuide(building);
  meshes.push(createLineMesh(
    `footprint_${building.id}`,
    footprintData,
    MATERIAL_CONFIG.guideLines.footprint,
    scene
  ));

  // 2. Extension (Dashed Yellow box on ground)
  const extensionData = calculateExtensionGuide(building);
  meshes.push(createLineMesh(
    `extension_${building.id}`,
    extensionData,
    MATERIAL_CONFIG.guideLines.extension,
    scene,
    true // Dashed
  ));

  // 3. Ridge (Yellow line at peak) - Only for Gable
  if (building.type === 'gable') {
    const ridgeData = calculateRidgeGuide(building);
    if (ridgeData) {
      meshes.push(createLineMesh(
        `ridge_${building.id}`,
        ridgeData,
        MATERIAL_CONFIG.guideLines.ridge, // Uses defined Gold/Yellow color
        scene,
        false,
        { isRidge: true } // <--- MARKED AS RIDGE HERE
      ));
    }
  }

  return meshes;
};


