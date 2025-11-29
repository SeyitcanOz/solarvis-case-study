
/**
 * Camera Configuration
 *
 * All camera-related constants including:
 * - Zoom limits and factors
 * - Initial camera positions
 * - Pan and rotation sensitivity
 * - Orthographic bounds
 */

export const CAMERA_CONFIG = {
  plan: {
    zoom: {
      min: 2,
      max: 200,
      factor: 1.1,
    },
    initial: {
      alpha: -Math.PI / 2,
      beta: 0,
      radius: 50,
    },
    ortho: {
      top: 20,
      bottom: -20,
      left: -20,
      right: 20,
    },
    limits:{
      minZ:0.1,
      maxZ:10000
    }
  },
  perspective: {
    zoom: {
      min: 5,
      max: 200,
      factor: 1.1,
    },
    initial: {
      alpha: -Math.PI / 2,
      beta: Math.PI / 3,
      radius: 60,
    },
    limits: {
      minZ: 0.1,
      maxZ: 1000,
      lowerRadiusLimit: 5,
      upperRadiusLimit: 200,
      lowerBetaLimit: 0.1,
      upperBetaLimit: Math.PI - 0.1,
    },
  },
  pan: {
    sensitivity: {
      ortho: 1.0,
      perspective: 0.05,
    },
  },
  rotation: {
    sensitivity: 0.003,
  },
  section: {
    zoom: {
      min: 5,
      max: 100,
      factor: 1.1,
    },
    initial: {
      alpha: -Math.PI / 2,  // NE direction
      beta: Math.PI / 2,    // Horizontal (pure side view)
      radius: 60,
    },
    ortho: {
      top: 20,
      bottom: -5,  // Show ground
      left: -20,
      right: 20,
    },
    limits: {
      minZ: 0.1,
      maxZ: 1000,
    },
    sideAngles: {
      NE: -Math.PI / 2,
      SE: -Math.PI,
      SW: Math.PI / 2,
      NW: 0,
    },
  },
} as const;



