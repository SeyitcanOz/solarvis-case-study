
import { Scene, MeshBuilder, Mesh, Vector3, Color4 } from '@babylonjs/core';
import { MaterialManager } from '../../systems/MaterialManager';
import type { BuildingData } from '../../types';
import { MATERIAL_CONFIG } from '../../config/materials';

/**
 * Wall Geometry Data
 * Data structure representing wall dimensions and position
 */
interface WallGeometryData {
  width: number;
  height: number;
  depth: number;
  position: Vector3;
  rotation: number;
}

/**
 * Calculate wall geometry from building data
 * Implements "Outside-In" approach:
 * - Wall dimensions derived from roof dimensions
 * - Flat Roof: wallSize = roofSize - (2 * extension) [4-sided overhang]
 * - Gable Roof: wallWidth = roofWidth - (2 * extension), wallLength = roofLength [2-sided overhang]
 */
const calculateWallGeometry = (building: BuildingData): WallGeometryData => {
  const isGable = building.type === 'gable';

  // Calculate derived wall dimensions
  // For Gable: Overhang applies only to width (eaves), not length (gable ends)
  const wallWidth = building.roof.width - 2 * building.extension;
  const wallLength = isGable
    ? building.roof.length
    : building.roof.length - 2 * building.extension;

  return {
    width: wallWidth,
    height: building.wallHeight,
    depth: wallLength,
    position: new Vector3(
      building.position.x,
      building.wallHeight / 2,  // Center vertically
      building.position.z
    ),
    rotation: building.rotation,
  };
};

/**
 * Helper to apply position to a mesh after creation
 * Sets components individually to trigger Babylon's update observers properly
 */
const applyMeshPosition = (mesh: Mesh, x: number, y: number, z: number, rotation: number = 0) => {
  mesh.position.x = x;
  mesh.position.y = y;
  mesh.position.z = z;
  mesh.rotation.y = rotation;

  // Force immediate world matrix computation
  mesh.computeWorldMatrix(true);
};

/**
 * Create wall mesh from geometry data
 * Handles Babylon API calls only
 */
const createWallMesh = (
  geometryData: WallGeometryData,
  buildingId: string,
  scene: Scene,
  materialManager: MaterialManager
): Mesh => {
  // Create box for walls (at origin initially)
  const walls = MeshBuilder.CreateBox(
    `walls_${buildingId}`,
    {
      width: geometryData.width,
      height: geometryData.height,
      depth: geometryData.depth,
      updatable: false,
    },
    scene
  );

  // Set position AFTER creation
  applyMeshPosition(
    walls,
    geometryData.position.x,
    geometryData.position.y,
    geometryData.position.z,
    geometryData.rotation
  );

  // Use shared wall material from MaterialManager
  walls.material = materialManager.getWallMaterial();
  walls.isPickable = true;

  // Enable edge rendering with black edges
  walls.enableEdgesRendering();
  walls.edgesWidth = MATERIAL_CONFIG.edges.width;
  walls.edgesColor = new Color4(
    MATERIAL_CONFIG.edges.color.r,
    MATERIAL_CONFIG.edges.color.g,
    MATERIAL_CONFIG.edges.color.b,
    MATERIAL_CONFIG.edges.color.a
  );

  return walls;
};


/**
 * Creates walls for a building
 *
 * This factory function:
 * 1. Calculates wall geometry
 * 2. Creates mesh from calculations (Babylon API)
 * 3. Returns the wall mesh
 */
export const createWalls = (
  building: BuildingData,
  scene: Scene,
  materialManager: MaterialManager
): Mesh => {
  const geometry = calculateWallGeometry(building);
  return createWallMesh(geometry, building.id, scene, materialManager);
};


