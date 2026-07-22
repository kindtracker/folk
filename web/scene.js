import * as THREE from "https://esm.sh/three@0.185.1";

export function scene_init() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const geom = new THREE.BoxGeometry();
  const canvas = renderer.domElement;
  return {scene, camera, renderer, canvas};
}
