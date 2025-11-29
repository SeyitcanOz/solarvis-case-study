import { Scene, StandardMaterial, Color3 } from '@babylonjs/core';
import { MATERIAL_CONFIG } from '../config/materials';
import { GIZMO_CONFIG } from '../config/gizmo';

/**
 * MaterialManager
 * Centralized material creation and caching system.
 */
export class MaterialManager {
  private scene: Scene;
  private cache = new Map<string, StandardMaterial>();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  private createMaterialFromConfig(key: string, config: any): StandardMaterial {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const mat = new StandardMaterial(`${key}Material`, this.scene);
    mat.diffuseColor = new Color3(config.diffuse.r, config.diffuse.g, config.diffuse.b);
    mat.specularColor = new Color3(config.specular.r, config.specular.g, config.specular.b);
    mat.specularPower = config.specularPower;
    mat.alpha = config.alpha;
    mat.backFaceCulling = config.backFaceCulling;
    
    // Ambient color helps object not look pitch black in shadows
    mat.ambientColor = new Color3(config.diffuse.r * 0.4, config.diffuse.g * 0.4, config.diffuse.b * 0.4);

    this.cache.set(key, mat);
    return mat;
  }

  getWallMaterial(): StandardMaterial {
    return this.createMaterialFromConfig('wall', MATERIAL_CONFIG.walls);
  }

  getFlatRoofMaterial(): StandardMaterial {
    return this.createMaterialFromConfig('roof-flat', MATERIAL_CONFIG.roofs.flat);
  }

  getGableRoofMaterial(): StandardMaterial {
    return this.createMaterialFromConfig('roof-gable', MATERIAL_CONFIG.roofs.gable);
  }

  getSectionWallMaterial(): StandardMaterial {
    return this.createMaterialFromConfig('section-wall', MATERIAL_CONFIG.section.walls);
  }

  getSectionRoofMaterial(): StandardMaterial {
    return this.createMaterialFromConfig('section-roof', MATERIAL_CONFIG.section.roofs);
  }

  getGizmoMaterial(hexColor: string): StandardMaterial {
    const key = `gizmo-${hexColor}`;
    if (!this.cache.has(key)) {
      const mat = new StandardMaterial(key, this.scene);
      mat.disableLighting = GIZMO_CONFIG.rendering.disableLighting;
      mat.emissiveColor = Color3.FromHexString(hexColor);
      this.cache.set(key, mat);
    }
    return this.cache.get(key)!;
  }

  getGizmoHoverMaterial(): StandardMaterial {
    return this.getGizmoMaterial(GIZMO_CONFIG.colors.hover);
  }

  getGizmoActiveMaterial(): StandardMaterial {
    return this.getGizmoMaterial(GIZMO_CONFIG.colors.active);
  }

  dispose() {
    this.cache.forEach(mat => mat.dispose());
    this.cache.clear();
  }
}


