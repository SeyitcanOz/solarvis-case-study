
/**
 * Section Gizmo Configuration
 *
 * Visual and interaction settings for height/slope adjustment gizmos
 * displayed in the Section View.
 */

import { Building } from "../features/building/Building";
import { BUILDING_CONFIG } from "./building";

export const SECTION_GIZMO_CONFIG = {
  lineLength: 3,        // Horizontal line length (shorter)
  lineThickness: 0.08,  // Line thickness
  handleSize: 0.3,      // Draggable sphere diameter
  horizontalOffset: 8,  // Fixed horizontal distance from building center
  labelOffset: 0.5,     // Distance from handle to label
  colors: {
    line: '#FFFFFF',
    handle: '#FF6B00',
    hover: '#FFFFFF',
    active: '#2ECC71',
  },
  rendering: {
    renderingGroupId: 3, // Render above everything else
  },
  drag: {
    minWallHeight: BUILDING_CONFIG.limits.wallHeight.min,
    minSlope: BUILDING_CONFIG.limits.roof.slope.min,
    maxSlope: BUILDING_CONFIG.limits.roof.slope.max,
    sensitivity: 0.05,
  },
  doubleClick: {
    timeout: 300, // ms between clicks
  },
} as const;



