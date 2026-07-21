import * as THREE from "https://esm.sh/three@0.185.1";
import { GLTFLoader } from "https://esm.sh/three@0.185.1/examples/jsm/loaders/GLTFLoader.js";
const gltfLoader = new GLTFLoader();

const player_model_parts = {};

export function glb_load(path, on_load) {
  gltfLoader.load(path, (gltf) => {
    const model = gltf.scene;
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.selectable = true;
      }
      if (child.isBone) {
        console.log("found bone:", child.name);
        player_model_parts[child.name] = child;
      }
    });
    on_load(model);
  });
}
