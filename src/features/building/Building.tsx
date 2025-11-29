
import React, { useEffect, useRef } from 'react';
import { Scene, Mesh, StandardMaterial, Color4 } from '@babylonjs/core';
import type { BuildingData } from '../../types';
import { updateBuildingMeshes } from './buildingHelpers'; 
import { useScene } from '../../context/useScene';

interface BuildingProps {
  building: BuildingData;
  scene: Scene | null;
  isSelected?: boolean;
}

const BuildingComponent: React.FC<BuildingProps> = ({
  building,
  scene,
  isSelected = false,
}) => {
  const { materialManager } = useScene();
  const meshesRef = useRef<Mesh[]>([]);
  const baseDataRef = useRef<BuildingData | null>(null);

  // --- MAIN EFFECT: DELEGATE TO HELPER ---
  useEffect(() => {
    if (!scene || !materialManager) return;

    // 1. Call the intelligent update function
    const { meshes, baseData } = updateBuildingMeshes(
      meshesRef.current,
      baseDataRef.current,
      building,
      scene,
      materialManager
    );

    // 2. Apply React-specific properties (Selection, Visibility)
    meshes.forEach((mesh) => {
      const isLine = mesh.getClassName().includes('Lines');
      
      // Ensure metadata is set (especially after a full rebuild)
      if (!mesh.metadata || mesh.metadata.buildingId !== building.id) {
          mesh.metadata = { 
            ...mesh.metadata, 
            buildingId: building.id,
            isTransparencyTarget: !isLine 
          };
          mesh.isPickable = true;
          mesh.isVisible = true;
          mesh.alwaysSelectAsActiveMesh = true;
      }
    });

    // 3. Update Refs
    meshesRef.current = meshes;
    baseDataRef.current = baseData;

  }, [building, scene, materialManager, isSelected]);

  // Cleanup
  useEffect(() => {
    return () => {
      meshesRef.current.forEach(m => !m.isDisposed() && m.dispose());
      meshesRef.current = [];
      baseDataRef.current = null;
    };
  }, []);

  return null;
};

export const Building = React.memo(BuildingComponent);


