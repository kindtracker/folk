import { engine_load, engine_map_load, engine_loop } from "./engine.js";

engine_load();
await engine_map_load(1);
engine_loop();
