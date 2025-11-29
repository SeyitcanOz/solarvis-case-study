
/**
 * Gizmo Configuration
 *
 * All transform gizmo constants including:
 * - Handle sizes (corners, bars, rotation puck)
 * - Colors for different handles
 * - Positioning offsets
 * - Rendering properties
 */

export const GIZMO_CONFIG = {
  sizes: {
    cornerSize: 0.2,
    barLength: 0.6,
    barThickness: 0.1,
    rotatePuck: {
      diameter: 0.6,
      height: 0.1,
    },
  },
  colors: {
    xAxis: '#E74C3C',
    zAxis: '#3498DB',
    corner: '#34495E',
    rotate: '#F39C12',
    hover: '#FFFFFF',
    active: '#2ECC71',
  },
  positioning: {
    yOffset: 0.2,          // Height above wall top
    rotateDistance: 0.5,   // Distance from edge for rotation handle
    pointerOffset: 0.3,    // 0.3 * diameter for rotation pointer
  },
  rendering: {
    renderingGroupId: 2,   // Render on top of everything
    disableLighting: true,
  },
} as const;


