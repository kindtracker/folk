import * as THREE from "https://esm.sh/three@0.185.1";
import { glb_load } from "./obj.js";

const texture_loader = new THREE.TextureLoader();

let player_model = null;

const mesh_map_texture = {
  0: "assets/42", // Head
  1: "assets/17", // Left arm
  2: "assets/27", // Left leg 
  3: "assets/17", // Right arm
  4: "assets/27", // Right leg
  5: "assets/17" // Torso  
};

export function player_obj_init_on_load(model) {
  model.position.set(0, 0, 0);
  model.scale.set(1, 1, 1);
  player_model = model;
}

export function player_obj_init(scene, callback) {
  glb_load("assets/female.glb", (model) => {
    scene.add(model);
    player_obj_init_on_load(model);
    if (callback) callback();
  });
}

export function player_animate(player) {
  const time = Date.now();
  if (player.walking) {
    const swing = Math.sin(time / 96) * 0.7;
  
    player.parts["Right_Arm"].rotation.x = swing - Math.PI/2;
    player.parts["Left_Arm"].rotation.x = -swing - Math.PI/2; 
    player.parts["Right_Leg"].rotation.x = -swing - Math.PI/2;
    player.parts["Left_Leg"].rotation.x = swing - Math.PI/2; 
  }
}

export function player_init(name) {
  if (!player_model) {
    console.error("player model not loaded yet");
    return null;
  }
  const player = { name, clothing: [0, 0, 0], model: player_model, id: 0, walking: true, on_ground: false, dying: 0, parts: [] };
  let mesh_index = 0;
  player.model.traverse((child) => {
    if (child.isMesh) {
      const texture = texture_loader.load(mesh_map_texture[mesh_index]);
      texture.repeat.set(1, 1);
      texture.flipY = false;
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = new THREE.MeshStandardMaterial({ map: texture });
      mesh_index++;
    }
    if (child.isBone) {
      // console.log("found bone:", child.name);
      player.parts[child.name] = child;
    }
  });
  return player;
}
