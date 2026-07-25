import { WebGPURenderer } from "https://esm.sh/three@0.185.1/webgpu.js";
import * as THREE from "https://esm.sh/three@0.185.1";
import * as CANNON from "https://esm.sh/cannon-es";
import { map_init } from "/engine/map.js";
import { player_animate, player_init, player_obj_init } from "/engine/player.js";
import { ui_draw } from "/ui/ui.js";
import { chat_input } from "/ui/chat.js";
import { me } from "/main.js";

export let world = null;
export let scene = null;
export let camera = null;
export let renderer = null;
export let game_canvas = null;
let light = null;

export let player = null;

let camera_distance = 10;
let camera_yaw = 0;
let camera_pitch = Math.PI / 10;
let player_yaw = 0;

export let camera_sens = 0.007;
export let mouse_down = [false, false, false];
export let key_down = {};
export let shift_lock = false;

export let width;
export let height;
let lt = performance.now();

export let stud = null;
export let stud_scale = 4;

function deg(degrees) {
  return degrees * (Math.PI / 180);
}

export async function engine_load(webgpu = false) {
  console.log("[folk] loading: engine");
  width = window.innerWidth;
  height = window.innerHeight;

  console.log("[folk] loading: world");
  world = new CANNON.World({ gravity: new CANNON.Vec3(0, -196.2, 0) });
  world.defaultContactMaterial.friction = 0;
  world.solver.iterations = 10;
  world.broadphase = new CANNON.NaiveBroadphase();
  console.log("[folk] loading: scene");
  scene = new THREE.Scene();
  console.log("[folk] loading: camera");
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  console.log("[folk] loading: renderer (webgpu=" + webgpu + ")");
  if (webgpu) {
    console.log("[folk] loading: webgpu");
    renderer = new WebGPURenderer({ antialias: true });
    if (!navigator.gpu) {
      console.error("[folk] webgpu not supported (fallback: webgl)");
      console.log("[folk] loading: webgl");
      renderer = new THREE.WebGLRenderer({ antialias: false });
    } else {
      await renderer.init();
    }
  } else {
    console.log("[folk] loading: webgl");
    renderer = new THREE.WebGLRenderer({ antialias: false });
  }
  game_canvas = renderer.domElement;

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x7cc6e7);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  document.body.appendChild(renderer.domElement);
 
  console.log("[folk] loading: ambient light");
  const ambient_light = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambient_light);

  console.log("[folk] loading: light");
  light = new THREE.DirectionalLight(0xffffff, 5);
  light.position.set(0, 0, 0);
  light.castShadow = true;
  light.shadow.mapSize.set(4096, 4096);
  light.shadow.camera.left = -1280;
  light.shadow.camera.right = 1280;
  light.shadow.camera.top = 1280;
  light.shadow.camera.bottom = -1280;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 2048;

  scene.add(light);
  scene.add(light.target);

  console.log("[folk] loading: textures (engine)");
  console.log("[folk] loading: stud (texture)");
  stud = new THREE.TextureLoader().load("/api/images/stud.png", (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  });

  console.log("[folk] loading: event listeners (engine)");
  document.addEventListener("mousemove", (e) => {
    if (mouse_down[2] || shift_lock) {
      const deltay = e.movementX || 0;
      const deltax = e.movementY || 0;
  
      camera_pitch += deltax * camera_sens;
      camera_yaw -= deltay * camera_sens;
      camera_pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera_pitch));
    }
  });

  document.addEventListener("mousedown", (e) => {
    mouse_down[e.button] = true;
  });

  document.addEventListener("mouseup", (e) => {
    mouse_down[e.button] = false;
  });

  document.addEventListener("keydown", (e) => {
    if (document.activeElement === chat_input) return;
    let code = e.code;
    if (e.code == "ArrowUp") {
      code = "KeyW";
    } else if (e.code == "ArrowDown") {
      code = "KeyS";
    }
    key_down[code] = true;
    if (code == "ShiftLeft") {
      shift_lock = !shift_lock;
      if (shift_lock) {
        document.body.requestPointerLock();
      } else {
        document.exitPointerLock();
      }
    } else if (code == "Slash") {
      e.preventDefault();
      chat_input.focus();
    } else if (code == "Comma") {
      camera_yaw += Math.PI / 4;
    } else if (code == "Period") {
      camera_yaw += Math.PI / -4;
    }
  });

  document.addEventListener("keyup", (e) => {
    if (document.activeElement === chat_input) return;
    let code = e.code;
    if (e.code == "ArrowUp") {
      code = "KeyW";
    } else if (e.code == "ArrowDown") {
      code = "KeyS";
    }
    key_down[code] = false;
  });

  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  document.addEventListener("wheel", (e) => {
    e.preventDefault();
    camera_distance += e.deltaY * 0.01;
    camera_distance = Math.max(0, Math.min(50, camera_distance));
  }, { passive: false });

  window.addEventListener("resize", () => {
    width = window.innerWidth;
    height = window.innerHeight;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  console.log("[folk] loading: player");
  player_obj_init(scene, () => {
    player = player_init(me.username);
    scene.add(player.model);
    world.addBody(player.body);
    player.body.position.set(0, 500, 0);
    player.nametag.position.set(0, 4, 0);
    player.nametag.scale.set(10, 2.5, 10);
    scene.add(player.nametag);
  });
}

export async function engine_map_load(id) {
  console.log("[folk] destroying: all parts");
  scene.traverse((obj) => {
    if (obj.isMesh) {
      scene.remove(obj);
    }
  });
  console.log("[folk] loading: map (id: " + id + ")");
  await map_init(deg, id);
}

export function engine_input(dt) {
  const speed = 16;
  const turn_speed = 10;
  if (!player) return;
  player.body.velocity.x = 0;
  player.body.velocity.z = 0;

  let movex = 0;
  let movey = 0;
  let movez = 0;
  if (key_down["KeyW"]) movez -= 1;
  if (key_down["KeyS"]) movez += 1;
  if (key_down["KeyA"]) movex -= 1;
  if (key_down["KeyD"]) movex += 1;
  if (key_down["ArrowLeft"]) camera_yaw += camera_sens * 5;
  if (key_down["ArrowRight"]) camera_yaw -= camera_sens * 5;
  if (key_down["Space"]) movey += 1;

  if (movex != 0 || movez != 0) {
    let target_yaw = camera_yaw;
    if (key_down["KeyW"]) target_yaw += 0;
    if (key_down["KeyS"]) target_yaw += Math.PI;
    if (key_down["KeyA"]) target_yaw += Math.PI/2;
    if (key_down["KeyD"]) target_yaw += -Math.PI/2;
    if (key_down["KeyW"] && key_down["KeyA"]) target_yaw = camera_yaw + Math.PI/4;
    if (key_down["KeyW"] && key_down["KeyD"]) target_yaw = camera_yaw + -Math.PI/4;
    if (key_down["KeyS"] && key_down["KeyA"]) target_yaw = camera_yaw + 3*Math.PI/4;
    if (key_down["KeyS"] && key_down["KeyD"]) target_yaw = camera_yaw + -3*Math.PI/4;

    const diff = Math.atan2(Math.sin(target_yaw - player_yaw), Math.cos(target_yaw - player_yaw));
    player_yaw += diff * turn_speed * dt;
    player.body.quaternion.setFromEuler(0, player_yaw, 0);
    player.walking = true;
  } else {
    player.walking = false;
  }
  
  if (shift_lock) {
    player.body.quaternion.setFromEuler(0, camera_yaw, 0);
  }

  player.on_ground = false;
  for (let contact of world.contacts) {
    if ((contact.bi === player.body || contact.bj === player.body)) {
      const normal = contact.bi === player.body ? contact.ni : new CANNON.Vec3(-contact.ni.x, -contact.ni.y, -contact.ni.z);
      if (normal.y < -0.5) {
        player.on_ground = true;
      }
    }
  }

  if (movey == 1 && player.on_ground) {
    player.body.velocity.y = 50;
  }

  const length = Math.sqrt(movex * movex + movez * movez);
  if (length > 0) { movex /= length; movez /= length; }

  player.body.velocity.x = (movex * Math.cos(camera_yaw) + movez * Math.sin(camera_yaw)) * speed;
  player.body.velocity.z = (-movex * Math.sin(camera_yaw) + movez * Math.cos(camera_yaw)) * speed;
}

export function engine_loop() {
  requestAnimationFrame(engine_loop);
 
  let info = renderer.info.render;
  let now = performance.now();
  let dt = (now - lt) / 1000;
  lt = now;
  if (dt > 0.1) {
    return;
  }
  engine_input(dt);
  world.step(1/60, dt, 3);

  if (player) {
    player.model.position.copy(player.body.position);
    player.model.quaternion.copy(player.body.quaternion);
    
    player.nametag.position.copy(player.model.position);
    player.nametag.position.y += 5.75;

    player_animate(player);
    player.model.updateMatrixWorld(true);

    light.position.x = player.model.position.x + 128;
    light.position.y = player.model.position.y + 256;
    light.position.z = player.model.position.z + 128;

    const head_world_pos = new THREE.Vector3();
    player.parts["Head"].getWorldPosition(head_world_pos);
    head_world_pos.y += 0.35;

    const sin_yaw = Math.sin(camera_yaw);
    const cos_yaw = Math.cos(camera_yaw);
    
    camera.position.x = head_world_pos.x + camera_distance * Math.cos(camera_pitch) * sin_yaw;
    camera.position.y = head_world_pos.y + camera_distance * Math.sin(camera_pitch);
    camera.position.z = head_world_pos.z + camera_distance * Math.cos(camera_pitch) * cos_yaw;
    if (shift_lock) {
      camera.position.x += cos_yaw * 1;
      camera.position.z += -sin_yaw * 1;
      head_world_pos.x += cos_yaw * 1;
      head_world_pos.z += -sin_yaw * 1;
    }

    camera.lookAt(head_world_pos);
  }

  renderer.render(scene, camera);
  ui_draw();
}
