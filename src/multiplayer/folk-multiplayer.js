import { camera_yaw, player_yaw, player, players, scene, shift_lock } from "/engine/folk-engine.js";
import { player_init, player_avatar_load, player_animate } from "/engine/player.js";
import { chat_message } from "/engine/ui/chat.js";
import { me } from "/client/main.js";

let ws = null;

export function multiplayer_init(url, port = 6977) {
  console.log("[folk] loading: multiplayer");
  console.log(`[folk] connecting: ws://${url}:${port}`);
  ws = new WebSocket(`ws://${url}:${port}`);

  ws.onopen = () => {
    console.log("[folk] connected to the server");
    ws.send(JSON.stringify({
      type: "join",
      username: me.username,
      id: me.id
    }));
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type == "update") {
      for (const oplayer of message.players) {
        if (oplayer.id == player.id) {
          continue;
        }

        let woplayer = players[oplayer.username];
        if (!woplayer) {
          if (!oplayer.avatar || Object.keys(oplayer.avatar).length == 0) {
            continue;
          }
          woplayer = player_init(oplayer.username, oplayer.id, oplayer.avatar)
          players[oplayer.username] = woplayer;
          scene.add(woplayer.model);
        }
        woplayer.model.position.set(oplayer.pos[0], oplayer.pos[1], oplayer.pos[2]);
        woplayer.model.rotation.set(0, oplayer.yaw, 0);
        woplayer.on_ground = oplayer.on_ground;
        woplayer.climbing = oplayer.climbing;
        woplayer.walking = oplayer.walking;
        woplayer.hp = oplayer.hp;
        player_animate(woplayer, player.id);
      }
    } else if (message.type == "chat") {
      if (message.id != player.id) {
        chat_message(message.username, message.message);
      }
    }
  };

  ws.onclose = () => {
    console.log("[folk] server disconnected");
  };

  ws.onerror = (err) => {
    console.error(`[folk] ${err.message}`);
  };
}

export function multiplayer_tick() {
  ws.send(JSON.stringify({
    type: "player",
    pos: [
      player.body.position.x,
      player.body.position.y,
      player.body.position.z
    ],
    yaw: shift_lock ? camera_yaw : player_yaw,
    hp: player.health,
    walking: player.walking,
    climbing: player.climbing,
    on_ground: player.on_ground,
    avatar: player.avatar
  }));
}

export function multiplayer_chat(username, message) {
  ws.send(JSON.stringify({
    type: "chat",
    message: message
  }));
}
