import { multiplayer_init, multiplayer_tick, multiplayer_chat } from "/multiplayer/folk-multiplayer.js";
import { engine_load, engine_map_load, engine_loop } from "/engine/folk-engine.js";

export let loaded = false;

let params = new URL(document.location.toString()).searchParams;
let webgpu_enabled = params.get("webgpu") ? true : false;
let game_id = params.get("game_id");
game_id = game_id ? game_id : 1;

export let me = null;

if (params.get("me")) {
  me = JSON.parse(decodeURIComponent(params.get("me")));
  if (me != null && me != undefined) {
    localStorage.setItem("me", me);
  }
} else if (me == null) {
  const me_res = await fetch("/api/me");
  me = await me_res.json();
}

let last = performance.now();
let s = 4;
function frame_callback() {
  const now = performance.now();
  if ((now - last) > 1000/24) {
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
