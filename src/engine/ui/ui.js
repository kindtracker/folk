import { chat_init, chat_draw, chat_toggle, chat_input, mchat_toggle } from "/engine/ui/chat.js";
import { lb_init, lb_draw } from "/engine/ui/leaderboard.js";
import { f2_init, f2_draw } from "/engine/ui/f2.js";
import { width, height } from "/engine/folk-engine.js";

export let canvas = null;
export let ctx = null;

export let logo = null;
export let icon = null;

export function ui_load() {
  console.log("[folk] loading: ui");
  console.log("[folk] loading: canvas");
  canvas = document.createElement("canvas");
  canvas.id = "ui";
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.zIndex = "1000";
  canvas.style.pointerEvents = "auto";
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");

  console.log("[folk] loading: images (ui)");
  console.log("[folk] loading: folk logo (image)");
  logo = new Image();
  logo.src = "/api/images/logo.png";
  console.log("[folk] loading: folk icon (image)");
  icon = new Image();
  icon.src = "/api/images/icon.png";

  console.log("[folk] loading: event listeners (ui)");
  window.addEventListener("resize", () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  });

  canvas.addEventListener("click", (e) => {
    const x = e.clientX;
    const y = e.clientY;
    if (x >= 120 && x <= 120+40 && y >= 0 && y <= 40) {
      mchat_toggle(!chat_toggle);  
      if (chat_toggle) {
        chat_input.focus();
      }
    }
  });

  chat_init();
  lb_init();
  f2_init();
}

export function ui_draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  chat_draw();
  lb_draw();
  f2_draw();

  ctx.fillStyle = "#40404080";
  ctx.beginPath();
  ctx.rect(0, 0, width, 40);
  ctx.fill();

  ctx.drawImage(logo, 0, 0, 120, 40);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(120 + 5, 10);
  ctx.lineTo(120 + 40 - 5, 10);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(120 + 5, 20);
  ctx.lineTo(120 + 40 - 5, 20);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(120 + 5, 30);
  ctx.lineTo(120 + 40 - 5, 30);
  ctx.stroke();

  chat_draw();
}

export function wrap_text(text, maxWidth) {
  const lines = [];
  let line = "";

  for (const ch of text) {
    if (ch === "\n") {
      lines.push(line);
      line = "";
      continue;
    }
    const test = line + ch;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = ch;
    }
  }
  if (line) {
    lines.push(line);
  }
  return lines;
}
