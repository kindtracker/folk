import * as THREE from "https://esm.sh/three@0.185.1";
import { GLTFLoader } from "https://esm.sh/three@0.185.1/examples/jsm/loaders/GLTFLoader.js";
const gltfLoader = new GLTFLoader();

const player_model_parts = {};

export function glb_load(path, on_load) {
  gltfLoader.load(path, (gltf) => {
    const model = gltf.scene;
    on_load(model);
  });
}
