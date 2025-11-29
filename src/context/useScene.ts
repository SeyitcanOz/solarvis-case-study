import { createContext, useContext, type RefObject } from 'react';
import { Engine, Scene, ArcRotateCamera } from '@babylonjs/core';
import { MaterialManager } from '../systems/MaterialManager';

export interface SceneContextType {
  engine: Engine | null;
  scene: Scene | null;
  planCamera: ArcRotateCamera | null;
  perspectiveCamera: ArcRotateCamera | null;
  sectionCamera: ArcRotateCamera | null;
  planCanvasRef: RefObject<HTMLCanvasElement | null>;
  perspectiveCanvasRef: RefObject<HTMLCanvasElement | null>;
  sectionCanvasRef: RefObject<HTMLCanvasElement | null>;
  materialManager: MaterialManager | null;
}

// Create the context
export const SceneContext = createContext<SceneContextType | null>(null);

// Create the hook
export const useScene = () => {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useScene must be used within a SceneProvider');
  }
  return context;
};
