import React, { useEffect, useRef } from 'react';
import {
  Scene,
  Vector3,
  MeshBuilder,
  Color3,
  Mesh,
  Matrix
} from '@babylonjs/core';
import type { BuildingData } from '../../types';
import { useScene } from '../../context/useScene';
import { GIZMO_CONFIG } from '../../config/gizmo';
import { INTERACTION_CONFIG } from '../../config/interaction';

interface TransformGizmoProps {
  building: BuildingData;
  scene: Scene | null;
}

export const TransformGizmo: React.FC<TransformGizmoProps> = ({
  building,
  scene,
}) => {
  const { materialManager } = useScene();
  const gizmosRef = useRef<Record<string, Mesh>>({});
  
  useEffect(() => {
    return () => {
      Object.values(gizmosRef.current).forEach(m => !m.isDisposed() && m.dispose());
      gizmosRef.current = {};
    };
  }, [scene]);

  useEffect(() => {
    if (!scene || !materialManager) return;

    const { roof, rotation, wallHeight, id, position } = building;
    const roofWidth = roof.width;
    const roofLength = roof.length;
    
    const halfW = roofWidth / 2;
    const halfL = roofLength / 2;
    const yPos = wallHeight + GIZMO_CONFIG.positioning.yOffset;

    const localToWorld = (lx: number, lz: number): Vector3 => {
      const vec = new Vector3(lx, 0, lz);
      const matrix = Matrix.RotationY(rotation);
      const rotated = Vector3.TransformCoordinates(vec, matrix);
      return position.add(new Vector3(rotated.x, yPos, rotated.z));
    };

    const cXAxis = Color3.FromHexString(GIZMO_CONFIG.colors.xAxis);
    const cZAxis = Color3.FromHexString(GIZMO_CONFIG.colors.zAxis);
    const cCorner = Color3.FromHexString(GIZMO_CONFIG.colors.corner);
    const cRotate = Color3.FromHexString(GIZMO_CONFIG.colors.rotate);

    const cornerSize = GIZMO_CONFIG.sizes.cornerSize;
    const barLength = GIZMO_CONFIG.sizes.barLength;
    const barThickness = GIZMO_CONFIG.sizes.barThickness;

    const handlesDef = [
      { type: 'corner-nw', lx: -halfW, lz: -halfL, color: cCorner, shape: 'box', size: new Vector3(cornerSize, cornerSize, cornerSize) },
      { type: 'corner-ne', lx:  halfW, lz: -halfL, color: cCorner, shape: 'box', size: new Vector3(cornerSize, cornerSize, cornerSize) },
      { type: 'corner-sw', lx: -halfW, lz:  halfL, color: cCorner, shape: 'box', size: new Vector3(cornerSize, cornerSize, cornerSize) },
      { type: 'corner-se', lx:  halfW, lz:  halfL, color: cCorner, shape: 'box', size: new Vector3(cornerSize, cornerSize, cornerSize) },
      
      { type: 'edge-n', lx: 0, lz: -halfL, color: cZAxis, shape: 'box', size: new Vector3(barLength, barThickness, barThickness) },
      { type: 'edge-s', lx: 0, lz:  halfL, color: cZAxis, shape: 'box', size: new Vector3(barLength, barThickness, barThickness) },
      { type: 'edge-w', lx: -halfW, lz: 0, color: cXAxis, shape: 'box', size: new Vector3(barThickness, barThickness, barLength) },
      { type: 'edge-e', lx:  halfW, lz: 0, color: cXAxis, shape: 'box', size: new Vector3(barThickness, barThickness, barLength) },

      // Rotation Gizmo (Puck only, no stick)
      { type: 'rotate', lx: 0, lz: -halfL - GIZMO_CONFIG.positioning.rotateDistance, color: cRotate, shape: 'puck', size: new Vector3(GIZMO_CONFIG.sizes.rotatePuck.diameter, GIZMO_CONFIG.sizes.rotatePuck.height, GIZMO_CONFIG.sizes.rotatePuck.diameter) },
    ];

    handlesDef.forEach(({ type, lx, lz, color, shape, size }) => {
      let mesh = gizmosRef.current[type];
      const pos = localToWorld(lx, lz);

      if (!mesh || mesh.isDisposed()) {
        const metadata = { 
          type, 
          buildingId: id, 
          isGizmo: true,
          baseColor: color.clone(),
          localPos: new Vector3(lx, 0, lz)
        };

        if (shape === 'puck') {
          mesh = MeshBuilder.CreateCylinder(`gizmo_${type}`, { 
            diameter: size.x, 
            height: size.y, 
            tessellation: 32 
          }, scene);
        } else {
          mesh = MeshBuilder.CreateBox(`gizmo_${type}`, { width: size.x, height: size.y, depth: size.z }, scene);
        }

        mesh.material = materialManager.getGizmoMaterial(
          type.startsWith('corner') ? GIZMO_CONFIG.colors.corner :
          type.startsWith('edge-w') || type.startsWith('edge-e') ? GIZMO_CONFIG.colors.xAxis :
          type.startsWith('edge-n') || type.startsWith('edge-s') ? GIZMO_CONFIG.colors.zAxis :
          GIZMO_CONFIG.colors.rotate
        );
        
        mesh.isPickable = true;
        mesh.renderingGroupId = GIZMO_CONFIG.rendering.renderingGroupId;
        mesh.metadata = metadata;
        mesh.layerMask = INTERACTION_CONFIG.layerMasks.gizmos;

        gizmosRef.current[type] = mesh;
      }

      mesh.position.copyFrom(pos);
      mesh.rotation.y = rotation;
      
      if (mesh.metadata) {
          mesh.metadata.localPos = new Vector3(lx, 0, lz);
          mesh.metadata.buildingId = id;
      }
    });

    Object.keys(gizmosRef.current).forEach(key => {
        if (!handlesDef.find(h => h.type === key)) {
            gizmosRef.current[key].dispose();
            delete gizmosRef.current[key];
        }
    });

  }, [building, scene, materialManager]); 

  return null;
};