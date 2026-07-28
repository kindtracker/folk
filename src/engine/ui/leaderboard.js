import { canvas, ctx } from "/engine/ui/ui.js";
import { width, height, player, players } from "/engine/folk-engine.js";
import { me } from "/main.js";

export let lb_width = 60*3;
export let lb_height = 60*6;

export function lb_init() {
  console.log("[folk] loading: leaderboard");
}

export function lb_draw() {
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
    ctx.fillText(_player.name, width - lb_width + 30, y)
    y += 24;
  }
}
