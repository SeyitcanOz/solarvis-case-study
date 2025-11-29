import { Scene, MeshBuilder, Mesh, Vector3, Color4, EdgesRenderer } from '@babylonjs/core';
import { MaterialManager } from '../../systems/MaterialManager';
import type { BuildingData } from '../../types';

interface FlatRoofGeometryData {
  width: number;
  height: number;
  depth: number;
  position: Vector3;
  rotation: number;
  thickness: number;
}

const calculateFlatRoofGeometry = (building: BuildingData): FlatRoofGeometryData => {

  if (building.type !== 'flat') {
    throw new Error('calculateFlatRoofGeometry called with non-flat building');
  }

  const thickness = building.roof.thickness;
  return {
    width: building.roof.width,
    height: thickness,
    depth: building.roof.length,
    position: new Vector3(
      building.position.x,
      building.wallHeight + thickness / 2,
      building.position.z
    ),
    rotation: building.rotation,
    thickness,
  };
};

interface GableRoofGeometryData {
  profile: Vector3[];
  path: Vector3[];
  position: Vector3;
  rotation: number;
}

const calculateGableRoofGeometry = (building: BuildingData): GableRoofGeometryData => {

  if (building.type !== 'gable') {
    throw new Error('calculateGableRoofGeometry called with non-gable building');
  }

  const slopeDegrees = building.roof.slope;
  const slopeRadians = (slopeDegrees * Math.PI) / 180;
  const halfWidth = building.roof.width / 2;
  const ridgeRise = halfWidth * Math.tan(slopeRadians);

  const profile = [
    new Vector3(-halfWidth, 0, 0),
    new Vector3(0, ridgeRise, 0),
    new Vector3(halfWidth, 0, 0),
    new Vector3(-halfWidth, 0, 0),
  ];

  const path = [
    new Vector3(0, 0, -building.roof.length / 2),
    new Vector3(0, 0, building.roof.length / 2),
  ];

  return {
    profile,
    path,
    position: new Vector3(
      building.position.x,
      building.wallHeight,
      building.position.z
    ),
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

const createFlatRoofMesh = (
  geometryData: FlatRoofGeometryData,
  buildingId: string,
  scene: Scene,
  materialManager: MaterialManager
): Mesh => {
  const roof = MeshBuilder.CreateBox(
    `flatRoof_${buildingId}`,
    {
      width: geometryData.width,
      height: geometryData.height,
      depth: geometryData.depth,
      updatable: false,
    },
    scene
  );

  applyMeshPosition(
    roof,
    geometryData.position.x,
    geometryData.position.y,
    geometryData.position.z,
    geometryData.rotation
  );

  roof.material = materialManager.getFlatRoofMaterial();
  roof.isPickable = true;

  return roof;
};

const createGableRoofMesh = (
  geometryData: GableRoofGeometryData,
  buildingId: string,
  scene: Scene,
  materialManager: MaterialManager
): Mesh => {
  const roof = MeshBuilder.ExtrudeShape(
    `gableRoof_${buildingId}`,
    {
      shape: geometryData.profile,
      path: geometryData.path,
      cap: Mesh.CAP_ALL,
      sideOrientation: Mesh.DOUBLESIDE,
      updatable: false,
    },
    scene
  );

  applyMeshPosition(
    roof,
    geometryData.position.x,
    geometryData.position.y,
    geometryData.position.z,
    geometryData.rotation
  );

  roof.material = materialManager.getGableRoofMaterial();
  roof.isPickable = true;

  return roof;
};


/**
 * Creates roof meshes (solids only, no edge lines)
 */
export const createRoof = (
  building: BuildingData,
  scene: Scene,
  materialManager: MaterialManager
): Mesh[] => {
  if (building.type === 'flat') {
    const geometry = calculateFlatRoofGeometry(building);
    return [createFlatRoofMesh(geometry, building.id, scene, materialManager)];
  } else {
    const geometry = calculateGableRoofGeometry(building);
    return [createGableRoofMesh(geometry, building.id, scene, materialManager)];
  }
};