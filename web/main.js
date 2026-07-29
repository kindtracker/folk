// src/engine/folk-engine.js
import { CSM } from "https://esm.sh/three@0.185.1/examples/jsm/csm/CSM.js";
import { WebGPURenderer } from "https://esm.sh/three@0.185.1/webgpu.js";
import * as THREE4 from "https://esm.sh/three@0.185.1";
import * as CANNON3 from "https://esm.sh/cannon-es";

// src/engine/map.js
import { mergeGeometries } from "https://esm.sh/three@0.185.1/examples/jsm/utils/BufferGeometryUtils.js";
import * as THREE from "https://esm.sh/three@0.185.1";
import * as CANNON from "https://esm.sh/cannon-es";
async function map_init(deg2, id, spawn_points = []) {
  const map_res = await fetch(`/api/maps/${id}`);
  const map = await map_res.json();
  const groups = {};
  const map_body = new CANNON.Body({
    mass: 0
  });
  const truss_body = new CANNON.Body({ mass: 0 });
  for (let i = 0; i < map.length; i++) {
    const partj = map[i];
    if (partj.T == "ShirtPad") {
      continue;
    }
    const p = partj.P;
    const r = [deg2(partj.R[0]), deg2(partj.R[1]), deg2(partj.R[2])];
    const s2 = partj.S;
    const tr_hex = partj.Tr.toString(16).padStart(2, "0");
    if (!groups[partj.C + tr_hex]) groups[partj.C + tr_hex] = { sides: [], studs: [] };
    const geom = new THREE.BoxGeometry(s2[0], s2[1], s2[2]);
    geom.rotateX(r[0]);
    geom.rotateY(r[1]);
    geom.rotateZ(r[2]);
    geom.translate(p[0], p[1], p[2]);
    const top = new THREE.PlaneGeometry(s2[0], s2[2]);
    top.rotateX(-Math.PI / 2);
    top.translate(0, s2[1] / 2, 0);
    const bottom = new THREE.PlaneGeometry(s2[0], s2[2]);
    bottom.rotateX(Math.PI / 2);
    bottom.translate(0, -s2[1] / 2, 0);
    top.rotateX(r[0]);
    top.rotateY(r[1]);
    top.rotateZ(r[2]);
    top.translate(p[0], p[1], p[2]);
    let uv = top.attributes.uv;
    uv.setXY(0, 0, 0);
    uv.setXY(1, s2[0] / stud_scale, 0);
    uv.setXY(2, 0, s2[2] / stud_scale);
    uv.setXY(3, s2[0] / stud_scale, s2[2] / stud_scale);
    uv.needsUpdate = true;
    uv = bottom.attributes.uv;
    uv.setXY(0, 0, 0);
    uv.setXY(1, s2[0] / stud_scale, 0);
    uv.setXY(2, 0, s2[2] / stud_scale);
    uv.setXY(3, s2[0] / stud_scale, s2[2] / stud_scale);
    uv.needsUpdate = true;
    bottom.rotateX(r[0]);
    bottom.rotateY(r[1]);
    bottom.rotateZ(r[2]);
    bottom.translate(p[0], p[1], p[2]);
    groups[partj.C + tr_hex].studs.push(top);
    groups[partj.C + tr_hex].studs.push(bottom);
    groups[partj.C + tr_hex].sides.push(geom);
    const cpart = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(
        new CANNON.Vec3(
          s2[0] / 2,
          s2[1] / 2,
          s2[2] / 2
        )
      )
    });
    cpart.position.set(p[0], p[1], p[2]);
    cpart.quaternion.setFromEuler(r[0], r[1], r[2]);
    if (partj.T == "Truss" || s2[1] < 1.5) {
      truss_body.addShape(
        new CANNON.Box(new CANNON.Vec3(s2[0] / 2, s2[1] / 2, s2[2] / 2)),
        new CANNON.Vec3(p[0], p[1], p[2]),
        new CANNON.Quaternion().setFromEuler(r[0], r[1], r[2])
      );
    } else if (partj.T == "Part") {
      map_body.addShape(
        new CANNON.Box(new CANNON.Vec3(s2[0] / 2, s2[1] / 2, s2[2] / 2)),
        new CANNON.Vec3(p[0], p[1], p[2]),
        new CANNON.Quaternion().setFromEuler(r[0], r[1], r[2])
      );
    } else {
      console.error(`[folk] found an invalid type on map: ${partj.T}`);
    }
    if (partj.T == "SpawnLocation") {
      spawn_points.push([p[0], p[1], p[2]]);
    }
  }
  truss_body.climbable = true;
  world.addBody(map_body);
  world.addBody(truss_body);
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
      stud_mat.opacity = tr - 1;
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
  window.spawn_points = spawn_points;
  return spawn_points[Math.floor(Math.random() * spawn_points.length)];
}

// src/engine/player.js
import * as SkeletonUtils from "https://esm.sh/three@0.185.1/examples/jsm/utils/SkeletonUtils.js";
import * as THREE3 from "https://esm.sh/three@0.185.1";
import * as CANNON2 from "https://esm.sh/cannon-es";

