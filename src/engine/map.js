import { mergeGeometries } from "https://esm.sh/three@0.185.1/examples/jsm/utils/BufferGeometryUtils.js";
import * as THREE from "https://esm.sh/three@0.185.1";
import * as CANNON from "https://esm.sh/cannon-es";

import { world, scene, stud, stud_scale, group_map, group_player, csm } from "/engine/folk-engine.js";

export async function map_init(deg, id, spawn_points = []) {
  const map_res = await fetch(`/api/maps/${id}`);
  const map = await map_res.json();
  
  const groups = {};
  const map_body = new CANNON.Body({
    mass: 0
  });

  for (let i = 0; i < map.length; i++) {
    const partj = map[i];
    if (partj.T == "ShirtPad") {
      continue;
    }

    const p = partj.P;
    const r = [deg(partj.R[0]), deg(partj.R[1]), deg(partj.R[2])];
    const s = partj.S;
    const tr_hex = partj.Tr.toString(16).padStart(2, "0");
    if (!groups[partj.C+tr_hex]) groups[partj.C+tr_hex] = {sides: [], studs: []};

    const geom = new THREE.BoxGeometry(s[0], s[1], s[2]);
    geom.rotateX(r[0]);
    geom.rotateY(r[1]);
    geom.rotateZ(r[2]);
    geom.translate(p[0], p[1], p[2]);
    
    const top = new THREE.PlaneGeometry(s[0], s[2]);
    top.rotateX(-Math.PI / 2);
    top.translate(0, s[1] / 2, 0);
    const bottom = new THREE.PlaneGeometry(s[0], s[2]);
    bottom.rotateX(Math.PI / 2);
    bottom.translate(0, -s[1] / 2, 0);

    top.rotateX(r[0]);
    top.rotateY(r[1]);
    top.rotateZ(r[2]);
    top.translate(p[0], p[1], p[2]);

    let uv = top.attributes.uv;
    uv.setXY(0, 0, 0);
    uv.setXY(1, s[0] / stud_scale, 0);
    uv.setXY(2, 0, s[2] / stud_scale);
    uv.setXY(3, s[0] / stud_scale, s[2] / stud_scale);
    uv.needsUpdate = true;
    
    uv = bottom.attributes.uv;
    uv.setXY(0, 0, 0);
    uv.setXY(1, s[0] / stud_scale, 0);
    uv.setXY(2, 0, s[2] / stud_scale);
    uv.setXY(3, s[0] / stud_scale, s[2] / stud_scale);
    uv.needsUpdate = true;

    bottom.rotateX(r[0]);
    bottom.rotateY(r[1]);
    bottom.rotateZ(r[2]);
    bottom.translate(p[0], p[1], p[2]);

    groups[partj.C+tr_hex].studs.push(top);
    groups[partj.C+tr_hex].studs.push(bottom);
    groups[partj.C+tr_hex].sides.push(geom);

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
    
    map_body.addShape(
      new CANNON.Box(new CANNON.Vec3(s[0]/2, s[1]/2, s[2]/2)),
      new CANNON.Vec3(p[0], p[1], p[2]),
      new CANNON.Quaternion().setFromEuler(r[0], r[1],r[2])
    );

    if (partj.T == "SpawnLocation") {
      spawn_points.push([p[0], p[1], p[2]]);
    }
  }
  map_body.collisionFilterGroup = group_map;
  map_body.collisionFilterMask = group_player;
  world.addBody(map_body);

  for (const color in groups) {
    const merged_side = mergeGeometries(groups[color].sides);
    const merged_stud = mergeGeometries(groups[color].studs);

    let tr = Number("0x" + color.slice(6));
    const side_mat = new THREE.MeshLambertMaterial({
      color: Number(`0x${color.slice(0, 6)}`),
      flatShading: true,
      transparent: tr == 1,
      opacity: tr - 1
    });

    const stud_mat = new THREE.MeshLambertMaterial({
      map: stud,
      transparent: true,
      color: Number(`0x${color.slice(0, 6)}`),
      flatShading: true
    });
    if (tr > 0) {
      stud_mat.opacity = tr - 1
    }
    
    csm.setupMaterial(side_mat);
    csm.setupMaterial(stud_mat);
    const mesh_side = new THREE.Mesh(merged_side, side_mat);
    const mesh_stud = new THREE.Mesh(merged_stud, stud_mat);
    mesh_side.receiveShadow = true;
    mesh_side.castShadow = true;
    mesh_stud.receiveShadow = true;
    mesh_stud.castShadow = true;
    scene.add(mesh_side);
    scene.add(mesh_stud);
  }

  return spawn_points[Math.floor(Math.random() * spawn_points.length)];
}
