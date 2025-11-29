import React, { useEffect, useRef } from 'react';
import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Mesh,
  DynamicTexture,
  LinesMesh,
  TransformNode,
  Quaternion
} from '@babylonjs/core';
import type { BuildingData } from '../../types';
import { useScene } from '../../context/useScene';
import { SECTION_GIZMO_CONFIG } from '../../config/sectionGizmo';
import { INTERACTION_CONFIG } from '../../config/interaction';

interface SectionGizmoProps {
  building: BuildingData;
  scene: Scene | null;
}

interface GizmoData {
  type: string;
  height: number;
  root: TransformNode;
  button: Mesh;
  label: Mesh;
  labelTexture: DynamicTexture;
  line: LinesMesh | null;
}

export const SectionGizmo: React.FC<SectionGizmoProps> = ({ building, scene }) => {
  const { sectionCamera } = useScene();
  const gizmosRef = useRef<GizmoData[]>([]);
  
  const materialsRef = useRef<{
    button: StandardMaterial;
    labelBg: StandardMaterial;
    lineColor: Color3;
  } | null>(null);

  // 1. Cleanup
  const cleanup = () => {
    gizmosRef.current.forEach((g) => {
      if (g.line) g.line.dispose();
      g.labelTexture.dispose();
      g.root.dispose();
    });
    gizmosRef.current = [];
  };

  // 2. Init Materials
  useEffect(() => {
    if (!scene) return;
    
    const buttonMat = new StandardMaterial('sectionGizmoButtonMat', scene);
    buttonMat.emissiveColor = Color3.FromHexString(SECTION_GIZMO_CONFIG.colors.handle);
    buttonMat.disableLighting = true;
    buttonMat.backFaceCulling = false;

    const labelBgMat = new StandardMaterial('sectionGizmoLabelBgMat', scene);
    labelBgMat.emissiveColor = new Color3(0.1, 0.12, 0.15);
    labelBgMat.disableLighting = true;
    labelBgMat.backFaceCulling = false;

    materialsRef.current = { 
        button: buttonMat, 
        labelBg: labelBgMat,
        lineColor: new Color3(1, 1, 1) 
    };

    return () => {
      buttonMat.dispose();
      labelBgMat.dispose();
      materialsRef.current = null;
    };
  }, [scene]);

  // 3. Create Gizmo Structure
  useEffect(() => {
    if (!scene || !materialsRef.current) return;
    cleanup();

    const gizmoConfigs: { type: string; height: number; label: string }[] = [];

    if (building.type === 'flat') {
      const totalHeight = building.wallHeight + building.roof.thickness;
      gizmoConfigs.push({ type: 'totalHeight', height: totalHeight, label: `${totalHeight.toFixed(2)}` });
    } else if (building.type === 'gable') {
      const slopeRad = (building.roof.slope * Math.PI) / 180;
      const ridgeRise = (building.roof.width / 2) * Math.tan(slopeRad);
      const totalHeight = building.wallHeight + ridgeRise;

      // Ridge (Top)
      gizmoConfigs.push({ type: 'ridge', height: totalHeight, label: `Ridge: ${totalHeight.toFixed(2)}` });
      
      // Slope (Middle) - Positioned halfway up the roof rise
      const midRoofHeight = building.wallHeight + (ridgeRise / 2);
      gizmoConfigs.push({ type: 'slope', height: midRoofHeight, label: `Slope: ${building.roof.slope.toFixed(1)}°` });

      // Eave (Bottom)
      gizmoConfigs.push({ type: 'eave', height: building.wallHeight, label: `Eave: ${building.wallHeight.toFixed(2)}` });
    }

    gizmoConfigs.forEach(({ type, height, label }) => {
      const root = new TransformNode(`gizmo_root_${type}`, scene);
      
      const button = MeshBuilder.CreatePlane(`gizmo_btn_${type}`, { size: 1 }, scene);
      button.material = materialsRef.current!.button;
      button.parent = root;
      button.renderingGroupId = SECTION_GIZMO_CONFIG.rendering.renderingGroupId;
      button.layerMask = INTERACTION_CONFIG.layerMasks.sectionGizmos;
      button.isPickable = true;
      button.metadata = { isSectionGizmo: true, type, buildingId: building.id, height };

      const labelPlane = MeshBuilder.CreatePlane(`gizmo_lbl_${type}`, { width: 3, height: 1 }, scene);
      labelPlane.material = materialsRef.current!.labelBg;
      labelPlane.parent = root;
      labelPlane.position.x = 2.05;
      labelPlane.renderingGroupId = SECTION_GIZMO_CONFIG.rendering.renderingGroupId;
      labelPlane.layerMask = INTERACTION_CONFIG.layerMasks.sectionGizmos;
      labelPlane.isPickable = false;

      const texture = new DynamicTexture(`tex_${type}`, { width: 300, height: 100 }, scene, false);
      texture.hasAlpha = true;
      drawLabelText(texture, label);
      
      const textMat = new StandardMaterial(`mat_text_${type}`, scene);
      textMat.diffuseTexture = texture;
      textMat.emissiveTexture = texture;
      textMat.disableLighting = true;
      textMat.useAlphaFromDiffuseTexture = true;
      textMat.backFaceCulling = false;
      labelPlane.material = textMat;

      gizmosRef.current.push({ type, height, root, button, label: labelPlane, labelTexture: texture, line: null });
    });

    return cleanup;
  }, [building.id, building.type, scene]);

  // 4. Render Loop
  useEffect(() => {
    if (!scene || !sectionCamera || gizmosRef.current.length === 0) return;

    const updateGizmos = () => {
      const orthoHeight = (sectionCamera.orthoTop || 20) - (sectionCamera.orthoBottom || -20);
      const orthoWidth = (sectionCamera.orthoRight || 20) - (sectionCamera.orthoLeft || -20);
      const scale = orthoHeight * 0.05; 
      
      const cameraWorldMatrix = sectionCamera.getWorldMatrix();
      const cameraRotation = Quaternion.FromRotationMatrix(cameraWorldMatrix.getRotationMatrix());

      const leftDir = Vector3.TransformNormal(new Vector3(-1, 0, 0), cameraWorldMatrix).normalize();
      const rightDir = leftDir.scale(-1);

      const distLeft = Math.abs(sectionCamera.orthoLeft || 20);
      const distRight = Math.abs(sectionCamera.orthoRight || 20);
      const padding = 1.0 * scale;

      gizmosRef.current.forEach((gizmo) => {
        // --- POSITION ---
        const worldPos = new Vector3(sectionCamera.target.x, gizmo.height, sectionCamera.target.z)
          .add(leftDir.scale(distLeft - padding));
        
        gizmo.root.position.copyFrom(worldPos);
        gizmo.root.rotationQuaternion = cameraRotation;
        gizmo.root.scaling.setAll(scale); 

        // --- DASHED LINE (SKIP FOR SLOPE) ---
        if (gizmo.line) gizmo.line.dispose();

        if (gizmo.type !== 'slope') {
            const buffer = orthoWidth * 0.1;
            const p1 = new Vector3(sectionCamera.target.x, gizmo.height, sectionCamera.target.z)
              .add(leftDir.scale(distLeft + buffer));
            const p2 = new Vector3(sectionCamera.target.x, gizmo.height, sectionCamera.target.z)
              .add(rightDir.scale(distRight + buffer));

            gizmo.line = MeshBuilder.CreateDashedLines(null, {
                points: [p1, p2],
                dashSize: 30 * (scale / 5),
                gapSize: 20 * (scale / 5),
                dashNb: 100, 
            }, scene);
            
            gizmo.line.color = materialsRef.current!.lineColor;
            gizmo.line.alpha = 0.5;
            gizmo.line.renderingGroupId = SECTION_GIZMO_CONFIG.rendering.renderingGroupId;
            gizmo.line.layerMask = INTERACTION_CONFIG.layerMasks.sectionGizmos;
            gizmo.line.isPickable = false;
        }
      });
    };

    const observer = scene.onBeforeRenderObservable.add(updateGizmos);
    
    return () => {
      scene.onBeforeRenderObservable.remove(observer);
    };
  }, [scene, sectionCamera, building]);

  // 5. Update Labels on Value Change
  useEffect(() => {
    gizmosRef.current.forEach((gizmo) => {
      let newHeight = 0;
      let newLabel = '';

      if (gizmo.type === 'totalHeight' && building.type === 'flat') {
        newHeight = building.wallHeight + building.roof.thickness;
        newLabel = `Height: ${newHeight.toFixed(2)}`;
      } else if (building.type === 'gable') {
          const slopeRad = (building.roof.slope * Math.PI) / 180;
          const ridgeRise = (building.roof.width / 2) * Math.tan(slopeRad);

          if (gizmo.type === 'ridge') {
            newHeight = building.wallHeight + ridgeRise;
            newLabel = `Ridge: ${newHeight.toFixed(2)}`;
          } else if (gizmo.type === 'eave') {
            newHeight = building.wallHeight;
            newLabel = `Eave: ${newHeight.toFixed(2)}`;
          } else if (gizmo.type === 'slope') {
            // Recalculate midpoint height
            newHeight = building.wallHeight + (ridgeRise / 2);
            newLabel = `Slope: ${building.roof.slope.toFixed(1)}°`;
          }
      }

      if (newHeight > 0) {
        gizmo.height = newHeight;
        gizmo.button.metadata.height = newHeight;
        drawLabelText(gizmo.labelTexture, newLabel);
      }
    });
  }, [building.wallHeight, building.roof, building.type]);

  return null;
};

function drawLabelText(texture: DynamicTexture, text: string): void {
  const ctx = texture.getContext();
  ctx.fillStyle = '#1e293b'; 
  ctx.fillRect(0, 0, 300, 100);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, 300, 100);
  ctx.font = 'bold 40px sans-serif'; 
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f8fafc'; 
  ctx.fillText(text, 150, 50);
  texture.update();
}