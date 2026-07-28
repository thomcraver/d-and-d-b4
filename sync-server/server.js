// Minimal live-sync relay for the B3 map reveal tool.
//
// Every device (DM console or player view) opens one WebSocket connection
// to this server. Whenever the DM console changes state (reveals a room,
// switches maps, etc.) it sends the full state here; the server stores it
// and rebroadcasts it to every other connected device immediately. New
// connections get the current state as soon as they connect, so a phone
// joining mid-session catches up instantly instead of starting blank.
//
// This process needs to stay running (e.g. under pm2 or a systemd unit) -
// see README.md in this folder for how to start/keep it alive.

const { WebSocketServer } = require("ws");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8181;
const STATE_FILE = path.join(__dirname, "state.json");

let latestState = null;
try {
  latestState = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  console.log("Loaded persisted state from", STATE_FILE);
} catch (e) {
  console.log("No persisted state found, starting empty.");
}

const wss = new WebSocketServer({ port: PORT });
console.log(`B3 map sync server listening on ws://0.0.0.0:${PORT}`);

function broadcast(data, exceptClient) {
  const msg = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client !== exceptClient && client.readyState === client.OPEN) {
      client.send(msg);
    }
  }
}

wss.on("connection", (ws) => {
  console.log(`Client connected (${wss.clients.size} total)`);

  if (latestState) {
    ws.send(JSON.stringify({ type: "state", state: latestState }));
  }

  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (e) {
      return;
    }
    if (msg.type === "state" && msg.state) {
      latestState = msg.state;
      fs.writeFile(STATE_FILE, JSON.stringify(latestState), () => {});
      broadcast({ type: "state", state: latestState }, ws);
    }
  });

  ws.on("close", () => {
    console.log(`Client disconnected (${wss.clients.size} total)`);
  });
});

// Drop dead connections (e.g. phones that lost network without closing cleanly).
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);

wss.on("close", () => clearInterval(heartbeat));