// src/engine/obj.js
import * as THREE2 from "https://esm.sh/three@0.185.1";
import { GLTFLoader } from "https://esm.sh/three@0.185.1/examples/jsm/loaders/GLTFLoader.js";
var gltfLoader = new GLTFLoader();
function glb_load(path, on_load) {
  gltfLoader.load(path, (gltf) => {
    const model = gltf.scene;
    on_load(model);
  });
}

// src/engine/player.js
var texture_loader = new THREE3.TextureLoader();
var player_model_male = null;
var player_model_female = null;
var mesh_map = {
  0: "face",
  1: "shirt",
  2: "pants",
  3: "shirt",
  4: "pants",
  5: "shirt"
};
var head_blend_shader = (shader) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <map_fragment>",
    `#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D(map, vec2(1.0 - vMapUv.x, vMapUv.y));
  diffuseColor.rgb = mix(diffuseColor.rgb, sampledDiffuseColor.rgb, sampledDiffuseColor.a);
  diffuseColor.a *= opacity;
  #endif`
  );
};
var blend_shader = (shader) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <map_fragment>",
    `#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D(map, vMapUv);
  diffuseColor.rgb = mix(diffuseColor.rgb, sampledDiffuseColor.rgb, sampledDiffuseColor.a);
  diffuseColor.a *= opacity;
  #endif`
  );
};
function player_obj_init_on_load(model, male) {
  model.position.set(0, 0, 0);
  model.scale.set(1, 1, 1);
  if (male) {
    player_model_male = model;
  } else {
    player_model_female = model;
  }
}
function player_obj_init(scene2, callback) {
  return Promise.all([
    new Promise((resolve) => {
      glb_load("/api/objects/male.glb", (model) => {
        player_obj_init_on_load(model, true);
        resolve();
      });
    }),
    new Promise((resolve) => {
      glb_load("/api/objects/female.glb", (model) => {
        player_obj_init_on_load(model, false);
        resolve();
      });
    })
  ]);
}
function player_animate(player2, dt, lid) {
  const time = Date.now();
  let swing = Math.PI;
  if (player2.walking) {
    swing += Math.sin(time / 90) * Math.PI / 2;
  }
  let anim = "idle";
  if (!player2.on_ground) {
    anim = "fall";
  } else if (player2.walking) {
    anim = "walk";
  }
  if (player2.on_ground && player2.id == lid && key_down["Space"]) {
    anim = "fall";
  }
  if (player2.climbing) {
    anim = "climb";
  }
  engine_move(player2.parts["Right_Leg"], new THREE3.Vector3(0, 0, -1));
  engine_move(player2.parts["Left_Leg"], new THREE3.Vector3(0, 0, -1));
  if (anim == "walk") {
    const swing2 = Math.PI + Math.sin(player2.walking / 120) * Math.PI / 4;
    engine_rot(player2.parts["Right_Arm"], new THREE3.Vector3(swing2 - Math.PI / 2, Math.PI, 0));
    engine_rot(player2.parts["Left_Arm"], new THREE3.Vector3(-swing2 - Math.PI / 2, Math.PI, 0));
    engine_rot(player2.parts["Right_Leg"], new THREE3.Vector3(-swing2 - Math.PI / 2, Math.PI, 0));
    engine_rot(player2.parts["Left_Leg"], new THREE3.Vector3(swing2 - Math.PI / 2, Math.PI, 0));
  } else if (anim == "fall") {
    engine_rot(player2.parts["Right_Arm"], new THREE3.Vector3(-Math.PI + Math.PI / 1.75, Math.PI, 0));
    engine_rot(player2.parts["Left_Arm"], new THREE3.Vector3(-Math.PI + Math.PI / 1.75, Math.PI, 0));
    engine_rot(player2.parts["Right_Leg"], new THREE3.Vector3(-Math.PI - Math.PI / 2, Math.PI, 0));
    engine_rot(player2.parts["Left_Leg"], new THREE3.Vector3(Math.PI - Math.PI / 2, Math.PI, 0));
  } else if (anim == "climb") {
    const swing2 = Math.PI + Math.cos(player2.walking / 100) * Math.PI / 6;
    const up = Math.sin(player2.walking * 0.01) / 2;
    const up2 = Math.sin((player2.walking + Math.PI / 2 * 1e3) * 0.01) / 2;
    engine_rot(player2.parts["Right_Arm"], new THREE3.Vector3(swing2 + Math.PI / 1.5, Math.PI, 0));
    engine_rot(player2.parts["Left_Arm"], new THREE3.Vector3(-swing2 + Math.PI / 1.5, Math.PI, 0));
    engine_rot(player2.parts["Right_Leg"], new THREE3.Vector3(-Math.PI - Math.PI / 1.75, Math.PI, 0));
    engine_rot(player2.parts["Left_Leg"], new THREE3.Vector3(Math.PI - Math.PI / 1.75, Math.PI, 0));
    engine_move(player2.parts["Right_Leg"], new THREE3.Vector3(0, 0, up - 0.5));
    engine_move(player2.parts["Left_Leg"], new THREE3.Vector3(0, 0, up2 - 0.5));
  } else if (anim == "idle") {
    const swing2 = Math.PI + Math.sin(time * 0.01) * 0.05;
    engine_rot(player2.parts["Right_Arm"], new THREE3.Vector3(swing2 - Math.PI / 2, Math.PI, 0));
    engine_rot(player2.parts["Left_Arm"], new THREE3.Vector3(-swing2 - Math.PI / 2, Math.PI, 0));
    engine_rot(player2.parts["Right_Leg"], new THREE3.Vector3(-Math.PI - Math.PI / 2, Math.PI, 0));
    engine_rot(player2.parts["Left_Leg"], new THREE3.Vector3(Math.PI - Math.PI / 2, Math.PI, 0));
  }
}
function player_avatar_load(player2, avatar) {
  let mesh_index = 0;
  player2.model.traverse((child) => {
    if (child.isMesh) {
      const texture = texture_loader.load("api/clothing/image/" + avatar[mesh_map[mesh_index]]);
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
      child.material = new THREE3.MeshPhongMaterial({ map: texture, transparent: false, vertexColors: false });
      csm.setupMaterial(child.material);
      if (mesh_index === 0) {
        child.material.onBeforeCompile = head_blend_shader;
      } else {
        child.material.onBeforeCompile = blend_shader;
      }
      mesh_index++;
    }
    if (child.isBone) {
      player2.parts[child.name] = child;
    }
  });
}
function player_init(name2, id, avatar) {
  console.log(`[folk] loading: player (name: ${name2})`);
  if (!player_model_male || !player_model_female) {
    console.error("[folk] player model not loaded yet");
    console.error(`[folk] player_model_male: ${player_model_male ? "loaded" : "not loaded"}`);
    console.error(`[folk] player_model_female: ${player_model_female ? "loaded" : "not loaded"}`);
    return null;
  }
  const player2 = { name: name2, id, avatar, nametag: null, body: null, model: null, hp: 100, walking: false, on_ground: false, climbing: false, parts: [] };
  player2.model = SkeletonUtils.clone(avatar.gender == "male" ? player_model_male : player_model_female);
  player_avatar_load(player2, avatar);
  const canvas2 = document.createElement("canvas");
  const ctx2 = canvas2.getContext("2d");
  canvas2.width = 1024;
  canvas2.height = 256;
  ctx2.font = '600 40px "Montserrat", system-ui, -apple-system, sans-serif';
  ctx2.textAlign = "center";
  ctx2.miterLimit = 2;
  ctx2.lineWidth = 3;
  ctx2.strokeStyle = "black";
  ctx2.strokeText(name2, 512, 160);
  ctx2.fillStyle = "white";
  ctx2.fillText(name2, 512, 160);
  const texture = new THREE3.CanvasTexture(canvas2);
  const material = new THREE3.SpriteMaterial({
    map: texture,
    transparent: true
  });
  player2.nametag = new THREE3.Sprite(material);
  player2.nametag.renderOrder = 1e3;
  player2.nametag.material.depthWrite = false;
  player2.body = new CANNON2.Body({
    mass: 1
  });
  player2.body.addShape(
    new CANNON2.Box(new CANNON2.Vec3(1, 2, 0.5)),
    new CANNON2.Vec3(0, 2, 0.3)
  );
  player2.body.linearDamping = 0;
  player2.body.fixedRotation = true;
  player2.body.updateMassProperties();
  return player2;
}

