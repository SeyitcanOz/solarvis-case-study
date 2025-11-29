
import { useEffect, useRef, type RefObject } from 'react';
import { ArcRotateCamera, Vector3 } from '@babylonjs/core';
import { CAMERA_CONFIG } from '../../config/camera';

// Plan View Controls
export const usePlanControls = (
  planCamera: ArcRotateCamera | null,
  planCanvasRef: RefObject<HTMLCanvasElement | null>,
  perspectiveCamera: ArcRotateCamera | null,
  perspectiveCanvasRef: RefObject<HTMLCanvasElement | null>
) => {
  const panRef = useRef<{
    isPanning: boolean;
    startX: number;
    startY: number;
  }>({
    isPanning: false,
    startX: 0,
    startY: 0,
  });

  useEffect(() => {
    const planCanvas = planCanvasRef.current;
    
    // We only check planCanvas here, perspective is just for reference if needed
    if (!planCamera || !planCanvas) return;

    // === ZOOM HANDLER ===
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const zoomFactor = e.deltaY > 0
        ? CAMERA_CONFIG.plan.zoom.factor
        : 1 / CAMERA_CONFIG.plan.zoom.factor;

      const currentWidth = planCamera.orthoRight! - planCamera.orthoLeft!;
      const newWidth = currentWidth * zoomFactor;

      if (newWidth < CAMERA_CONFIG.plan.zoom.min || newWidth > CAMERA_CONFIG.plan.zoom.max) {
        return;
      }

      const rect = planCanvas.getBoundingClientRect();
      const xRatio = (e.clientX - rect.left) / rect.width;
      const yRatio = (e.clientY - rect.top) / rect.height;

      const ratio = rect.width / rect.height;
      const newOrthoSize = newWidth / (2 * ratio);

      const width = planCamera.orthoRight! - planCamera.orthoLeft!;
      const height = planCamera.orthoTop! - planCamera.orthoBottom!;
      const mouseX = planCamera.orthoLeft! + width * xRatio;
      const mouseY = planCamera.orthoTop! - height * yRatio;

      planCamera.orthoTop = newOrthoSize;
      planCamera.orthoBottom = -newOrthoSize;
      planCamera.orthoLeft = -newOrthoSize * ratio;
      planCamera.orthoRight = newOrthoSize * ratio;

      const newHeight = planCamera.orthoTop - planCamera.orthoBottom;
      const newWorldWidth = planCamera.orthoRight - planCamera.orthoLeft;
      const newMouseX = planCamera.orthoLeft + newWorldWidth * xRatio;
      const newMouseY = planCamera.orthoTop - newHeight * yRatio;

      planCamera.target.x += (mouseX - newMouseX);
      planCamera.target.z += (mouseY - newMouseY);
    };

    // === PAN HANDLER ===
    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 1) return;

      e.preventDefault();
      planCanvas.setPointerCapture(e.pointerId);

      panRef.current = {
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
      };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!panRef.current.isPanning) return;

      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;

      const width = planCamera.orthoRight! - planCamera.orthoLeft!;
      const sensitivity = width / planCanvas.clientWidth;

      planCamera.target.x -= dx * sensitivity;
      planCamera.target.z += dy * sensitivity;

      panRef.current.startX = e.clientX;
      panRef.current.startY = e.clientY;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (panRef.current.isPanning) {
        panRef.current.isPanning = false;
        planCanvas.releasePointerCapture(e.pointerId);
      }
    };

    const handlePointerLeave = () => {
      if (panRef.current.isPanning) {
        panRef.current.isPanning = false;
      }
    };

    planCanvas.addEventListener('wheel', handleWheel, { passive: false });
    planCanvas.addEventListener('pointerdown', handlePointerDown);
    planCanvas.addEventListener('pointermove', handlePointerMove);
    planCanvas.addEventListener('pointerup', handlePointerUp);
    planCanvas.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      planCanvas.removeEventListener('wheel', handleWheel);
      planCanvas.removeEventListener('pointerdown', handlePointerDown);
      planCanvas.removeEventListener('pointermove', handlePointerMove);
      planCanvas.removeEventListener('pointerup', handlePointerUp);
      planCanvas.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [planCamera, planCanvasRef]);
};

