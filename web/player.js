import * as THREE from "https://esm.sh/three@0.185.1";
import { glb_load } from "./obj.js";

let player_model = null;

export function player_obj_init_on_load(model) {
  model.position.set(0, 0, 0);
  model.scale.set(1, 1, 1);
  player_model = model;
}

export function player_obj_init(scene) {
  glb_load("assets/female.glb", (model) => {
    scene.add(model);
    player_obj_init_on_load(model);
  });
}

export function player_init(name) {
  if (!player_model) {
    console.error("player model not loaded yet");
    return null;
  }
  const player = { name, clothing: [0, 0, 0], model: player_model };
  return player;
}