// src/engine/ui/chat.js
var chat = { messages: [], scroll: 0 };
var chat_input = null;
var chat_toggle = true;
var chat_width = 80 * 5;
var chat_height = 60 * 4;
var ucolors = [
  "#fd2943",
  "#01a2ff",
  "#02b857",
  "#7c5cff",
  "#ff7f00",
  "#ffd500",
  "#ff98dc",
  "#d7c06a"
];
function chat_init() {
  console.log("[folk] loading: chat");
  chat_input = document.createElement("input");
  chat_input.type = "text";
  chat_input.placeholder = "Type a message...";
  chat_input.style.borderRadius = "0px";
  chat_input.style.position = "fixed";
  chat_input.style.zIndex = "1001";
  chat_input.style.display = "none";
  chat_input.style.background = "#a0a0a080";
  chat_input.style.outline = "none";
  chat_input.style.color = "white";
  chat_input.style.font = '400 14px "Montserrat", system-ui, -apple-system, sans-serif';
  chat_input.style.padding = "4px";
  chat_input.style.left = "5px";
  chat_input.style.top = `${chat_height - 8}px`;
  chat_input.style.width = `${chat_width - 22}px`;
  chat_input.style.height = "24px";
  document.body.appendChild(chat_input);
  console.log("[folk] loading: event listeners (chat)");
  chat_input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const text = chat_input.value.trim();
      if (text) {
        chat_message(me.username, chat_input.value.trim(), true);
        chat_input.value = "";
      }
      chat_input.blur();
    }
  });
}
function chat_message(username, text, me2 = false) {
  if (me2) {
    if (text == "/r") {
      engine_reset_player();
      return;
    } else if (text == "/leave") {
      window.close();
      return;
    } else if (text.startsWith("/set_camsen ")) {
      const value = Number(text.substring("/set_camsen ".length));
      if (Number.isNaN(value)) {
        chat.messages.push({
          username: "System",
          text: "Invalid number",
          time: Date.now()
        });
        return;
      }
      mset_camsen(value);
      return;
    } else if (text == "/help") {
      chat.messages.push({
        username: "System",
        text: "/r - Reset the character /leave - Close the window /set_camsen <number> - Set camera's sensitivity",
        time: Date.now()
      });
      return;
    }
  }
  chat.messages.push({
    username,
    text,
    time: Date.now()
  });
  if (chat.messages.length > 50) {
    chat.messages.shift();
  }
  chat.scroll = Math.max(0, chat_get_height() - chat_height + 50);
  if (me2) {
    window.chat_callback(username, text);
  }
}
function chat_get_ucolor(username) {
  let value = 0;
  for (let i = 0; i < name.length; i++) {
    let chr = name.charCodeAt(i);
    let reverse_idx = name.length - i;
    if (name.length & 1) reverse_idx--;
    if (reverse_idx % 4 >= 2) chr = -cht;
    value += chr;
  }
  return ucolors[(value % ucolors.length + ucolors.length) % ucolors.length];
}
function chat_draw() {
  if (!chat_toggle) {
    chat_input.style.display = "none";
    return;
  }
  ctx.fillStyle = "#20202080";
  ctx.beginPath();
  ctx.rect(0, 35, chat_width, chat_height);
  ctx.fill();
  chat_input.style.display = "block";
  ctx.fillStyle = "white";
  ctx.font = '400 14px "Montserrat", system-ui, -apple-system, sans-serif';
  let y = 55;
  for (const msg of chat.messages) {
    const p = `[${msg.username}]: ${msg.text}`;
    const prefix = `[${msg.username}]: `;
    const lines = wrap_text(msg.text, chat_width - ctx.measureText(prefix).width);
    if (y - chat.scroll >= 35) {
      const prefix2 = `[${msg.username}]: `;
      const color = chat_get_ucolor(msg.username);
      ctx.fillStyle = color;
      ctx.fillText(prefix2, 0, y - chat.scroll);
    }
    for (const line of lines) {
      if (y - chat.scroll >= 35) {
        const x = ctx.measureText(prefix).width;
        ctx.fillStyle = "white";
        ctx.fillText(line, x, y - chat.scroll);
      }
      y += 14;
    }
    y += 4;
  }
}
function chat_get_height() {
  let height2 = 0;
  for (const msg of chat.messages) {
    const lines = wrap_text(msg.text, chat_width - 18);
    height2 += lines.length * 14 + 4;
  }
  return height2;
}
function mchat_toggle(value) {
  chat_toggle = value;
}

