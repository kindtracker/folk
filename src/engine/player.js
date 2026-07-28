import * as SkeletonUtils from "https://esm.sh/three@0.185.1/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "https://esm.sh/three@0.185.1";
import * as CANNON from "https://esm.sh/cannon-es";

import { glb_load } from "/engine/obj.js";
import { engine_move, engine_rot, key_down, csm } from "/engine/folk-engine.js";

const texture_loader = new THREE.TextureLoader();

let player_model_male = null;
let player_model_female = null;

const mesh_map = {
  0: "face",
  1: "shirt",
  2: "pants",
  3: "shirt",
  4: "pants",
  5: "shirt"
}

const head_blend_shader = shader => {
  shader.fragmentShader = shader.fragmentShader.replace(
  '#include <map_fragment>',
  `#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D(map, vec2(1.0 - vMapUv.x, vMapUv.y));
  diffuseColor.rgb = mix(diffuseColor.rgb, sampledDiffuseColor.rgb, sampledDiffuseColor.a);
  diffuseColor.a *= opacity;
  #endif`);
};

const blend_shader = shader => {
  shader.fragmentShader = shader.fragmentShader.replace(
  '#include <map_fragment>',
  `#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D(map, vMapUv);
  diffuseColor.rgb = mix(diffuseColor.rgb, sampledDiffuseColor.rgb, sampledDiffuseColor.a);
  diffuseColor.a *= opacity;
  #endif`);
};

export function player_obj_init_on_load(model, male) {
  model.position.set(0, 0, 0);
  model.scale.set(1, 1, 1);
  if (male) {
    player_model_male = model;
  } else {
    player_model_female = model;
  }
}

export function player_obj_init(scene, callback) {
  return Promise.all([
    new Promise(resolve => {
      glb_load("/api/objects/male.glb", model => {
        player_obj_init_on_load(model, true);
        resolve();
      });
    }),
    new Promise(resolve => {
      glb_load("/api/objects/female.glb", model => {
        player_obj_init_on_load(model, false);
        resolve();
      });
    })
  ]);
}

export function player_animate(player, dt) {
  const time = Date.now();
  
  let swing = Math.PI;
  if (player.walking) {
    swing += Math.sin(time / 90) * Math.PI/2;
  } 

  let anim = "idle";
  if (!player.on_ground) {
    anim = "fall";
  } else if (player.walking) {
    anim = "walk";
  }
  if (player.on_ground && key_down["Space"]) {
    anim = "fall";
  }
  if (player.climbing) {
    anim = "climb";
  }

  engine_move(player.parts["Right_Leg"], new THREE.Vector3(0, 0, -1));
  engine_move(player.parts["Left_Leg"], new THREE.Vector3(0, 0, -1));
  if (anim == "walk") {
    const swing = Math.PI + Math.sin(player.walking / 120) * Math.PI/4;
    engine_rot(player.parts["Right_Arm"], new THREE.Vector3(swing - Math.PI / 2, Math.PI, 0));
    engine_rot(player.parts["Left_Arm"], new THREE.Vector3(-swing - Math.PI / 2, Math.PI, 0));
    engine_rot(player.parts["Right_Leg"], new THREE.Vector3(-swing - Math.PI / 2, Math.PI, 0));
    engine_rot(player.parts["Left_Leg"], new THREE.Vector3(swing - Math.PI / 2, Math.PI, 0));
  } else if (anim == "fall") {
    engine_rot(player.parts["Right_Arm"], new THREE.Vector3(-Math.PI + Math.PI/1.75, Math.PI, 0));
    engine_rot(player.parts["Left_Arm"], new THREE.Vector3(-Math.PI + Math.PI/1.75, Math.PI, 0));
    engine_rot(player.parts["Right_Leg"], new THREE.Vector3(-Math.PI - Math.PI / 2, Math.PI, 0));
    engine_rot(player.parts["Left_Leg"], new THREE.Vector3(Math.PI - Math.PI / 2, Math.PI, 0));
  } else if (anim == "climb") {
    const swing = Math.PI + Math.cos(player.walking / 100) * Math.PI/6;
    const up = Math.sin(player.walking * 0.01) / 2;
    const up2 = Math.sin((player.walking+Math.PI/2*1000) * 0.01) / 2;
    engine_rot(player.parts["Right_Arm"], new THREE.Vector3(swing + Math.PI/1.5, Math.PI, 0));
    engine_rot(player.parts["Left_Arm"], new THREE.Vector3(-swing + Math.PI/1.5, Math.PI, 0));
    engine_rot(player.parts["Right_Leg"], new THREE.Vector3(-Math.PI - Math.PI/1.75, Math.PI, 0));
    engine_rot(player.parts["Left_Leg"], new THREE.Vector3(Math.PI - Math.PI/1.75, Math.PI, 0));
    engine_move(player.parts["Right_Leg"], new THREE.Vector3(0, 0, up-0.5));
    engine_move(player.parts["Left_Leg"], new THREE.Vector3(0, 0, up2-0.5));
  } else if (anim == "idle") {
    const swing = Math.PI + Math.sin(time * 0.01) * 0.05;
    engine_rot(player.parts["Right_Arm"], new THREE.Vector3(swing - Math.PI / 2, Math.PI, 0));
    engine_rot(player.parts["Left_Arm"], new THREE.Vector3(-swing - Math.PI / 2, Math.PI, 0));
    engine_rot(player.parts["Right_Leg"], new THREE.Vector3(-Math.PI - Math.PI / 2, Math.PI, 0));
    engine_rot(player.parts["Left_Leg"], new THREE.Vector3(Math.PI - Math.PI / 2, Math.PI, 0));
  }
}

export function player_clothing_load(player, clothing) {
  let mesh_index = 0;
  player.model.traverse((child) => {
    if (child.isMesh) {
      const texture = texture_loader.load("api/clothing/image/" + clothing[mesh_map[mesh_index]]);

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
      child.material = new THREE.MeshPhongMaterial({ map: texture, transparent: false, vertexColors: false });
      
      csm.setupMaterial(child.material);
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
}

export function player_init(name, avatar) {
  console.log(`[folk] loading: player (name: ${name})`)
  if (!player_model_male || !player_model_female) {
    console.error("[folk] player model not loaded yet");
    console.error(`[folk] player_model_male: ${player_model_male ? "loaded" : "not loaded"}`);
    console.error(`[folk] player_model_female: ${player_model_female ? "loaded" : "not loaded"}`);
    return null;
  }
  const player = { name, avatar, nametag: null, clothing: [0, 0, 0], colors: [0, 0, 0, 0, 0, 0], body: null, model: null, id: 0, hp: 100, walking: false, on_ground: false, climbing: false, parts: [] };
  player.model = SkeletonUtils.clone(avatar.gender == "male" ? player_model_male : player_model_female);
  player_clothing_load(player, avatar);
  
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1024;
  canvas.height = 256;
  ctx.font = '600 40px "Montserrat", system-ui, -apple-system, sans-serif';
  ctx.textAlign = "center";

  ctx.miterLimit = 2;
  ctx.lineWidth = 3;
  ctx.strokeStyle = "black";
  ctx.strokeText(name, 512, 160);
 
  ctx.fillStyle = "white";
  ctx.fillText(name, 512, 160);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true
  });
  player.nametag = new THREE.Sprite(material);
  player.nametag.renderOrder = 1000;
  player.nametag.material.depthWrite = false;
  
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
