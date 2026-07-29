import { WebSocketServer } from "ws";

const port = process.argv[2] ? process.argv[2] : 6977;
const wss = new WebSocketServer({ port: port });
console.log("[folk] game server listening: http://127.0.0.1:" + port.toString());

let players = {}
let new_chat_queue = [];
let connection_id = 1;
wss.on("connection", (ws, req) => {
  let client = {username: "unknown", id: 0, join: false, pos: [0,0,0], yaw: 0, on_ground: 0, walking: 0, climbing: false, hp: 100, avatar: {}, connection_id}
  console.log("[folk] game: client connected: " + req.socket.remoteAddress);

  players[connection_id] = client;
  connection_id++;
  ws.on("message", (message) => {
    message = JSON.parse(message.toString());
    
    if (!client.join && message.type != "join") {
      const message = "Please join the server";
      ws.send(JSON.stringify({type: "error", message, code: 1}));
      return;
    }

    if (message.type == "join") {
      if (client.join) {
        const message = "You already joined to the server";
        ws.send(JSON.stringify({type: "error", message, code: 2}));
        return;
      }
      client.username = message.username;
      client.id = message.id;
      client.join = true;
    } else if (message.type == "player") {
      client.pos = message.pos;
      client.yaw = message.yaw;
      client.hp = message.hp;
      client.walking = message.walking;
      client.climbing = message.climbing;
      client.on_ground = message.on_ground;
      client.avatar = message.avatar;
    } else if (message.type == "chat") {
      new_chat_queue.push({id: client.id, username: client.username, message: message.message});
    }
  });

  ws.on("close", () => {
    console.log("[folk] game: client disconnected: " + client.username);
    delete players[client.connection_id];
  });

  ws.on("error", (err) => {
    console.error(`[folk] game: ${err.message}`);
  });
});

setInterval(() => {
  const upd_json = JSON.stringify({
    type: "update",
    players: Object.values(players)
  });
  const chat_msg = new_chat_queue.shift();

  for (const ws of wss.clients) {
    if (ws.readyState != ws.OPEN) continue;
    ws.send(upd_json);
    if (!chat_msg) continue;
    ws.send(JSON.stringify({type: "chat", ...chat_msg}));
  }
}, 1000 / 24);
