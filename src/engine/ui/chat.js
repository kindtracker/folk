import { canvas, ctx, wrap_text } from "/engine/ui/ui.js";
import { width, height } from "/engine/folk-engine.js";
import { me } from "/main.js";

export let chat = {messages: [], scroll: 0};
export let chat_input = null;
export let chat_toggle = true;
export let chat_old_toggle = false;
export let chat_width = 80*4;
export let chat_height = 60*4;

export let ucolors = [
  "#fd2943",
  "#01a2ff",
  "#02b857",
  "#7c5cff",
  "#ff7f00",
  "#ffd500",
  "#ff98dc",
  "#d7c06a"
];

export function chat_init() {
  console.log("[folk] loading: chat");
  chat_input = document.createElement("input");
  chat_input.type = "text";
  chat_input.placeholder = "Type a message...";
  chat_input.style.borderRadius = "4px";
  chat_input.style.position = "fixed";
  chat_input.style.zIndex = "1001";
  chat_input.style.display = "none";
  chat_input.style.background = "#00000040";
  chat_input.style.outline = "none";
  chat_input.style.color = "white";
  chat_input.style.font = '400 14px "Montserrat", system-ui, -apple-system, sans-serif';
  chat_input.style.padding = "4px";
  chat_input.style.left = "17px";
  chat_input.style.top = `${chat_height + 14}px`;
  chat_input.style.width = `${chat_width - 22}px`;
  chat_input.style.height = "24px";
  document.body.appendChild(chat_input);

  console.log("[folk] loading: event listeners (chat)");
  chat_input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const text = chat_input.value.trim();

      if (text) {
        chat_message(me.username, chat_input.value.trim());
        chat_input.value = "";
      }
      chat_input.blur();
    }
  });
}

export function chat_message(username, text) {
  chat.messages.push({
    username,
    text,
    time: Date.now()
  });

  if (chat.messages.length > 50) {
    chat.messages.shift();
  }
  chat.scroll = Math.max(0, chat_get_height() - chat_height + 50);
}

export function chat_get_ucolor(username) {
  let value = 0;
  for (let i = 0; i < name.length; i++) {
    let chr = name.charCodeAt(i);
    let reverse_idx = name.length - i;
    if (name.length & 1) reverse_idx--;
    if (reverse_idx % 4 >= 2) chr = -cht;
    value += chr;
  }
  return ucolors[((value % ucolors.length) + ucolors.length) % ucolors.length];
}

export function chat_draw() {
  if (!chat_toggle) {
    chat_input.style.display = "none";
    return;
  }

  ctx.fillStyle = "#00000064";
  ctx.beginPath();
  ctx.roundRect(10, 55, chat_width, chat_height, [4, 4, 4, 4]);
  ctx.fill();
  chat_input.style.display = "block";

  ctx.fillStyle = "white";
  ctx.font = '400 14px "Montserrat", system-ui, -apple-system, sans-serif';
  let y = 75;
  for (const msg of chat.messages) {
    const p = `[${msg.username}] ${msg.text}`;
    const lines = wrap_text(msg.text, chat_width - 18);

    for (const line of lines) {
      if (y-chat.scroll >= 50) {
        const prefix = `[${msg.username}]: `;
        const color = chat_get_ucolor(msg.username);
        ctx.fillStyle = color;
        ctx.fillText(prefix, 18, y - chat.scroll);

        const x = ctx.measureText(prefix).width;
        ctx.fillStyle = "white";
        ctx.fillText(line, 18+x, y-chat.scroll);
      }
      y += 18;
    }
    y += 4; 
  }
}

function chat_get_height() {
  let height = 0;

  for (const msg of chat.messages) {
    const lines = wrap_text(msg.text, chat_width - 18);
    height += lines.length * 18 + 4;
  }

  return height;
}

export function mchat_toggle(value) {
  chat_toggle = value;
}

export function mchat_old_toggle(value) {
  chat_old_toggle = value;
}