// src/engine/ui/leaderboard.js
var lb_width = 60 * 3;
var lb_height = 60 * 6;
function lb_init() {
  console.log("[folk] loading: leaderboard");
}
function lb_draw() {
  const all_players = [player, ...players];
  all_players.sort((a, b) => a.name.localeCompare(b.name));
  lb_height = all_players.length * 25 + 3;
  ctx.fillStyle = "#20202080";
  ctx.beginPath();
  ctx.rect(width - lb_width, 35, lb_width, lb_height);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = '400 20px "Montserrat", system-ui, -apple-system, sans-serif';
  let y = 56;
  for (const _player of all_players) {
    ctx.fillStyle = "white";
    ctx.fillText(_player.name, width - lb_width + 30, y);
    y += 24;
  }
}

// src/engine/ui/f2.js
var fps_graph = [];
function f2_init() {
  console.log("[folk] loading: f2 debugger");
}
function f2_draw() {
  if (!f2_toggle) return;
  ctx.beginPath();
  ctx.fillStyle = "#000000c0";
  ctx.rect(0, height - 52.5, width, 52.5);
  ctx.fill();
  for (let i = 0; i < fps_graph.length; i++) {
    ctx.strokeStyle = `hsl(${Math.min(fps_graph[i] * 2, 320)}, 100%, 50%)`;
    ctx.beginPath();
    ctx.moveTo(i, height);
    ctx.lineTo(i, height - (52.5 - Math.max(52.5 - fps_graph[i] / 3, 0)));
    ctx.stroke();
  }
}
function f2_get(dt) {
  fps_graph.push(1 / dt);
  if (fps_graph.length > width) {
    fps_graph.shift();
  }
}
function f2_reset() {
  fps_graph = [];
}

