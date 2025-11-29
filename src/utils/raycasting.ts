
import {
  Scene,
  Vector3,
  Matrix,
  Camera,
  Plane,
  Ray
} from '@babylonjs/core';

export const getPointerRelativePos = (event: PointerEvent | WheelEvent, canvas: HTMLCanvasElement) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
};

export const createCustomPickingRay = (
  x: number,
  y: number,
  canvas: HTMLCanvasElement,
  camera: Camera
): Ray => {
  // 1. Force aspect ratio update for Perspective cameras
  if (camera.mode === Camera.PERSPECTIVE_CAMERA && 'aspectRatio' in camera) {
    const ratio = canvas.clientWidth / canvas.clientHeight;
    (camera as any).aspectRatio = ratio;
  }
  
  // This is critical for Orthographic cameras (Plan View) where orthoLeft/Right 
  // might have changed via zoom just milliseconds before this click.
  // Passing 'true' forces a recalculation.
  camera.getProjectionMatrix(true);
  camera.getViewMatrix(true);

  const viewportWidth = canvas.clientWidth;
  const viewportHeight = canvas.clientHeight;

  // 3. Unproject
  const origin = Vector3.Unproject(
    new Vector3(x, y, 0),
    viewportWidth,
    viewportHeight,
    Matrix.Identity(),
    camera.getViewMatrix(),
    camera.getProjectionMatrix()
  );

  const target = Vector3.Unproject(
    new Vector3(x, y, 1),
    viewportWidth,
    viewportHeight,
    Matrix.Identity(),
    camera.getViewMatrix(),
    camera.getProjectionMatrix()
  );

  const direction = target.subtract(origin).normalize();

  return new Ray(origin, direction);
};

export const getAccurateGroundHit = (
  _scene: Scene,
  x: number,
  y: number,
  canvas: HTMLCanvasElement,
  camera: Camera
): Vector3 | null => {
  const ray = createCustomPickingRay(x, y, canvas, camera);
  
  const groundPlane = Plane.FromPositionAndNormal(Vector3.Zero(), Vector3.Up());
  const distance = ray.intersectsPlane(groundPlane);
  
  if (distance === null) return null;

  return ray.origin.add(ray.direction.scale(distance));
};

export const getCameraFromEvent = (
  event: PointerEvent | WheelEvent, 
  planCamera: Camera, 
  perspectiveCamera: Camera,
  planCanvas: HTMLCanvasElement,
  perspectiveCanvas: HTMLCanvasElement
): Camera | null => {
  const target = event.target as HTMLElement;
  if (target === planCanvas) return planCamera;
  if (target === perspectiveCanvas) return perspectiveCamera;
  return null;
};