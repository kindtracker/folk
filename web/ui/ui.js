import { chat_draw } from "/ui/chat.js";
import { width, height } from "/engine/engine.js";

export let canvas = null;
export let ctx = null;
export let menu_toggle = false;
let chat_toggle = true;
let old_chat_toggle = false;

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
        console.log(old_chat_toggle)
        chat_toggle = old_chat_toggle;
      } else {
        old_chat_toggle = chat_toggle;
        chat_toggle = false;
      }
    }
    if (x >= 8+45 && x <= 48+45 && y >= 8 && y <= 48) {
      chat_toggle = !chat_toggle;  
    }
  });
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

  if (chat_toggle) {
    let right = (width/14)*3;
    let bottom = (height/9)*3;
    ctx.beginPath();
    ctx.roundRect(10, 55, right, bottom, [4, 4, 4, 4]);
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(17, bottom+20, right-14, 24, [4, 4, 4, 4]);
    ctx.fill();
  }

  if (menu_toggle) {
    ctx.fillStyle = "#00000080";
    ctx.beginPath();
    ctx.roundRect(width/5, height/10, width/5*3, height/6*5, 50, [4, 4, 4, 4]);
    ctx.fill();

    ctx.drawImage(logo, width/5+width/6.5, height/9, width/7*2, height/6);
  }
}
