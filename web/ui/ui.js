import { chat_draw } from "/ui/chat.js";

export let canvas = null;
export let ctx = null;
export let username = "unknown";

export let logo = new Image();

export function ui_load(usern) {
  console.log("[folk] loading: ui");
  username = usern;
  console.log("[folk] loading: canvas");
  canvas = document.createElement("canvas");
  canvas.id = "ui";
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.zIndex = "1000";
  canvas.style.pointerEvents = "none";
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");

  console.log("[folk] loading: images");
  console.log("[folk] loading: vortex logo (image)");
  logo.src = "/api/images/logo.png";

  console.log("[folk] loading: event listeners (ui)");
  window.addEventListener("resize", () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  });
}

export function ui_draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  chat_draw(username);

  ctx.fillStyle = "#00000064";
  ctx.beginPath();
  ctx.arc(20, 25 + 0.75, 16, 0, 2 * Math.PI);
  ctx.rect(20, 10, 27.5, 24 + 4*2);
  ctx.arc(47.5, 25 + 0.75, 16, 0, 2 * Math.PI);
  ctx.fill();

  ctx.font = '600 20px "Montserrat", system-ui, -apple-system, sans-serif';
  ctx.textAlign = "left";
  ctx.fillStyle = "rgb(0, 204, 102)";
  ctx.fillText("Folk", 14, 10 + 24);
}
