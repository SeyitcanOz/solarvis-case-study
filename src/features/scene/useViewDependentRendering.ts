import { useEffect } from 'react';
import { Scene, Camera } from '@babylonjs/core';
import type { MaterialManager } from '../../systems/MaterialManager';
import { INTERACTION_CONFIG } from '../../config/interaction';

interface UseViewDependentRenderingParams {
  scene: Scene | null;
  planCamera: Camera | null;
  perspectiveCamera: Camera | null;
  sectionCamera: Camera | null;
  roofTransparency: number;
  show3DGuides: boolean;
  selectedBuildingId: string | null;
  materialManager: MaterialManager | null;
}

/**
 * Custom hook that manages view-dependent rendering behavior across multiple viewports.
 *
 * This hook orchestrates the rendering of meshes differently depending on which camera is active:
 * - Plan View: Shows roofs with transparency, no edges, guide lines visible
 * - Perspective View: Full opacity, edges enabled, optional guide lines
 * - Section View: Shows only selected building, section materials, no ghost building
 *
 * Performance optimizations:
 * - Caches material assignments to prevent redundant swaps
 * - Filters meshes to only update relevant ones
 * - Uses bitwise operations for layer mask checks
 */
export function useViewDependentRendering({
  scene,
  planCamera,
  perspectiveCamera,
  sectionCamera,
  roofTransparency,
  show3DGuides,
  selectedBuildingId,
  materialManager,
}: UseViewDependentRenderingParams): void {
  useEffect(() => {
    if (!scene || !planCamera || !perspectiveCamera || !materialManager) return;

    // Material cache prevents redundant material swaps during rendering
    // Tracks: section material state, visibility value, and edge renderer state
    const meshMaterialCache = new Map<string, {
      isSectionMaterial: boolean;
      lastVisibility: number;
      lastEdges: boolean
    }>();

    // Observer runs before each camera renders its view
    const observer = scene.onBeforeCameraRenderObservable.add((camera) => {
      // Configure rendering parameters based on active camera
      let targetAlpha = 1.0;
      let showEdges = false;
      let renderGuides = true;
      let useSectionMaterials = false;

      if (camera === planCamera) {
        // Plan View: Transparent roofs for better visibility
        targetAlpha = roofTransparency;
        showEdges = false;
        renderGuides = true;
        useSectionMaterials = false;
      } else if (camera === perspectiveCamera) {
        // 3D View: Full opacity with optional guides
        targetAlpha = 1.0;
        showEdges = true;
        renderGuides = show3DGuides;
        useSectionMaterials = false;
      } else if (camera === sectionCamera) {
        // Section View: Special materials showing cross-section
        targetAlpha = 1.0;
        showEdges = true;
        renderGuides = false;
        useSectionMaterials = true;
      } else {
        return; // Unknown camera, skip
      }

      // Filter to only meshes that need view-dependent updates
      const meshesToUpdate = scene.meshes.filter(m =>
        m.metadata?.buildingId ||
        m.metadata?.isRidge === true ||
        m.renderingGroupId === INTERACTION_CONFIG.renderingGroups.guides
      );

      meshesToUpdate.forEach((mesh) => {
        const meshBuildingId = mesh.metadata?.buildingId;
        const meshId = mesh.uniqueId;

        // Ridge lines: Only visible in plan view (or all views for ghost building)
        if (mesh.metadata?.isRidge === true) {
          if (mesh.metadata.buildingId === 'ghost') {
            mesh.isVisible = (camera !== sectionCamera);
          } else {
            mesh.isVisible = (camera === planCamera);
          }
          return;
        }

        // Section View: Show only the selected building
        if (camera === sectionCamera) {
          if (meshBuildingId && meshBuildingId !== 'ghost' && meshBuildingId !== selectedBuildingId) {
            mesh.isVisible = false;
            return;
          }
          if (meshBuildingId === 'ghost') {
            mesh.isVisible = false;
            return;
          }
          if (meshBuildingId === selectedBuildingId) {
            mesh.isVisible = true;
          }
        } else {
          // Other views: Show all non-ghost buildings
          if (meshBuildingId && meshBuildingId !== 'ghost') {
            mesh.isVisible = true;
          }
        }

        // Handle transparency and material swapping for building meshes
        if (
          mesh.metadata &&
          mesh.metadata.isTransparencyTarget === true &&
          mesh.metadata.buildingId !== 'ghost'
        ) {
          // Retrieve or create cache entry for this mesh
          let cacheEntry = meshMaterialCache.get(meshId.toString());
          if (!cacheEntry) {
            cacheEntry = { isSectionMaterial: false, lastVisibility: -1, lastEdges: false };
            meshMaterialCache.set(meshId.toString(), cacheEntry);
          }

          // Swap materials only when switching between section/normal views
          if (useSectionMaterials !== cacheEntry.isSectionMaterial) {
            if (useSectionMaterials) {
              // Section materials: Show cross-section appearance
              if (mesh.name.includes('walls')) {
                mesh.material = materialManager.getSectionWallMaterial();
              } else if (mesh.name.includes('flatRoof') || mesh.name.includes('gableRoof')) {
                mesh.material = materialManager.getSectionRoofMaterial();
              }
            } else {
              // Normal materials: Standard building appearance
              if (mesh.name.includes('walls')) {
                mesh.material = materialManager.getWallMaterial();
              } else if (mesh.name.includes('flatRoof')) {
                mesh.material = materialManager.getFlatRoofMaterial();
              } else if (mesh.name.includes('gableRoof')) {
                mesh.material = materialManager.getGableRoofMaterial();
              }
            }
            cacheEntry.isSectionMaterial = useSectionMaterials;
          }

          // Update visibility (alpha) only if changed
          if (cacheEntry.lastVisibility !== targetAlpha) {
            mesh.visibility = targetAlpha;
            cacheEntry.lastVisibility = targetAlpha;
          }

          // Update edge rendering only if changed
          if (mesh.edgesRenderer && cacheEntry.lastEdges !== showEdges) {
            mesh.edgesRenderer.isEnabled = showEdges;
            cacheEntry.lastEdges = showEdges;
          }
        }

        // Guide lines visibility control
        if (mesh.renderingGroupId === INTERACTION_CONFIG.renderingGroups.guides) {
          if (mesh.metadata?.buildingId === 'ghost') {
            mesh.isVisible = (camera !== sectionCamera);
          } else {
            mesh.isVisible = renderGuides;
          }
        }
      });
    });

    // Cleanup: Remove observer and clear cache
    return () => {
      scene.onBeforeCameraRenderObservable.remove(observer);
      meshMaterialCache.clear();
    };
  }, [scene, planCamera, perspectiveCamera, sectionCamera, roofTransparency, show3DGuides, materialManager, selectedBuildingId]);
}