// Perspective View Controls
export const usePerspectiveControls = (
  perspectiveCamera: ArcRotateCamera | null,
  perspectiveCanvasRef: RefObject<HTMLCanvasElement | null>,
  planCamera: ArcRotateCamera | null,
  planCanvasRef: RefObject<HTMLCanvasElement | null>
) => {
  const rotateRef = useRef<{
    isRotating: boolean;
    startX: number;
    startY: number;
    initialAlpha: number;
    initialBeta: number;
  }>({
    isRotating: false,
    startX: 0,
    startY: 0,
    initialAlpha: 0,
    initialBeta: 0,
  });

  const panRef = useRef<{
    isPanning: boolean;
    startX: number;
    startY: number;
  }>({
    isPanning: false,
    startX: 0,
    startY: 0,
  });

  useEffect(() => {
    const perspectiveCanvas = perspectiveCanvasRef.current;
    if (!perspectiveCamera || !perspectiveCanvas) return;

    // === ZOOM HANDLER ===
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const zoomFactor = e.deltaY > 0
        ? CAMERA_CONFIG.perspective.zoom.factor
        : 1 / CAMERA_CONFIG.perspective.zoom.factor;

      const newRadius = perspectiveCamera.radius * zoomFactor;

      if (newRadius < CAMERA_CONFIG.perspective.zoom.min || newRadius > CAMERA_CONFIG.perspective.zoom.max) {
        return;
      }

      perspectiveCamera.radius = newRadius;
    };

    // === ROTATION & PAN HANDLER ===
    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 2) {
        e.preventDefault();
        perspectiveCanvas.setPointerCapture(e.pointerId);

        rotateRef.current = {
          isRotating: true,
          startX: e.clientX,
          startY: e.clientY,
          initialAlpha: perspectiveCamera.alpha,
          initialBeta: perspectiveCamera.beta,
        };
      } else if (e.button === 1) {
        e.preventDefault();
        perspectiveCanvas.setPointerCapture(e.pointerId);

        panRef.current = {
          isPanning: true,
          startX: e.clientX,
          startY: e.clientY,
        };
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (rotateRef.current.isRotating) {
        const dx = e.clientX - rotateRef.current.startX;
        const dy = e.clientY - rotateRef.current.startY;
        const sensitivity = CAMERA_CONFIG.rotation.sensitivity;

        perspectiveCamera.alpha = rotateRef.current.initialAlpha - dx * sensitivity;
        const newBeta = rotateRef.current.initialBeta - dy * sensitivity;
        perspectiveCamera.beta = Math.max(
          CAMERA_CONFIG.perspective.limits.lowerBetaLimit,
          Math.min(CAMERA_CONFIG.perspective.limits.upperBetaLimit, newBeta)
        );
      }

      if (panRef.current.isPanning) {
        const dx = e.clientX - panRef.current.startX;
        const dy = e.clientY - panRef.current.startY;
        const sensitivity = CAMERA_CONFIG.pan.sensitivity.perspective;

        const viewMatrix = perspectiveCamera.getViewMatrix();
        const cameraWorldMatrix = viewMatrix.clone().invert();
        const rightDir = Vector3.TransformNormal(new Vector3(1, 0, 0), cameraWorldMatrix).normalize();
        const upDir = Vector3.TransformNormal(new Vector3(0, 1, 0), cameraWorldMatrix).normalize();

        perspectiveCamera.target.addInPlace(rightDir.scale(-dx * sensitivity));
        perspectiveCamera.target.addInPlace(upDir.scale(dy * sensitivity));

        panRef.current.startX = e.clientX;
        panRef.current.startY = e.clientY;
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (rotateRef.current.isRotating) {
        rotateRef.current.isRotating = false;
        perspectiveCanvas.releasePointerCapture(e.pointerId);
      }
      if (panRef.current.isPanning) {
        panRef.current.isPanning = false;
        perspectiveCanvas.releasePointerCapture(e.pointerId);
      }
    };

    const handlePointerLeave = () => {
      if (rotateRef.current.isRotating) {
        rotateRef.current.isRotating = false;
      }
      if (panRef.current.isPanning) {
        panRef.current.isPanning = false;
      }
    };

    perspectiveCanvas.addEventListener('wheel', handleWheel, { passive: false });
    perspectiveCanvas.addEventListener('pointerdown', handlePointerDown);
    perspectiveCanvas.addEventListener('pointermove', handlePointerMove);
    perspectiveCanvas.addEventListener('pointerup', handlePointerUp);
    perspectiveCanvas.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      perspectiveCanvas.removeEventListener('wheel', handleWheel);
      perspectiveCanvas.removeEventListener('pointerdown', handlePointerDown);
      perspectiveCanvas.removeEventListener('pointermove', handlePointerMove);
      perspectiveCanvas.removeEventListener('pointerup', handlePointerUp);
      perspectiveCanvas.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [perspectiveCamera, perspectiveCanvasRef]);
};

