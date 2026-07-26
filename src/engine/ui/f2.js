import { canvas, ctx, wrap_text } from "/engine/ui/ui.js";
import { width, height, f2_toggle } from "/engine/folk-engine.js";

let fps_graph = []

export function f2_init() {
  console.log("[folk] loading: f2 debugger");
}

export function f2_draw() {
  if (!f2_toggle) return;
  ctx.beginPath();
  ctx.fillStyle = "#000000c0";
  ctx.rect(0, height - 52.5, width, 52.5);
  ctx.fill();

  for (let i = 0; i < fps_graph.length; i++) {
    ctx.strokeStyle = `hsl(${Math.min(fps_graph[i] * 2, 320)}, 100%, 50%)`;
    ctx.beginPath();
    ctx.moveTo(i, height);
    ctx.lineTo(i, height - (52.5-Math.max(52.5 - fps_graph[i] / 3, 0)));
    ctx.stroke();
  }
}

export function f2_get(dt) {
  fps_graph.push(1/dt);
  if (fps_graph.length > width) {
    fps_graph.shift();
  }
}

export function f2_reset() {
  fps_graph = [];
}
