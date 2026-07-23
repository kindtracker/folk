import * as THREE from "https://esm.sh/three@0.185.1";
import * as CANNON from "https://esm.sh/cannon-es";

export async function map_init(world, scene, deg, id) {
  const map_res = await fetch(`http://127.0.0.1:80/api/maps/${id}`);
  const map = await map_res.json();

  for (let i = 0; i < map.length; i++) {
    const partj = map[i];
    if (partj.T == "ShirtPad") {
      continue;
    }

    const p = [partj.P[0], partj.P[1], partj.P[2]];
    const r = [deg(partj.R[0]), deg(partj.R[1]), deg(partj.R[2])];
    const s = [partj.S[0], partj.S[1], partj.S[2]];

    const mat = new THREE.MeshStandardMaterial({ color: Number(`0x${partj.C}`) });
    const geom = new THREE.BoxGeometry(s[0], s[1], s[2]);
    const part = new THREE.Mesh(geom, mat);
    part.position.set(p[0], p[1], p[2]);
    part.rotation.set(r[0], r[1], r[2]);
    part.castShadow = true;
    part.receiveShadow = true;
    scene.add(part);

    const cpart = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          s[0] / 2,
          s[1] / 2,
          s[2] / 2
        )
      )
    });
    cpart.position.set(p[0], p[1], p[2]);
    cpart.quaternion.setFromEuler(r[0], r[1], r[2]);
    world.addBody(cpart);
  }
}
