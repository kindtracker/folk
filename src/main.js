import { engine_load, engine_map_load, engine_loop } from "/engine/folk-engine.js";
import { ui_load } from "/ui/ui.js";

const me_res = await fetch("/api/me");
export const me = await me_res.json();

let params = new URL(document.location.toString()).searchParams;
let webgpu_enabled = params.get("webgpu") ? true : false;
let game_id = params.get("game_id");
game_id = game_id ? game_id : 1;

ui_load();
await engine_load(webgpu_enabled);
await engine_map_load(game_id);
engine_loop();
