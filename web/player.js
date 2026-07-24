import * as THREE from "https://esm.sh/three@0.185.1";
import * as CANNON from "https://esm.sh/cannon-es";
import { glb_load } from "./obj.js";

const texture_loader = new THREE.TextureLoader();

let player_model = null;

const mesh_map_texture = {
  0: 42, // Head
  1: 17, // Left arm
  2: 27, // Left leg
  3: 17, // Right arm
  4: 27, // Right leg
  5: 17  // Torso  
};

const head_blend_shader = shader => {
  shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '');
  shader.fragmentShader = shader.fragmentShader.replace(
  '#include <map_fragment>',
  `#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D(map, vec2(1.0 - vMapUv.x, vMapUv.y));
  diffuseColor.rgb = mix(diffuseColor.rgb, sampledDiffuseColor.rgb, sampledDiffuseColor.a);
  diffuseColor.a = 1.0;
  #endif`);
};

const blend_shader = shader => {
  shader.fragmentShader = shader.fragmentShader.replace(
  '#include <map_fragment>',
  `#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D(map, vMapUv);
  diffuseColor.rgb = mix(diffuseColor.rgb, sampledDiffuseColor.rgb, sampledDiffuseColor.a);
  diffuseColor.a = 1.0;
  #endif`);
};

export function player_obj_init_on_load(model) {
  model.position.set(0, 0, 0);
  model.scale.set(1, 1, 1);
  player_model = model;
}

export function player_obj_init(scene, callback) {
  glb_load("api/objects/male.glb", (model) => {
    player_obj_init_on_load(model);
    if (callback) callback();
  });
}

export function player_animate(player) {
  const time = Date.now();
  if (player.walking) {
    const swing = Math.sin(time / 90) * 0.7;
  
    player.parts["Right_Arm"].rotation.x = swing - Math.PI/2;
    player.parts["Left_Arm"].rotation.x = -swing - Math.PI/2; 
    player.parts["Right_Leg"].rotation.x = -swing - Math.PI/2;
    player.parts["Left_Leg"].rotation.x = swing - Math.PI/2; 
  } else {
    player.parts["Right_Arm"].rotation.x = - Math.PI/2;
    player.parts["Left_Arm"].rotation.x = - Math.PI/2;
    player.parts["Right_Leg"].rotation.x = - Math.PI/2;
    player.parts["Left_Leg"].rotation.x = - Math.PI/2;
  }
}

export function player_init(name) {
  if (!player_model) {
    console.error("player model not loaded yet");
    return null;
  }
  const player = { name, clothing: [0, 0, 0], colors: [0, 0, 0, 0, 0, 0], body: null, model: player_model, id: 0, walking: true, on_ground: false, dying: 0, parts: [] };
  let mesh_index = 0;
  player.model.traverse((child) => {
    if (child.isMesh) {
      const texture = texture_loader.load("api/clothing/" + mesh_map_texture[mesh_index]);

      if (mesh_index == 0) {
        texture.repeat.set(2.8, 2.8);
        texture.flipY = false;
        texture.offset.x = -0.4;
        texture.offset.y = -0.815;
      } else {
        texture.repeat.set(1, 1);
        texture.flipY = false;
      }

      child.castShadow = true;
      child.receiveShadow = true;
      child.material = new THREE.MeshStandardMaterial({ map: texture, transparent: false, vertexColors: mesh_index == 0 });
      if (mesh_index === 0) {
        child.material.onBeforeCompile = head_blend_shader;
      } else {
        child.material.onBeforeCompile = blend_shader;
      }
      mesh_index++;
    }
    if (child.isBone) {
      player.parts[child.name] = child;
    }
  });
  player.body = new CANNON.Body({
    mass: 1
  });
  player.body.addShape(
    new CANNON.Box(new CANNON.Vec3(1, 2, 0.5)),
    new CANNON.Vec3(0, 2, 0.3)
  );
  player.body.linearDamping = 0;
  player.body.fixedRotation = true;
  player.body.updateMassProperties();

  return player;
}
