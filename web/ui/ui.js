import { chat_init, chat_draw, chat_toggle, chat_old_toggle } from "/ui/chat.js";
import { width, height } from "/engine/engine.js";

export let canvas = null;
export let ctx = null;
export let menu_toggle = false;

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

  console.log("[folk] loading: images");
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
    if (x >= 8 && x <= 48 && y >= 8 && y <= 48) {
      menu_toggle = !menu_toggle;
      if (menu_toggle == false) {
        chat_toggle = chat_old_toggle;
      } else {
        chat_old_toggle = chat_toggle;
        chat_toggle = false;
      }
    }
    if (x >= 8+45 && x <= 48+45 && y >= 8 && y <= 48) {
      chat_toggle = !chat_toggle;  
      if (chat_toggle) {
          chat_input.focus();
      }
    }
  });

  chat_init();
}

export function ui_draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  chat_draw();

  ctx.fillStyle = "#00000064";
  ctx.beginPath();
  ctx.arc(28, 28, 20, 0, 2 * Math.PI);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(28 + 45, 28, 20, 0, 2 * Math.PI);
  ctx.fill();

  ctx.drawImage(icon, 15, 16, 26, 26);

  chat_draw();

  if (menu_toggle) {
    ctx.fillStyle = "#00000080";
    ctx.beginPath();
    ctx.roundRect(width/5, height/10, width/5*3, height/6*5, 50, [4, 4, 4, 4]);
    ctx.fill();

    ctx.drawImage(logo, width/5+width/6.5, height/9, width/7*2, height/6);
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
