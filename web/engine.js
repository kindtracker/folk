import * as THREE from "https://esm.sh/three@0.185.1";
import * as CANNON from "https://esm.sh/cannon-es";
import { map_init } from "./map.js";
import { player_animate, player_init, player_obj_init } from "./player.js";

let player = null;
let world = null;
let scene = null;
let camera = null;
let renderer = null;
let canvas = null;

let camera_distance = 10;
let camera_yaw = 0;
let camera_pitch = 0.0;
let player_yaw = 0;
let mouse_down = [false, false, false];
let key_down = {};
let shift_lock = false;

let lt = performance.now();

function deg(degrees) {
  return degrees * (Math.PI / 180);
}

export function engine_load() {
  world = new CANNON.World({ gravity: new CANNON.Vec3(0, -196.2, 0) });
  world.defaultContactMaterial.friction = 0;
  world.solver.iterations = 10;
  world.broadphase = new CANNON.NaiveBroadphase();
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  canvas = renderer.domElement;

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x7cc6e7);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  camera.position.y = 6;

  const ambient_light = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient_light);

  const light = new THREE.DirectionalLight(0xffffff, 5);
  light.position.set(20, 30, 20);
  light.castShadow = true;

  light.shadow.mapSize.set(2048, 2048);

  light.shadow.camera.left = -50;
  light.shadow.camera.right = 50;
  light.shadow.camera.top = 50;
  light.shadow.camera.bottom = -50;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 100;

  scene.add(light);
  scene.add(light.target);

  document.addEventListener("mousemove", (e) => {
    if (mouse_down[2] || shift_lock) {
      const deltay = e.movementX || 0;
      const deltax = e.movementY || 0;
  
      camera_pitch += deltax * 0.007;
      camera_yaw -= deltay * 0.007;
      camera_pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera_pitch));
    }
  });

  document.addEventListener("mousedown", (e) => {
    e.preventDefault();
    mouse_down[e.button] = true;
  });

  document.addEventListener("mouseup", (e) => {
    e.preventDefault();
    mouse_down[e.button] = false;
  });

  document.addEventListener("keydown", (e) => {
    key_down[e.code] = true;
    if (e.code == "ShiftLeft") {
      shift_lock = !shift_lock;
      if (shift_lock) {
        document.body.requestPointerLock();
      } else {
        document.exitPointerLock();
      }
    }
  });

  document.addEventListener("keyup", (e) => {
    key_down[e.code] = false;
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
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  player_obj_init(scene, () => {
    player = player_init("test");
    scene.add(player.model);
    world.addBody(player.body);
    player.body.position.set(0, 2, 0);
  });
}

export async function engine_map_load(id) {
  scene.traverse((obj) => {
    if (obj.isMesh) {
      scene.remove(obj);
    }
  });
  await map_init(world, scene, deg, 1);
}

export function engine_input(dt) {
  const speed = 16;
  const turn_speed = 10;
  player.body.velocity.x = 0;
  player.body.velocity.z = 0;

  let movex = 0;
  let movey = 0;
  let movez = 0;
  if (key_down["KeyW"]) movez -= 1;
  if (key_down["KeyS"]) movez += 1;
  if (key_down["KeyA"]) movex -= 1;
  if (key_down["KeyD"]) movex += 1;
  if (key_down["Space"]) movey += 1;

  if (movex != 0 || movez != 0) { 
    const diff = Math.atan2(Math.sin(camera_yaw - player_yaw), Math.cos(camera_yaw - player_yaw));
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
 
  let now = performance.now();
  let dt = (now - lt) / 1000;
  lt = now;
  if (dt > 0.1) {
    return;
  }
  engine_input(dt);
  world.step(dt);

  player.model.position.copy(player.body.position);
  player.model.quaternion.copy(player.body.quaternion);
 
  if (player) {
    player_animate(player);
    player.model.updateMatrixWorld(true);
  
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
}
