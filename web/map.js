import * as THREE from "https://esm.sh/three@0.185.1";

export async function map_init(scene, deg, id) {
  const map_res = await fetch(`http://127.0.0.1:80/map/${id}`);
  const map = await map_res.json();

  for (let i = 0; i < map.length; i++) {
    const partj = map[i];
    if (partj.T == "ShirtPad") {
      continue;
    }

    const mat = new THREE.MeshBasicMaterial({ color: Number(`0x${partj.C}`) });
    const geom = new THREE.BoxGeometry(partj.S[0], partj.S[1], partj.S[2]);
    const part = new THREE.Mesh(geom, mat);
    part.position.set(partj.P[0], partj.P[1], partj.P[2]);
    part.rotation.set(deg(partj.R[0]), deg(partj.R[1]), deg(partj.R[2]));
    part.castShadow = true;
    part.receiveShadow = true;
    scene.add(part);
  }
}
