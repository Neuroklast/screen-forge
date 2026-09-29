import http from "node:http";

const port = Number(process.env.EXERCISE_PORT || 8787);

function createRoom(room = "default") {
  return {
    room,
    frozen: false,
    clock: 0,
    stations: [
      { id: "med-1", name: "Casualty monitor", role: "element", scene: "medical" },
      { id: "cam-1", name: "Optics", role: "element", scene: "camera" },
      { id: "radio-1", name: "Relay", role: "element", scene: "comms" },
      { id: "files-1", name: "SSE terminal", role: "element", scene: "terminal" },
      { id: "hq", name: "HQ", role: "hq", scene: "tracking" },
    ],
    bindings: [
      { from: "casualty:alpha", to: "station:med-1" },
      { from: "webcam:0", to: "station:cam-1" },
    ],
    patient: { id: "alpha", name: "UNKNOWN / FIELD", kind: "stable", since: 0 },
    cameras: [],
  };
}

function applyExercise(state, msg) {
  if (msg.type === "inject") {
    if (msg.kind === "freeze") return { ...state, frozen: true };
    if (msg.kind === "play") return { ...state, frozen: false };
    return {
      ...state,
      patient: { ...state.patient, kind: msg.kind, since: state.clock },
    };
  }
  if (msg.type === "join") {
    return {
      ...state,
      stations: [
        ...state.stations.filter((s) => s.id !== msg.station.id),
        msg.station,
      ],
    };
  }
  if (msg.type === "bind") {
    return {
      ...state,
      bindings: [
        ...state.bindings.filter(
          (b) => !(b.from === msg.from && b.to === msg.to),
        ),
        { from: msg.from, to: msg.to },
      ],
    };
  }
  if (msg.type === "clock") return { ...state, clock: msg.clock };
  return state;
}

const rooms = new Map();
const sockets = new Map();
function roomOf(id) {
  if (!rooms.has(id)) rooms.set(id, createRoom(id));
  return rooms.get(id);
}
function send(ws, msg) {
  try {
    ws.send(JSON.stringify(msg));
  } catch {
    /* closed */
  }
}
function broadcast(room, msg) {
  for (const [ws, meta] of sockets) if (meta.room === room) send(ws, msg);
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
    return;
  }
  res.writeHead(404);
  res.end();
});

let wss;
try {
  const { WebSocketServer } = await import("ws");
  wss = new WebSocketServer({ server });
} catch {
  console.error("Install ws: npm i ws");
  process.exit(1);
}

wss.on("connection", (ws) => {
  sockets.set(ws, { room: "default", role: "element", station: "" });
  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }
    const meta = sockets.get(ws);
    if (msg.type === "hello") {
      meta.room = String(msg.room || "default").slice(0, 40);
      meta.role = String(msg.role || "element");
      meta.station = String(msg.station || "").slice(0, 40);
      send(ws, { type: "state", state: roomOf(meta.room) });
      return;
    }
    const state = applyExercise(roomOf(meta.room), msg);
    rooms.set(meta.room, state);
    broadcast(meta.room, { type: "state", state });
  });
  ws.on("close", () => sockets.delete(ws));
});

server.listen(port, "0.0.0.0", () => {
  console.log(`exercise server ws://0.0.0.0:${port}`);
});
