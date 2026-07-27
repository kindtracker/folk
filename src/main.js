import { engine_load, engine_map_load, engine_loop } from "/engine/folk-engine.js";

const me_res = await fetch("/api/me");
export const me = await me_res.json();

export let loaded = false;

let params = new URL(document.location.toString()).searchParams;
let webgpu_enabled = params.get("webgpu") ? true : false;
let game_id = params.get("game_id");
game_id = game_id ? game_id : 1;

await engine_load(webgpu_enabled);
await engine_map_load(game_id);
loaded = true;
engine_loop();
