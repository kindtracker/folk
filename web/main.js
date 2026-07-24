import { engine_load, engine_map_load, engine_loop } from "/engine/engine.js";

const me_res = await fetch("/api/me");
const me = await me_res.json();

engine_load(me.username);
await engine_map_load(1);
engine_loop();
