
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Color4, Camera } from '@babylonjs/core';
import { MaterialManager } from '../systems/MaterialManager';
import { CAMERA_CONFIG } from '../config/camera';
import { INTERACTION_CONFIG } from '../config/interaction';
import { SceneContext, type SceneContextType } from './useScene';

export const SceneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const workingCanvasRef = useRef<HTMLCanvasElement>(null);
  const planCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const perspectiveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sectionCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [babylonInstance, setBabylonInstance] = useState<{
    engine: Engine;
    scene: Scene;
    planCamera: ArcRotateCamera;
    perspectiveCamera: ArcRotateCamera;
    sectionCamera: ArcRotateCamera;
    materialManager: MaterialManager;
  } | null>(null);

  useEffect(() => {
    if (!workingCanvasRef.current) return;

    // --- Initialization ---
    const engine = new Engine(workingCanvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });

    const scene = new Scene(engine);
    const sceneConfig = INTERACTION_CONFIG.scene;
    scene.clearColor = new Color4(
      sceneConfig.clearColor.r,
      sceneConfig.clearColor.g,
      sceneConfig.clearColor.b,
      sceneConfig.clearColor.a
    );

    const light = new HemisphericLight('mainLight', new Vector3(0, 1, 0), scene);
    light.intensity = sceneConfig.lightIntensity;

    const materialManager = new MaterialManager(scene);

    // PLAN CAMERA SETUP (TOP-DOWN)
    const planConfig = CAMERA_CONFIG.plan;
    
    // 1. Create with placeholder angles (they will be recalculated)
    const planCam = new ArcRotateCamera(
      'planCamera',
      0, 
      0, 
      planConfig.initial.radius,
      Vector3.Zero(),
      scene
    );
    
    planCam.mode = Camera.ORTHOGRAPHIC_CAMERA;

    // 2. Set UpVector to Z (Standard Map Orientation: North is Up)
    planCam.upVector = new Vector3(0, 0, 1);

    // 3. EXPLICITLY set position to Y-axis (Top-Down view)
    // This forces the camera to look from +Y down to (0,0,0)
    // With Up=Z, this creates the correct View Matrix (Right=+X, Up=+Z)
    planCam.setPosition(new Vector3(0, planConfig.initial.radius, 0));

    // 4. Remove limits so we can stay exactly at the "Equator" (Beta=PI/2) relative to Z-up
    planCam.lowerBetaLimit = null;
    planCam.upperBetaLimit = null;

    // 5. Orthographic Bounds
    planCam.orthoTop = planConfig.ortho.top;
    planCam.orthoBottom = planConfig.ortho.bottom;
    planCam.orthoLeft = planConfig.ortho.left;
    planCam.orthoRight = planConfig.ortho.right;

    planCam.minZ = planConfig.limits.minZ;
    planCam.maxZ = planConfig.limits.maxZ;

    // 6. Prevent default inputs from fighting our custom controls
    planCam.inputs.clear();

    // PERSPECTIVE CAMERA SETUP
    const perspConfig = CAMERA_CONFIG.perspective;
    const perspCam = new ArcRotateCamera(
      'perspectiveCamera',
      perspConfig.initial.alpha,
      perspConfig.initial.beta,
      perspConfig.initial.radius,
      Vector3.Zero(),
      scene
    );
    perspCam.minZ = perspConfig.limits.minZ;
    perspCam.maxZ = perspConfig.limits.maxZ;
    perspCam.lowerRadiusLimit = perspConfig.limits.lowerRadiusLimit;
    perspCam.upperRadiusLimit = perspConfig.limits.upperRadiusLimit;
    perspCam.lowerBetaLimit = perspConfig.limits.lowerBetaLimit;
    perspCam.upperBetaLimit = perspConfig.limits.upperBetaLimit;
    perspCam.inputs.clear();

    // SECTION CAMERA SETUP (SIDE VIEW)
    const sectionConfig = CAMERA_CONFIG.section;
    const sectionCam = new ArcRotateCamera(
      'sectionCamera',
      sectionConfig.initial.alpha,
      sectionConfig.initial.beta,
      sectionConfig.initial.radius,
      Vector3.Zero(),
      scene
    );

    sectionCam.mode = Camera.ORTHOGRAPHIC_CAMERA;
    sectionCam.orthoTop = sectionConfig.ortho.top;
    sectionCam.orthoBottom = sectionConfig.ortho.bottom;
    sectionCam.orthoLeft = sectionConfig.ortho.left;
    sectionCam.orthoRight = sectionConfig.ortho.right;
    sectionCam.minZ = sectionConfig.limits.minZ;
    sectionCam.maxZ = sectionConfig.limits.maxZ;
    sectionCam.inputs.clear();

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    setBabylonInstance({
      engine,
      scene,
      planCamera: planCam,
      perspectiveCamera: perspCam,
      sectionCamera: sectionCam,
      materialManager,
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      materialManager.dispose();
      scene.dispose();
      engine.dispose();
    };
  }, []);

  const value = useMemo<SceneContextType>(() => {
    return {
      engine: babylonInstance?.engine ?? null,
      scene: babylonInstance?.scene ?? null,
      planCamera: babylonInstance?.planCamera ?? null,
      perspectiveCamera: babylonInstance?.perspectiveCamera ?? null,
      sectionCamera: babylonInstance?.sectionCamera ?? null,
      materialManager: babylonInstance?.materialManager ?? null,
      planCanvasRef,
      perspectiveCanvasRef,
      sectionCanvasRef,
    };
  }, [babylonInstance]);

  return (
    <SceneContext.Provider value={value}>
      <canvas 
        ref={workingCanvasRef} 
        style={{ width: 0, height: 0, visibility: 'hidden', position: 'absolute' }} 
      />
      {babylonInstance && children}
    </SceneContext.Provider>
  );
};