// src/engine/ui/ui.js
var canvas = null;
var ctx = null;
var logo = null;
var icon = null;
var chat_icon = null;
var chat2_icon = null;
var logs_scroll = 0;
function ui_loading_draw() {
  ctx.fillStyle = "#ffffff60";
  ctx.beginPath();
  ctx.rect(width / 2 - 80 * 4, height / 2 - 60 * 2, 80 * 8, 60 * 4);
  ctx.fill();
  ctx.strokeStyle = "#ffffff60";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.rect(width / 2 - 80 * 4, height / 2 - 60 * 2, 80 * 8, 60 * 4);
  ctx.stroke();
  ctx.font = '400 40px "Montserrat", system-ui, -apple-system, sans-serif';
  const text_size = ctx.measureText("Loading engine");
  ctx.fillStyle = "white";
  ctx.fillText("Loading engine", width / 2 - text_size.width / 2, height / 2 + 10);
}
function ui_load() {
  console.log("[folk] loading: ui");
  console.log("[folk] loading: canvas");
  canvas = document.createElement("canvas");
  canvas.id = "ui";
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.zIndex = "1000";
  canvas.style.pointerEvents = "auto";
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");
  console.log("[folk] loading: images (ui)");
  console.log("[folk] loading: folk logo (image)");
  logo = new Image();
  logo.src = "/api/images/logo.png";
  console.log("[folk] loading: folk icon (image)");
  icon = new Image();
  icon.src = "/api/images/icon.png";
  console.log("[folk] loading: chat icon (image)");
  chat_icon = new Image();
  chat_icon.src = "/api/images/chat.png";
  console.log("[folk] loading: chat2 icon (image)");
  chat2_icon = new Image();
  chat2_icon.src = "/api/images/chat2.png";
  console.log("[folk] loading: event listeners (ui)");
  window.addEventListener("resize", () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  });
  canvas.addEventListener("click", (e) => {
    const x = e.clientX;
    const y = e.clientY;
    if (x >= 40 && x <= 40 + 30 && y >= 0 && y <= 30) {
      mchat_toggle(!chat_toggle);
      if (chat_toggle) {
        chat_input.focus();
      }
    }
  });
  ui_loading_draw();
  chat_init();
  lb_init();
  f2_init();
}
function ui_draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  chat_draw();
  lb_draw();
  f2_draw();
  ctx.fillStyle = "#20202080";
  ctx.beginPath();
  ctx.rect(0, 0, width, 30);
  ctx.fill();
  ctx.drawImage(icon, 0, 0, 30, 30);
  ctx.drawImage(chat_icon, 40, 3, 25, 25);
  ctx.font = '500 17px "Montserrat", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = "#ffffffff";
  ctx.fillText(me.username, width - lb_width + 10, 18);
  ctx.font = '400 9px "Montserrat", system-ui, -apple-system, sans-serif';
  ctx.fillText("Volts: 0", width - lb_width + 10, 28);
  chat_draw();
}
function ui_logs_draw() {
  if (!ctx) return;
  if (loaded) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ui_loading_draw();
  ctx.font = '400 14px "Montserrat", system-ui, -apple-system, sans-serif';
  let y = 14;
  for (const log of engine_logs) {
    if (y - logs_scroll > height) {
      logs_scroll += 14;
    }
    if (log.type == "log") {
      ctx.fillStyle = "green";
    } else if (log.type == "warn") {
      ctx.fillStyle = "yellow";
    } else if (log.type == "error") {
      ctx.fillStyle = "red";
    }
    ctx.fillText(log.message, 0, y - logs_scroll);
    y += 14;
  }
}
function wrap_text(text, maxWidth) {
  const lines = [];
  let line = "";
  for (const ch of text) {
    if (ch === "\n") {
      lines.push(line);
      line = "";
      continue;
    }
    const test = line + ch;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = ch;
    }
  }
  if (line) {
    lines.push(line);
  }
  return lines;
}

