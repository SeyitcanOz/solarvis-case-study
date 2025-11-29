
/**
 * Building Configuration
 *
 * All building-related constants including:
 * - Default dimensions for flat and gable roofs
 * - UI slider ranges (min, max, step)
 * - Minimum dimension constraints
 * - Transparency settings
 */

export const BUILDING_CONFIG = {
  defaults: {
    flat: {
      roof: {
        width: 3,
        length: 3,
        thickness: 0.15,
      },
      extension: 0.15,
      wallHeight: 3,
      rotation: 0,
    },
    gable: {
      roof: {
        width: 3,
        length: 3,
        slope: 30,
      },
      extension: 0.15,
      wallHeight: 3,
      rotation: 0,
    },
  },
  limits: {
    roof: {
      width: { min: 0.01, step: 0.01 },
      length: { min: 0.01, step: 0.01 },
      thickness: { min: 0.01, step: 0.01 },
      slope: { min: 0.01, max: 89.99, step: 0.01 },
    },
    wallHeight: { min: 0.01, step: 0.01 },
    extension: { min: 0, step: 0.01 }, // max calculated dynamically: min(width/2, length/2)
    rotation: { min: 0, max: 360, step: 0.01 },
    minDimension: 0.01, // Minimum building dimension during resize
  },
  transparency: {
    default: 0.15,
    min: 0,
    max: 1,
    step: 0.05,
  },
} as const;



