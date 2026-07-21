import { map_init } from './map.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const geom = new THREE.BoxGeometry();

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x1a1a1a);
renderer.setPixelRatio(0.4);
document.body.appendChild(renderer.domElement);

camera.position.z = 1;

const ambient_light = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient_light);

const directional_light = new THREE.DirectionalLight(0xffffff, 0.8);
directional_light.position.set(5, 10, 7);
scene.add(directional_light);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function deg(degrees) {
  return degrees * (Math.PI / 180);
}

map_init(scene, deg, geom, 1)

function animate() {
  requestAnimationFrame(animate);

  renderer.render(scene, camera);
}

animate();
