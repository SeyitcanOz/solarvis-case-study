
import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Texture,
  Color3,
  Mesh,
} from '@babylonjs/core';
import { INTERACTION_CONFIG } from '../../config/interaction';

/**
 * Creates a ground plane based STRICTLY on pixel dimensions.
 * Rule: 100 Image Pixels = 1 Babylon Unit.
 */
export const createGroundPlane = (
  scene: Scene,
  textureUrl?: string
): Mesh => {
  // 1. Start with a default 1x1 unit plane (which represents 100x100px)
  const ground = MeshBuilder.CreateGround(
    'ground',
    {
      width: 1, 
      height: 1,
      subdivisions: 1,
    },
    scene
  );

  ground.position.y = 0;
  
  // Ensure the scaling is reset to 1
  ground.scaling.setAll(1);

  const groundMaterial = new StandardMaterial('groundMaterial', scene);

  if (textureUrl) {
    const texture = new Texture(textureUrl, scene);

    // 2. APPLY THE PIXEL RULE ON LOAD
    texture.onLoadObservable.add(() => {
        const size = texture.getSize();
        
        if (size.width > 0 && size.height > 0) {
            // STRICT CONVERSION: 100px = 1 Unit
            const pixelsPerUnit = INTERACTION_CONFIG.ground.pixelsPerUnit;
            
            const widthUnits = size.width / pixelsPerUnit;
            const heightUnits = size.height / pixelsPerUnit;

            // Apply the exact calculated size
            ground.scaling.x = widthUnits;
            ground.scaling.z = heightUnits; 

            // Reset texture mapping to cover the plane 1:1
            texture.uScale = 1;
            texture.vScale = 1;

            console.log(`Map Loaded: ${size.width}x${size.height}px -> ${widthUnits}x${heightUnits} Babylon Units`);
        }
    });

    groundMaterial.emissiveTexture = texture;
    groundMaterial.disableLighting = true; 
    groundMaterial.diffuseTexture = texture;
  } else {
    // Fallback grey plane if no image
    groundMaterial.emissiveColor = new Color3(0.8, 0.8, 0.8);
    groundMaterial.diffuseColor = new Color3(0.7, 0.7, 0.7);
  }

  ground.material = groundMaterial;
  ground.receiveShadows = true;
  ground.isPickable = true; 

  return ground;
};


