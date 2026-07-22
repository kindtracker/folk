import * as THREE from "https://esm.sh/three@0.185.1";
import { map_init } from "./map.js";
import { player_animate, player_init, player_obj_init } from "./player.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const canvas = renderer.domElement;

const camera_target = new THREE.Vector3(0, 0, 0);
let camera_distance = 10;
let camera_yaw = 0;
let camera_pitch = 0.0;
let mouse_down = [false, false, false];

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x7cc6e7);
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

camera.position.y = 6;

const ambient_light = new THREE.AmbientLight(0xffffff, 0.4);
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
  if (mouse_down[2]) {
    const deltay = e.movementX || 0;
    const deltax = e.movementY || 0;
  
    camera_pitch += deltax * 0.005;
    camera_yaw -= deltay * 0.005;
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

document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

document.addEventListener("wheel", (e) => {
  e.preventDefault();
  camera_distance += e.deltaY * 0.01;
  camera_distance = Math.max(2, Math.min(50, camera_distance));
}, { passive: false });

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function deg(degrees) {
  return degrees * (Math.PI / 180);
}

map_init(scene, deg, 1);

let player = null;
player_obj_init(scene, () => {
  player = player_init("test");
  animate();
});

function animate() {
  requestAnimationFrame(animate);

  camera.position.x = camera_target.x + camera_distance * Math.cos(camera_pitch) * Math.sin(camera_yaw);
  camera.position.y = camera_target.y + camera_distance * Math.sin(camera_pitch);
  camera.position.z = camera_target.z + camera_distance * Math.cos(camera_pitch) * Math.cos(camera_yaw);

  player_animate(player);
  if (player.parts["Head"]) {
    const world_pos = new THREE.Vector3();
    player.parts["Head"].getWorldPosition(world_pos);
    world_pos.y += 0.35;
    camera.lookAt(world_pos);
  }

  renderer.render(scene, camera);
}
