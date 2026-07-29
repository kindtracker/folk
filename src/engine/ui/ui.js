import { chat_init, chat_draw, chat_toggle, chat_input, mchat_toggle } from "/engine/ui/chat.js";
import { lb_init, lb_draw, lb_width } from "/engine/ui/leaderboard.js";
import { f2_init, f2_draw } from "/engine/ui/f2.js";
import { width, height, engine_logs } from "/engine/folk-engine.js";
import { me, loaded } from "/client/main.js";

export let canvas = null;
export let ctx = null;

export let logo = null;
export let icon = null;
export let chat_icon = null;
export let chat2_icon = null;

let logs_scroll = 0;

function ui_loading_draw() {
  ctx.fillStyle = "#ffffff60";
  ctx.beginPath();
  ctx.rect(width/2-80*4, height/2-60*2, 80*8, 60*4);
  ctx.fill();

  ctx.strokeStyle = "#ffffff60";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.rect(width/2-80*4, height/2-60*2, 80*8, 60*4);
  ctx.stroke();

  ctx.font = '400 40px "Montserrat", system-ui, -apple-system, sans-serif';
  const text_size = ctx.measureText("Loading engine");
  ctx.fillStyle = "white";
  ctx.fillText("Loading engine", width/2-text_size.width/2, height/2+10);
}

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

  console.log("[folk] loading: chat icon (image)");
  chat_icon = new Image();
  chat_icon.src = "/api/images/chat.png";

  console.log("[folk] loading: chat2 icon (image)");
  chat2_icon = new Image();
  chat2_icon.src = "/api/images/chat2.png";

  console.log("[folk] loading: event listeners (ui)");
  window.addEventListener("resize", () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  });

  canvas.addEventListener("click", (e) => {
    const x = e.clientX;
    const y = e.clientY;
    if (x >= 40 && x <= 40+30 && y >= 0 && y <= 30) {
      mchat_toggle(!chat_toggle);  
      if (chat_toggle) {
        chat_input.focus();
      }
    }
  });

  ui_loading_draw();

  chat_init();
  lb_init();
  f2_init();
}

export function ui_draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  chat_draw();
  lb_draw();
  f2_draw();

  ctx.fillStyle = "#20202080";
  ctx.beginPath();
  ctx.rect(0, 0, width, 30);
  ctx.fill();

  ctx.drawImage(icon, 0, 0, 30, 30);
  ctx.drawImage(chat_icon, 40, 3, 25, 25);

  ctx.font = '500 17px "Montserrat", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = "#ffffffff";
  ctx.fillText(me.username, width - lb_width + 10, 18);
  ctx.font = '400 9px "Montserrat", system-ui, -apple-system, sans-serif';
  ctx.fillText("Volts: 0", width - lb_width + 10, 28);

  chat_draw();
}

export function ui_logs_draw() {
  if (!ctx) return;
  if (loaded) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ui_loading_draw();
  ctx.font = '400 14px "Montserrat", system-ui, -apple-system, sans-serif';
  let y = 14;
  for (const log of engine_logs) {
    if (y-logs_scroll > height) {
      logs_scroll += 14;
    }
    if (log.type == "log") {
      ctx.fillStyle = "green";
    } else if (log.type == "warn") {
      ctx.fillStyle = "yellow";
    } else if (log.type == "error") {
      ctx.fillStyle = "red";
    }

    ctx.fillText(log.message, 0, y-logs_scroll);
    y += 14;
  }
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
