
import { useEffect, useState } from 'react';
import { Scene, Mesh, Vector3 } from '@babylonjs/core';
import type { InteractionMode, BuildingData } from '../../types';
import { createCompleteBuilding } from './buildingHelpers';
import { MaterialManager } from '../../systems/MaterialManager';
import { BUILDING_CONFIG } from '../../config/building';
import { MATERIAL_CONFIG } from '../../config/materials';
import { INTERACTION_CONFIG } from '../../config/interaction';

/**
 * Hook: Ghost Building Preview
 *
 * Creates and manages a semi-transparent "ghost" building preview.
 */
export const useGhostBuilding = (
  scene: Scene | null,
  materialManager: MaterialManager | null,
  interactionMode: InteractionMode
): Mesh[] => {
  const [ghostMeshes, setGhostMeshes] = useState<Mesh[]>([]);

  useEffect(() => {
    // Only show ghost in placement modes (not in select mode)
    if (!scene || !materialManager || interactionMode === 'select') {
      ghostMeshes.forEach(m => m.dispose());
      setGhostMeshes([]);
      return;
    }

    const roofType = interactionMode === 'place-flat' ? 'flat' : 'gable';

    // Create ghost building data with proper discriminated union types
    const ghostBuilding: BuildingData = roofType === 'flat'
      ? {
          id: 'ghost',
          type: 'flat',
          position: new Vector3(0, INTERACTION_CONFIG.ghostBuilding.hiddenYPosition, 0),
          rotation: BUILDING_CONFIG.defaults.flat.rotation,
          roof: {
            width: BUILDING_CONFIG.defaults.flat.roof.width,
            length: BUILDING_CONFIG.defaults.flat.roof.length,
            thickness: BUILDING_CONFIG.defaults.flat.roof.thickness,
          },
          extension: BUILDING_CONFIG.defaults.flat.extension,
          wallHeight: BUILDING_CONFIG.defaults.flat.wallHeight,
        }
      : {
          id: 'ghost',
          type: 'gable',
          position: new Vector3(0, INTERACTION_CONFIG.ghostBuilding.hiddenYPosition, 0),
          rotation: BUILDING_CONFIG.defaults.gable.rotation,
          roof: {
            width: BUILDING_CONFIG.defaults.gable.roof.width,
            length: BUILDING_CONFIG.defaults.gable.roof.length,
            slope: BUILDING_CONFIG.defaults.gable.roof.slope,
          },
          extension: BUILDING_CONFIG.defaults.gable.extension,
          wallHeight: BUILDING_CONFIG.defaults.gable.wallHeight,
        };

    // Create the ghost meshes
    const createdMeshes = createCompleteBuilding(ghostBuilding, scene, materialManager);
    const finalMeshes: Mesh[] = [];

    // Configure ghost appearance
    createdMeshes.forEach(m => {
      // Setup base Ghost properties
      m.isPickable = false; // Ghost should not interfere with picking

      // Gable roofs use DOUBLESIDE geometry (front + back faces), so they appear darker
      // when semi-transparent. Use lower visibility for gable roof meshes to compensate.
      if (m.name.includes('gableRoof')) {
        m.visibility = MATERIAL_CONFIG.ghost.alpha * 0.6; // Reduce to ~0.3 for double-sided geometry
      } else {
        m.visibility = MATERIAL_CONFIG.ghost.alpha;
      }

      // Handle Render Groups:
      // - Guides (Ridge, Footprint) should stay in their specific group (usually 1) to render on top
      // - Walls/Roofs move to Default group (0) or stay as is.
      if (m.renderingGroupId !== INTERACTION_CONFIG.renderingGroups.guides) {
         m.renderingGroupId = INTERACTION_CONFIG.renderingGroups.default;
      }

      // Prevent culling artifacts during movement
      m.alwaysSelectAsActiveMesh = true;

      finalMeshes.push(m);
    });

    setGhostMeshes(finalMeshes);

    return () => {
      finalMeshes.forEach(m => m.dispose());
    };
  }, [scene, materialManager, interactionMode]);

  return ghostMeshes;
};