// Section View Controls
export const useSectionControls = (
  sectionCamera: ArcRotateCamera | null,
  sectionCanvasRef: RefObject<HTMLCanvasElement | null>
) => {
  const rotateRef = useRef<{
    isRotating: boolean;
    startX: number;
    initialAlpha: number;
  }>({
    isRotating: false,
    startX: 0,
    initialAlpha: 0,
  });

  useEffect(() => {
    const sectionCanvas = sectionCanvasRef.current;
    if (!sectionCamera || !sectionCanvas) return;

    // === ZOOM HANDLER (Center-based zoom) ===
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const zoomFactor = e.deltaY > 0
        ? CAMERA_CONFIG.section.zoom.factor
        : 1 / CAMERA_CONFIG.section.zoom.factor;

      const currentHeight = sectionCamera.orthoTop! - sectionCamera.orthoBottom!;
      const newHeight = currentHeight * zoomFactor;

      if (newHeight < CAMERA_CONFIG.section.zoom.min || newHeight > CAMERA_CONFIG.section.zoom.max) {
        return;
      }

      const rect = sectionCanvas.getBoundingClientRect();
      const ratio = rect.width / rect.height;

      const halfHeight = newHeight / 2;

      // Center-based zoom - always zoom around the camera target
      sectionCamera.orthoTop = halfHeight;
      sectionCamera.orthoBottom = -halfHeight;
      sectionCamera.orthoLeft = -halfHeight * ratio;
      sectionCamera.orthoRight = halfHeight * ratio;
    };

    // === ROTATION HANDLER (Right Mouse Button) ===
    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 2) {
        e.preventDefault();
        sectionCanvas.setPointerCapture(e.pointerId);

        rotateRef.current = {
          isRotating: true,
          startX: e.clientX,
          initialAlpha: sectionCamera.alpha,
        };
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (rotateRef.current.isRotating) {
        const dx = e.clientX - rotateRef.current.startX;
        const sensitivity = CAMERA_CONFIG.rotation.sensitivity;

        // Only rotate around alpha (horizontal rotation), beta stays at Math.PI/2
        sectionCamera.alpha = rotateRef.current.initialAlpha - dx * sensitivity;
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (rotateRef.current.isRotating) {
        rotateRef.current.isRotating = false;
        sectionCanvas.releasePointerCapture(e.pointerId);
      }
    };

    const handlePointerLeave = () => {
      if (rotateRef.current.isRotating) {
        rotateRef.current.isRotating = false;
      }
    };

    sectionCanvas.addEventListener('wheel', handleWheel, { passive: false });
    sectionCanvas.addEventListener('pointerdown', handlePointerDown);
    sectionCanvas.addEventListener('pointermove', handlePointerMove);
    sectionCanvas.addEventListener('pointerup', handlePointerUp);
    sectionCanvas.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      sectionCanvas.removeEventListener('wheel', handleWheel);
      sectionCanvas.removeEventListener('pointerdown', handlePointerDown);
      sectionCanvas.removeEventListener('pointermove', handlePointerMove);
      sectionCanvas.removeEventListener('pointerup', handlePointerUp);
      sectionCanvas.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [sectionCamera, sectionCanvasRef]);
};


