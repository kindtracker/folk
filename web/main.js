import { engine_load, engine_map_load, engine_loop } from "/engine/engine.js";
import { ui_load } from "/ui/ui.js";

const me_res = await fetch("/api/me");
export const me = await me_res.json();

ui_load();
await engine_load(false);
await engine_map_load(1);
engine_loop();
