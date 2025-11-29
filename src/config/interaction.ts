
/**
 * Interaction Configuration
 *
 * All interaction-related constants including:
 * - Grid snapping settings
 * - Ghost building positioning
 * - Scene settings (background color, lighting)
 * - Rendering group IDs
 * - Ground plane settings
 * - Layer masks for view-dependent visibility
 */

export const INTERACTION_CONFIG = {
  gridSnap: {
    enabled: false,
    size: 0.5,
  },
  ghostBuilding: {
    hiddenYPosition: -100,
  },
  scene: {
    clearColor: { r: 0.08, g: 0.09, b: 0.11, a: 1 },
    lightIntensity: 1.2,
  },
  ground: {
    pixelsPerUnit: 100,  // Conversion factor: 100 pixels = 1 Babylon unit
    fallbackSize: 50,    // Ground size when no texture
  },
  guides: {
    footprintOffset: 0.02,   // Elevation offset for footprint guide
    extensionOffset: 0.1,    // Elevation offset for extension guide
  },
  renderingGroups: {
    default: 0,
    guides: 1,
    gizmos: 2,
  },
  layerMasks: {
    default: 0xFFFFFFFF,
    gizmos: 0x10000000,        // Bit 28: Plan/3D transform gizmos
    sectionGizmos: 0x20000000, // Bit 29: Section height/slope gizmos
  },
} as const;