// src/engine/folk-engine.js
var world = null;
var scene = null;
var camera = null;
var renderer = null;
var csm = null;
var game_canvas = null;
var engine_logs = [];
var player = null;
var camera_distance = 10;
var camera_yaw = 0;
var camera_pitch = Math.PI / 10;
var player_yaw = 0;
var camera_sens = 7e-3;
var mouse_down = [false, false, false];
var key_down = {};
var shift_lock = false;
var f1_toggle = false;
var f2_toggle = false;
var width;
var height;
var player_mat_needupdate = false;
var lt = performance.now();
var stud = null;
var stud_scale = 4;
var players = [];
function deg(degrees) {
  return degrees * (Math.PI / 180);
}
var olog = console.log;
var owarn = console.warn;
var oerror = console.error;
console.log = (...args) => {
  const message = args.map(String).join(" ");
  engine_logs.push({ type: "log", message });
  olog(...args);
  ui_logs_draw();
};
console.warn = (...args) => {
  const message = args.map(String).join(" ");
  engine_logs.push({ type: "warn", message });
  owarn(...args);
  ui_logs_draw();
};
console.error = (...args) => {
  const message = args.map(String).join(" ");
  engine_logs.push({ type: "error", message });
  oerror(...args);
  ui_logs_draw();
};
function mset_camsen(sen) {
  sen = Number(sen);
  camera_sens = sen / 1e3;
}
async function engine_load(webgpu = false) {
  width = window.innerWidth;
  height = window.innerHeight;
  ui_load();
  console.log("[folk] loading: engine");
  console.log("[folk] loading: world");
  world = new CANNON3.World({ gravity: new CANNON3.Vec3(0, -196.2, 0) });
  world.defaultContactMaterial.friction = 0;
  world.solver.iterations = 10;
  world.broadphase = new CANNON3.NaiveBroadphase();
  console.log("[folk] loading: scene");
  scene = new THREE4.Scene();
  console.log("[folk] loading: camera");
  camera = new THREE4.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1e3);
  console.log("[folk] loading: renderer (webgpu=" + webgpu + ")");
  if (webgpu) {
    console.log("[folk] loading: webgpu");
    renderer = new WebGPURenderer({ antialias: true });
    if (!navigator.gpu) {
      console.error("[folk] webgpu not supported (fallback: webgl)");
      console.log("[folk] loading: webgl");
      renderer = new THREE4.WebGLRenderer({ antialias: false });
    } else {
      await renderer.init();
    }
  } else {
    console.log("[folk] loading: webgl");
    renderer = new THREE4.WebGLRenderer({ antialias: false });
  }
  game_canvas = renderer.domElement;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(8177383);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE4.PCFShadowMap;
  document.body.appendChild(renderer.domElement);
  console.log("[folk] loading: csm");
  csm = new CSM({
    maxFar: 500,
    cascades: 3,
    mode: "uniform",
    parent: scene,
    shadowMapSize: 1024,
    lightDirection: new THREE4.Vector3(-1, -1, -1),
    camera
  });
  for (const light of csm.lights) {
    light.intensity = 4;
  }
  console.log("[folk] loading: ambient light");
  const ambient_light = new THREE4.AmbientLight(16777215, 2);
  scene.add(ambient_light);
  console.log("[folk] loading: textures (engine)");
  console.log("[folk] loading: stud (texture)");
  stud = new THREE4.TextureLoader().load("/api/images/stud.png", (texture) => {
    texture.wrapS = THREE4.RepeatWrapping;
    texture.wrapT = THREE4.RepeatWrapping;
    texture.magFilter = THREE4.LinearFilter;
    texture.minFilter = THREE4.LinearMipmapLinearFilter;
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
    } else if (code == "F1") {
      f1_toggle = !f1_toggle;
      if (f1_toggle) {
        scene.traverse((obj) => {
          if (obj.isMesh) {
            obj.material.wireframe = true;
          }
        });
      } else {
        scene.traverse((obj) => {
          if (obj.isMesh) {
            obj.material.wireframe = false;
          }
        });
      }
    } else if (code == "F2") {
      f2_toggle = !f2_toggle;
    } else if (code == "Slash") {
      e.preventDefault();
      chat_input.focus();
    } else if (code == "Comma") {
      camera_yaw = Math.round(camera_yaw / (Math.PI / 4)) * (Math.PI / 4);
      camera_yaw += Math.PI / 4;
    } else if (code == "Period") {
      camera_yaw = Math.round(camera_yaw / (Math.PI / 4)) * (Math.PI / 4);
      camera_yaw += Math.PI / -4;
    }
    if (key_down["ControlLeft"] && key_down["F2"]) {
      f2_reset();
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
    player_mat_needupdate = true;
    camera_distance += e.deltaY * 0.01;
    camera_distance = Math.max(1e-3, Math.min(50, camera_distance));
  }, { passive: false });
  window.addEventListener("resize", () => {
    width = window.innerWidth;
    height = window.innerHeight;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  console.log("[folk] loading: player");
  await player_obj_init(scene);
  player = player_init(me.username, me.id, me.avatar);
  scene.add(player.model);
  world.addBody(player.body);
  player.body.position.set(0, 500, 0);
  player.nametag.position.set(0, 4, 0);
  player.nametag.scale.set(10, 2.5, 10);
  scene.add(player.nametag);
}
async function engine_map_load(id) {
  console.log("[folk] destroying: all parts");
  scene.traverse((obj) => {
    if (obj.isMesh) {
      scene.remove(obj);
    }
  });
  console.log("[folk] loading: map (id: " + id + ")");
  const map_res = await fetch(`/api/games/${id}`);
  const map = await map_res.json();
  let spawn_pos = await map_init(deg, id, map.spawn_points);
  player.body.position.set(spawn_pos[0], spawn_pos[1], spawn_pos[2]);
}
function engine_reset_player() {
  const spawn_pos = window.spawn_points[Math.floor(Math.random() * window.spawn_points.length)];
  player.body.position.set(spawn_pos[0], spawn_pos[1], spawn_pos[2]);
}
function engine_get_nearby() {
  let nearby_parts = [];
  for (let contact of world.contacts) {
    if (contact.bi === player.body || contact.bj === player.body) {
      nearby_parts.push(contact);
    }
  }
  return nearby_parts;
}
function engine_input(dt) {
  const speed = 16;
  const turn_speed = 10;
  if (!player) return;
  player.body.velocity.x = 0;
  player.body.velocity.z = 0;
  let movex = 0;
  let movey = 0;
  let movez = 0;
  if (!player.climbing) {
    if (key_down["KeyW"]) movez -= 1;
    if (key_down["KeyS"]) movez += 1;
    if (key_down["KeyA"]) movex -= 1;
    if (key_down["KeyD"]) movex += 1;
  }
  if (key_down["ArrowLeft"]) camera_yaw += camera_sens * 5;
  if (key_down["ArrowRight"]) camera_yaw -= camera_sens * 5;
  if (key_down["Space"]) movey += 1;
  if (movex != 0 || movez != 0) {
    let target_yaw = camera_yaw;
    if (key_down["KeyW"]) target_yaw += 0;
    if (key_down["KeyS"]) target_yaw += Math.PI;
    if (key_down["KeyA"]) target_yaw += Math.PI / 2;
    if (key_down["KeyD"]) target_yaw += -Math.PI / 2;
    if (key_down["KeyW"] && key_down["KeyA"]) target_yaw = camera_yaw + Math.PI / 4;
    if (key_down["KeyW"] && key_down["KeyD"]) target_yaw = camera_yaw + -Math.PI / 4;
    if (key_down["KeyS"] && key_down["KeyA"]) target_yaw = camera_yaw + 3 * Math.PI / 4;
    if (key_down["KeyS"] && key_down["KeyD"]) target_yaw = camera_yaw + -3 * Math.PI / 4;
    const diff = Math.atan2(Math.sin(target_yaw - player_yaw), Math.cos(target_yaw - player_yaw));
    player_yaw += diff * turn_speed * dt;
    player.body.quaternion.setFromEuler(0, player_yaw, 0);
    player.walking += dt * (movez == 1 ? 1e3 : movez == -1 ? -1e3 : 1e3);
  } else {
    if (!player.climbing) {
      player.walking = 0;
    }
  }
  if (player.climbing) {
    player.body.velocity.y += key_down["KeyW"] ? 10 : key_down["KeyS"] ? -10 : 0;
    player.walking += dt * (key_down["KeyW"] ? 1e3 : key_down["KeyS"] ? -1e3 : 0);
  }
  if (shift_lock) {
    player.body.quaternion.setFromEuler(0, camera_yaw, 0);
    player_yaw = camera_yaw;
  }
  if (key_down["KeyI"]) {
    player_mat_needupdate = true;
    camera_distance += 10 * dt;
    camera_distance = Math.max(1e-3, Math.min(50, camera_distance));
  }
  if (key_down["KeyO"]) {
    player_mat_needupdate = true;
    camera_distance += -10 * dt;
    camera_distance = Math.max(1e-3, Math.min(50, camera_distance));
  }
  player.on_ground = false;
  player.climbing = false;
  const nearby_parts = engine_get_nearby();
  for (const contact of nearby_parts) {
    const normal = contact.bi === player.body ? contact.ni : new CANNON3.Vec3(-contact.ni.x, -contact.ni.y, -contact.ni.z);
    if (normal.y < -0.5) {
      player.on_ground = true;
    }
    const other = contact.bi === player.body ? contact.bj : contact.bi;
    if (other.climbable && normal.y > -0.5) {
      player.climbing = true;
    }
  }
  let ignore = false;
  if (movey == 1 && (player.on_ground || player.climbing)) {
    if (player.climbing) {
      player.body.velocity.x = (Math.cos(player_yaw) + 5 * Math.sin(player_yaw)) * speed;
      player.body.velocity.z = (Math.sin(player_yaw) + 5 * Math.cos(player_yaw)) * speed;
      player.body.velocity.y = 200;
      ignore = true;
    } else {
      player.body.velocity.y = 50;
    }
  }
  if (!ignore) {
    const length = Math.sqrt(movex * movex + movez * movez);
    if (length > 0) {
      movex /= length;
      movez /= length;
    }
    player.body.velocity.x = (movex * Math.cos(camera_yaw) + movez * Math.sin(camera_yaw)) * speed;
    player.body.velocity.z = (-movex * Math.sin(camera_yaw) + movez * Math.cos(camera_yaw)) * speed;
  }
}
function engine_move(object, target) {
  object.position.copy(target);
}
function engine_rot(object, target) {
  const quat = new THREE4.Quaternion().setFromEuler(new THREE4.Euler(target.x, target.y, target.z));
  object.quaternion.copy(quat);
}
function engine_loop() {
  requestAnimationFrame(engine_loop);
  let info = renderer.info.render;
  let now = performance.now();
  let dt = (now - lt) / 1e3;
  lt = now;
  f2_get(dt);
  if (dt > 0.1) {
    return;
  }
  engine_input(dt);
  world.step(1 / 60, dt, 3);
  if (player) {
    player.model.position.copy(player.body.position);
    player.model.quaternion.copy(player.body.quaternion);
    player.nametag.position.copy(player.model.position);
    player.nametag.position.y += 5.75;
    player_animate(player, dt, player.id);
    player.model.updateMatrixWorld(true);
    const head_world_pos = new THREE4.Vector3();
    player.parts["Head"].getWorldPosition(head_world_pos);
    head_world_pos.y += 0.35;
    const sin_yaw = Math.sin(camera_yaw);
    const cos_yaw = Math.cos(camera_yaw);
    camera.position.x = head_world_pos.x + camera_distance * Math.cos(camera_pitch) * sin_yaw;
    camera.position.y = head_world_pos.y + camera_distance * Math.sin(camera_pitch);
    camera.position.z = head_world_pos.z + camera_distance * Math.cos(camera_pitch) * cos_yaw;
    if (shift_lock) {
      camera.position.x += cos_yaw * Math.min(1, camera_distance / 3);
      camera.position.z += -sin_yaw * Math.min(1, camera_distance / 3);
      head_world_pos.x += cos_yaw * Math.min(1, camera_distance / 3);
      head_world_pos.z += -sin_yaw * Math.min(1, camera_distance / 3);
    }
    if (player_mat_needupdate) {
      player.model.traverse((child) => {
        if (child.isMesh) {
          child.material.transparent = true;
          child.material.opacity = Math.max(0, camera_distance / 3);
        }
      });
    }
    if (player.climbing) {
      player.body.mass = 0;
      player.body.velocity.set(0, 0, 0);
    } else {
      player.body.mass = 1;
    }
    camera.lookAt(head_world_pos);
  }
  csm.update();
  renderer.render(scene, camera);
  ui_draw();
  window.frame_callback();
}

// src/multiplayer/folk-multiplayer.js
var ws = null;
function multiplayer_init(url, port = 6977) {
  console.log("[folk] loading: multiplayer");
  console.log(`[folk] connecting: ws://${url}:${port}`);
  ws = new WebSocket(`ws://${url}:${port}`);
  ws.onopen = () => {
    console.log("[folk] connected to the server");
    ws.send(JSON.stringify({
      type: "join",
      username: me.username,
      id: me.id
    }));
  };
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type == "update") {
      for (const oplayer of message.players) {
        if (oplayer.id == player.id) {
          continue;
        }
        let woplayer = players[oplayer.username];
        if (!woplayer) {
          if (!oplayer.avatar || Object.keys(oplayer.avatar).length == 0) {
            continue;
          }
          woplayer = player_init(oplayer.username, oplayer.id, oplayer.avatar);
          players[oplayer.username] = woplayer;
          scene.add(woplayer.model);
        }
        woplayer.model.position.set(oplayer.pos[0], oplayer.pos[1], oplayer.pos[2]);
        woplayer.model.rotation.set(0, oplayer.yaw, 0);
        woplayer.on_ground = oplayer.on_ground;
        woplayer.climbing = oplayer.climbing;
        woplayer.walking = oplayer.walking;
        woplayer.hp = oplayer.hp;
        player_animate(woplayer, player.id);
      }
    } else if (message.type == "chat") {
      if (message.id != player.id) {
        chat_message(message.username, message.message);
      }
    }
  };
  ws.onclose = () => {
    console.log("[folk] server disconnected");
  };
  ws.onerror = (err) => {
    console.error(`[folk] ${err.message}`);
  };
}
function multiplayer_tick() {
  ws.send(JSON.stringify({
    type: "player",
    pos: [
      player.body.position.x,
      player.body.position.y,
      player.body.position.z
    ],
    yaw: shift_lock ? camera_yaw : player_yaw,
    hp: player.health,
    walking: player.walking,
    climbing: player.climbing,
    on_ground: player.on_ground,
    avatar: player.avatar
  }));
}
function multiplayer_chat(username, message) {
  ws.send(JSON.stringify({
    type: "chat",
    message
  }));
}

// src/client/main.js
var loaded = false;
var params = new URL(document.location.toString()).searchParams;
var webgpu_enabled = params.get("webgpu") ? true : false;
var game_id = params.get("game_id");
game_id = game_id ? game_id : 1;
var me = null;
if (params.get("me")) {
  me = JSON.parse(decodeURIComponent(params.get("me")));
  if (me != null && me != void 0) {
    localStorage.setItem("me", me);
  }
} else if (me == null) {
  const me_res = await fetch("/api/me");
  me = await me_res.json();
}
var last = performance.now();
var s = 4;
function frame_callback() {
  const now = performance.now();
  if (now - last > 1e3 / 24) {
    s -= 1;
    if (s <= 0) {
      multiplayer_tick();
      last = now;
    }
  }
}
window.frame_callback = frame_callback;
window.chat_callback = multiplayer_chat;
await engine_load(webgpu_enabled);
await engine_map_load(game_id);
multiplayer_init("127.0.0.1", 6977);
loaded = true;
engine_loop();
export {
  loaded,
  me
};
