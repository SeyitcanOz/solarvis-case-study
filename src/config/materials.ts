
/**
 * Material Configuration
 *
 * Defines the visual appearance of all 3D elements.
 * 
 */

export const MATERIAL_CONFIG = {
  walls: {
    name: 'wall',
    diffuse: { r: 1.0, g: 1.0, b: 1.0 },
    specular: { r: 0.1, g: 0.1, b: 0.1 },
    specularPower: 32,
    alpha: 1.0,
    backFaceCulling: true,
  },
  roofs: {
    flat: {
      name: 'roof-flat',
      diffuse: { r: 0.22, g: 0.28, b: 0.35 }, 
      specular: { r: 0.2, g: 0.2, b: 0.2 },
      specularPower: 64,
      alpha: 1.0,
      backFaceCulling: false,
    },
    gable: {
      name: 'roof-gable',
      diffuse: { r: 0.22, g: 0.28, b: 0.35 }, 
      specular: { r: 0.2, g: 0.2, b: 0.2 },
      specularPower: 64,
      alpha: 1.0,
      backFaceCulling: false,
    },
  },
  ghost: {
    alpha: 0.5, 
  },
  edges: {
    color: { r: 0, g: 0, b: 0, a: 1 },
    width: 2.0,
  },
  guideLines: {
    footprint: { r: 0.9, g: 0.2, b: 0.2 },
    extension: { r: 1.0, g: 0.8, b: 0.0 },
    roofEdge: { r: 1.0, g: 1.0, b: 1.0 },
    ridge: { r: 1.0, g: 0.85, b: 0.3 },
    dashSize: 0.4,
    gapSize: 0.15,
  },
  section: {
    walls: {
      name: 'section-wall',
      diffuse: { r: 0.6, g: 0.6, b: 0.6 },
      specular: { r: 0.1, g: 0.1, b: 0.1 },
      specularPower: 16,
      alpha: 1.0,
      backFaceCulling: true,
    },
    roofs: {
      name: 'section-roof',
      diffuse: { r: 0.4, g: 0.4, b: 0.4 },
      specular: { r: 0.1, g: 0.1, b: 0.1 },
      specularPower: 16,
      alpha: 1.0,
      backFaceCulling: false,
    },
  },
} as const;


