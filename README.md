# # SolarVis Software Engineer Case Study (BabylonJS Roof Builder)

**Author:** Seyitcan Öz
**Contact:** userseyitcanx@gmail.com

A multi-viewport 3D building editor demonstrating the integration of React's declarative UI patterns with Babylon.js's imperative 3D scene management.

## Installation

```bash
git clone <repository-url>
cd solarvis-case-study
npm install
npm run dev
```

## Technology Stack

- React 18.3 + TypeScript 5.6
- Babylon.js 7.31
- Vite 5.4
- TailwindCSS 3.4

## Architecture Overview

### The React-Babylon Bridge

The primary architectural challenge is coordinating React's declarative state model with Babylon.js's imperative scene graph. React manages application state (building data, user interactions), while Babylon.js handles 3D rendering and scene manipulation.

**Separation Strategy:**
- React components define *what* should exist (building data, UI state)
- Factory functions handle *how* 3D objects are created and updated
- Custom hooks manage the synchronization between the two

### Project Structure

```
src/
├── config/          # Application configuration (materials, cameras, interactions)
├── context/         # React context providing access to Babylon scene/cameras
├── features/        # Feature-based modules
│   ├── building/    # Building mesh creation and lifecycle
│   ├── camera/      # Camera control systems
│   ├── gizmo/       # Interactive transform controls
│   ├── scene/       # Scene orchestration
│   └── map/         # Ground plane and satellite imagery
├── systems/         # Shared systems (MaterialManager)
├── types/           # TypeScript type definitions
├── ui/              # React UI components and viewports
└── utils/           # Utility functions (raycasting, etc.)
```

### Orchestration Pattern

**SceneOrchestrator Component**

The `SceneOrchestrator` acts as the central composition layer. It receives application state from the parent `App` component and distributes it to specialized hooks:

```
App.tsx (State Management)
    ↓
SceneOrchestrator (Composition)
    ↓
├── useCameraControls     (Camera behavior per viewport)
├── useBuildingInteractions (Placement, selection, raycasting)
├── useGizmoInteractions  (Transform handle interactions)
├── useViewDependentRendering (Material/visibility per camera)
└── useSectionGizmoInteractions (Section view controls)
```

Each hook is independent and handles a specific domain. The orchestrator simply composes them, passing the necessary state and callbacks.

### Data Flow

**1. User Interaction**
User actions (clicks, drags) trigger event handlers in viewport canvases.

**2. Raycasting & Selection**
Interaction hooks use Babylon's raycasting system to detect which 3D objects the user is interacting with.

**3. State Update**
Hooks call update callbacks (e.g., `onUpdateBuilding`, `onSelectBuilding`) that modify React state in `App.tsx`.

**4. React Re-render**
State changes trigger React component re-renders.

**5. Mesh Synchronization**
The `Building` component's `useEffect` detects building data changes and calls helper functions to update the 3D meshes.

**6. Rendering**
Babylon.js render loop continuously displays the updated scene across all viewports.

### Multi-Viewport Rendering

The application maintains three independent viewports, each with its own camera but sharing a single Babylon scene:

**Plan View (Orthographic)**
- Top-down view for placement and layout
- 2D-style transform gizmos for resize/rotate
- Transparent roofs for better visibility of interior space

**Perspective View (3D)**
- Free-rotation 3D camera
- Full building visualization with edge rendering
- Optional guide lines and transform gizmos

**Section View (Orthographic)**
- Elevation view of selected building
- Interactive height and slope adjustment gizmos
- Cross-section materials showing building internals

**View-Dependent Rendering**

Each viewport needs to display the same buildings differently. This is handled by the `useViewDependentRendering` hook, which uses Babylon's `onBeforeCameraRenderObservable` to modify mesh properties before each camera renders:

- Material swapping (normal materials ↔ section materials)
- Visibility adjustments (roof transparency in plan view)
- Mesh filtering (only selected building in section view)

### Type System

**Discriminated Unions**

Building data uses TypeScript discriminated unions to ensure type safety across different roof types:

```typescript
type BuildingData =
  | { type: 'flat'; roof: { width; length; thickness }; ... }
  | { type: 'gable'; roof: { width; length; slope }; ... }
```

The `type` field acts as a discriminator, allowing TypeScript to narrow types and prevent invalid property access.

### Material Management

The `MaterialManager` class centralizes material creation and caching:
- Creates materials from configuration objects
- Caches materials to avoid redundant GPU allocations
- Provides typed methods for retrieving specific materials

### Mesh Lifecycle

**Creation**

Factory functions (`BuildingFactory`, `RoofFactory`, `GuideFactory`) create Babylon meshes from building data. These are pure functions that take data and return configured mesh instances.

**Updates**

The `buildingHelpers.updateBuildingMeshes` function determines how to update meshes when building data changes:
- If topology changes (flat ↔ gable), meshes are disposed and recreated
- If only dimensions change, existing meshes are scaled and repositioned
- Metadata tracks which building each mesh belongs to

**Disposal**

When buildings are deleted or components unmount, cleanup functions dispose of Babylon resources to prevent memory leaks.

### Interaction System

**Raycasting**

User interactions require converting 2D screen coordinates to 3D scene queries. Custom raycasting utilities handle both perspective and orthographic cameras, which require different projection matrix calculations.

**Layer Masks**

Meshes are assigned to different layer masks to control which cameras can see them:
- Transform gizmos visible only in plan and perspective views
- Section gizmos visible only in section view
- Guide lines configurable in perspective view

**Rendering Groups**

Meshes are organized into rendering groups to control draw order:
- Default group: Buildings
- Guides group: Rendered on top to prevent occlusion

## Application Flow

### Building Placement

1. User selects placement mode (flat or gable roof)
2. Ghost building preview appears, following cursor
3. Raycasting determines valid placement position on ground plane
4. Click confirms placement, adds building to state
5. Building meshes created and rendered across all viewports

### Building Modification

1. User selects building (click in any viewport)
2. Transform gizmos appear in plan/perspective views
3. Section gizmos appear in section view
4. Drag gizmo handles to modify dimensions
5. Building data updates trigger mesh synchronization
6. All viewports reflect changes immediately

### Camera Controls

Each viewport implements independent camera controls:
- **Plan/Section:** Pan (middle-drag), zoom (scroll)
- **Perspective:** Rotate (right-drag), zoom (scroll), pan (middle-drag)

**Keyboard Shortcuts:**
- `ESC` - Cancel building placement mode
- `Delete` - Remove selected building

Camera state is managed by Babylon's camera controllers, with custom hooks adding application-specific behavior (auto-focus in section view, zoom constraints).

## Configuration System

Centralized configuration files (`src/config/`) define:
- Default building dimensions and constraints
- Material properties (colors, specularity, transparency)
- Camera parameters (zoom limits, rotation speed)
- Interaction settings (layer masks, rendering groups)

This separation allows adjusting application behavior without modifying component logic.

---

**Architectural Principle:** The codebase maintains a clear separation between React's component tree and Babylon's scene graph. State lives in React, rendering lives in Babylon, and custom hooks act as the translation layer. This makes the application easier to reason about and reduces the likelihood of state synchronization bugs.