import { canvas, ctx } from "/engine/ui/ui.js";
import { width, height, player, players } from "/engine/folk-engine.js";
import { me } from "/main.js";

let lb_width = 80*2;
let lb_height = 60*6;

export function lb_init() {
  console.log("[folk] loading: lb");
}

export function lb_draw() {
  ctx.fillStyle = "#80808080";
  ctx.beginPath();
  ctx.rect(width - lb_width - 10, 50, lb_width, lb_height);
  ctx.fill();

  const all_players = [player, ...players];
  all_players.sort((a, b) => a.name.localeCompare(b.name));

  ctx.fillStyle = "white";
  ctx.font = '500 24px "Montserrat", system-ui, -apple-system, sans-serif';
  let y = 65;
  ctx.fillText("Players", width - lb_width + ctx.measureText("Players").width/2-15, y+5)
  y += 34;
  for (const _player of all_players) {
    if (_player == player) {
      ctx.fillStyle = "#2e2eff";
    } else {
      ctx.fillStyle = "white";
    }
    ctx.fillText(_player.name, width - lb_width-10, y)
    y += 24;
  }
}
