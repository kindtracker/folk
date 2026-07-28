import { canvas, ctx } from "/engine/ui/ui.js";
import { width, height, player } from "/engine/folk-engine.js";
import { me } from "/main.js";

export function hp_bar_init() {
  console.log("[folk] loading: health bar");
}

export function hp_bar_draw() {
  ctx.fillStyle = "blue";
  ctx.font = '500 20px "Montserrat", system-ui, -apple-system, sans-serif';
  ctx.fillText("Health", width-80, height-20);

  const text_c = ctx.measureText("Health").width/2
  const red = 255 - (player.hp * 2.55);
  const green = player.hp * 2.55;
  ctx.lineWidth = 10;
  ctx.strokeStyle = `rgb(${red}, ${green}, 0)`;
  ctx.moveTo(width-80+text_c, height-40);
  ctx.lineTo(width-80+text_c, height-40-player.hp);
  ctx.stroke();
}
