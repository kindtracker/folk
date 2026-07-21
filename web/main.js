import * as THREE from "https://esm.sh/three@0.185.1";
import { map_init } from "./map.js";
import { player_init, player_obj_init } from "./player.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const geom = new THREE.BoxGeometry();
const canvas = renderer.domElement;

const camera_target = new THREE.Vector3(0, 0, 0);
let camera_distance = 10;
let camera_yaw = 0;
let camera_pitch = 0.0;
let mouse_down = [false, false, false];

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x1a1a1a);
renderer.setPixelRatio(0.6);
document.body.appendChild(renderer.domElement);

camera.position.y = 6;

const ambient_light = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient_light);

const directional_light = new THREE.DirectionalLight(0xffffff, 0.8);
directional_light.position.set(5, 10, 7);
scene.add(directional_light);

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
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function deg(degrees) {
  return degrees * (Math.PI / 180);
}

map_init(scene, deg, geom, 1);
player_obj_init(scene);
player_init("d")

function animate() {
  requestAnimationFrame(animate);

  camera.position.x = camera_target.x + camera_distance * Math.cos(camera_pitch) * Math.sin(camera_yaw);
  camera.position.y = camera_target.y + camera_distance * Math.sin(camera_pitch);
  camera.position.z = camera_target.z + camera_distance * Math.cos(camera_pitch) * Math.cos(camera_yaw);
  
  camera.lookAt(camera_target);

  renderer.render(scene, camera);
}

animate();
