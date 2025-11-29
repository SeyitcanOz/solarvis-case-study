
import type { Vector3 } from '@babylonjs/core';

export type RoofType = 'flat' | 'gable';

/**
 * Base building properties shared by all building types
 */
interface BaseBuildingData {
  id: string;
  position: Vector3;
  rotation: number;
  wallHeight: number;
  extension: number;
}

/**
 * Building with flat roof
 */
export interface FlatRoofBuilding extends BaseBuildingData {
  type: 'flat';
  roof: {
    width: number;
    length: number;
    thickness: number;
  };
}

/**
 * Building with gable (dual pitch) roof
 */
export interface GableRoofBuilding extends BaseBuildingData {
  type: 'gable';
  roof: {
    width: number;
    length: number;
    slope: number;
  };
}

/**
 * Discriminated union of all building types
 * Use type narrowing with building.type to access type-specific properties
 */
export type BuildingData = FlatRoofBuilding | GableRoofBuilding;

/**
 * Helper type for partial updates to building data
 * Allows updating any property without breaking discriminated union
 */
export type BuildingUpdate =
  | Partial<Omit<BaseBuildingData, 'id'>>
  | { roof?: Partial<FlatRoofBuilding['roof']> | Partial<GableRoofBuilding['roof']> }
  | { position?: Vector3 }
  | { rotation?: number }
  | { wallHeight?: number }
  | { extension?: number };

export type InteractionMode = 'select' | 'place-flat' | 'place-gable';

export type GizmoHandleType =
  | 'corner-nw'
  | 'corner-ne'
  | 'corner-sw'
  | 'corner-se'
  | 'edge-n'
  | 'edge-s'
  | 'edge-e'
  | 'edge-w'
  | 'rotate';

export type SectionGizmoType = 'totalHeight' | 'ridge' | 'eave'| 'slope';

export type SectionViewSide = 'NE' | 'SE' | 'SW' | 'NW';

export interface BuildingDimensions {
  wallWidth: number;
  wallLength: number;
  ridgeRise?: number;
}