import http from "node:http";
import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import { appendFileSync, writeFileSync } from "node:fs";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve, extname, sep } from "node:path";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import {
  moduleEvents,
  scenarioSchema,
  patientSchema,
  actionSchema,
  newState,
  advance,
  act,
  evaluate,
  interactionEvents,
  projectState,
  logEvent,
  setProp,
  workflowPropEvents,
  workflowStartEvents,
  workflowStartsForProp,
  workflowTick,
} from "../src/core/training.ts";
import { PROTOCOL } from "../src/core/protocol.ts";
import { applyEvent, domainEventSchema } from "../src/core/events.ts";
import { lintMission } from "../src/core/missionLint.ts";

const hash = (value) =>
  createHash("sha256").update(String(value)).digest("hex");
const equal = (a, b) =>
  timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)));
const token = () => randomBytes(32).toString("base64url");
const ident = z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/);
const position = z.object({
  lat: z.number().min(-85).max(85),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(10000),
  timestamp: z.number().finite(),
});
const hello = z.object({
  type: z.literal("hello"),
  room: ident,
  role: z.enum(["trainer", "hq", "element", "safety", "assessor"]),
  station: z.string().max(40),
  token: z.string().min(1).max(300),
  invite: z.boolean().optional(),
  protocol: z.number().int().min(1).max(99).optional(),
  lastServerSeq: z.number().int().min(0).optional(),
});

export async function startExercise({
  port = Number(process.env.EXERCISE_PORT || 8787),
  host = process.env.EXERCISE_HOST || "0.0.0.0",
  secret = process.env.EXERCISE_ADMIN_KEY || token(),
  dataDir = process.env.EXERCISE_DATA_DIR || ".exercise-data",
  dist = resolve("dist"),
} = {}) {
  const rooms = new Map(),
    baseline = new Map(),
    credentials = new Map(),
    invites = new Map(),
    sockets = new Map(),
    roomSeq = new Map(),
    roomDedup = new Map(),
    roomLog = new Map(),
    clockRevision = new Map();
  let dirty = false,
    writing = Promise.resolve();
  const bumpClock = (room) => {
    clockRevision.set(room, (clockRevision.get(room) || 0) + 1);
  };
  const nextSeq = (room) => {
    const value = (roomSeq.get(room) || 0) + 1;
    roomSeq.set(room, value);
    return value;
  };
  const rememberCommand = (room, eventId, serverSeq) => {
    if (!eventId) return;
    let map = roomDedup.get(room);
    if (!map) {
      map = new Map();
      roomDedup.set(room, map);
    }
    map.set(eventId, { serverSeq });
    while (map.size > 500) map.delete(map.keys().next().value);
  };
  const snapshotDir = resolve(dataDir, "snapshots"),
    journalDir = resolve(dataDir, "journal");
  const snapshotPath = (room) => resolve(snapshotDir, `${room}.json`);
  const journalPath = (room) => resolve(journalDir, `${room}.jsonl`);
  const writeSnapshotFor = async (room) => {
    const state = rooms.get(room);
    if (!state) return;
    const payload = JSON.stringify({
      serverSeq: roomSeq.get(room) || 0,
      baseline: baseline.get(room),
      state,
    });
    const path = snapshotPath(room);
    await writeFile(`${path}.tmp`, payload, { mode: 0o600 });
    await rename(`${path}.tmp`, path);
  };
  const rememberEvent = (room, serverSeq, event) => {
    const log = roomLog.get(room) || [];
    log.push({ serverSeq, event });
    while (log.length > 500) log.shift();
    roomLog.set(room, log);
  };
  const appendEvent = (room, actor, event) => {
    const serverSeq = nextSeq(room);
    appendFileSync(
      journalPath(room),
      JSON.stringify({ serverSeq, wallAt: Date.now(), actor, event }) + "\n",
    );
    applyEvent(rooms.get(room), event);
    rememberEvent(room, serverSeq, event);
    if (event.type === "exercise.transport") bumpClock(room);
    return serverSeq;
  };
  const journalNewFired = (room, before) => {
    const state = rooms.get(room);
    if (!state) return;
    for (const id of state.fired)
      if (!before.has(id)) {
        const serverSeq = nextSeq(room);
        const event = { type: "inject.fired", inject: id };
        appendFileSync(
          journalPath(room),
          JSON.stringify({
            serverSeq,
            wallAt: Date.now(),
            actor: "engine",
            event,
          }) + "\n",
        );
        rememberEvent(room, serverSeq, event);
      }
  };
  // Prop changes can advance waiting workflow tasks and set further props;
  // bounded passes keep the journal ordered and stop runaway chains.
  const reactToPropChanges = (room, actor, before) => {
    const state = rooms.get(room);
    if (!state) return;
    for (let pass = 0; pass < 5; pass++) {
      const changed = Object.entries(state.propStates).filter(
        ([prop, value]) => before[prop] !== value,
      );
      if (!changed.length) return;
      for (const [prop, value] of changed) {
        before[prop] = value;
        for (const event of workflowPropEvents(
          state,
          prop,
          value,
          state.clock,
        ))
          appendEvent(room, actor, event);
      }
    }
  };
  const readJson = async (path) => {
    try {
      return JSON.parse(await readFile(path, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  };
  const readJournal = async (room) => {
    let text = "";
    try {
      text = await readFile(journalPath(room), "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const records = [];
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        records.push(JSON.parse(trimmed));
      } catch {
        console.error(`Skipping corrupt journal line for ${room}`);
      }
    }
    return records;
  };
  const replayRoom = (room, snapshot, records) => {
    let state = snapshot ? snapshot.state : newState(room);
    let base = snapshot ? snapshot.baseline : structuredClone(state.scenario);
    let seq = snapshot ? snapshot.serverSeq || 0 : 0;
    for (const rec of records) {
      if (snapshot && rec.serverSeq <= seq) {
        seq = Math.max(seq, rec.serverSeq);
        continue;
      }
      const event = (() => {
        try {
          return domainEventSchema.parse(rec.event);
        } catch {
          console.error(`Skipping invalid event for ${room}`);
          return null;
        }
      })();
      if (!event) continue;
      if (event.type === "scenario.saved") {
        base = event.scenario;
        applyEvent(state, event);
      } else if (event.type === "exercise.reset") {
        const next = newState(room, structuredClone(base));
        next.revision = state.revision + 1;
        next.presence = state.presence;
        state = next;
      } else {
        applyEvent(state, event);
      }
      seq = Math.max(seq, rec.serverSeq);
    }
    state.scenario = scenarioSchema.parse(state.scenario);
    state.frozen = true;
    state.presence = {};
    rooms.set(room, state);
    baseline.set(room, scenarioSchema.parse(base));
    roomSeq.set(room, seq);
  };
  await mkdir(dataDir, { recursive: true, mode: 0o700 });
  await mkdir(snapshotDir, { recursive: true, mode: 0o700 });
  await mkdir(journalDir, { recursive: true, mode: 0o700 });
  try {
    const saved = await readJson(resolve(dataDir, "rooms.json"));
    const roomNames = new Set();
    for (const [key] of saved?.rooms ?? []) roomNames.add(key);
    for (const [key] of saved?.baseline ?? []) roomNames.add(key);
    for (const name of roomNames) {
      const snapshot = await readJson(snapshotPath(name));
      const records = await readJournal(name);
      replayRoom(name, snapshot, records);
      await writeSnapshotFor(name);
      writeFileSync(journalPath(name), "");
    }
    for (const [key, value] of saved?.credentials ?? [])
      if (value.expires > Date.now()) credentials.set(key, value);
  } catch (error) {
    if (error.code !== "ENOENT")
      throw new Error("Cannot load exercise data; refusing to overwrite it", {
        cause: error,
      });
  }
  const persist = () => {
    if (!dirty) return writing;
    dirty = false;
    const json = JSON.stringify({
      rooms: [...rooms],
      baseline: [...baseline],
      credentials: [...credentials],
    });
    writing = writing
      .then(async () => {
        const path = resolve(dataDir, "rooms.json");
        await writeFile(`${path}.tmp`, json, { mode: 0o600 });
        await rename(`${path}.tmp`, path);
      })
      .catch((error) => {
        dirty = true;
        console.error("Exercise save failed:", error.message);
      });
    return writing;
  };
  const send = (ws, msg) => {
    if (ws.readyState === WebSocket.OPEN && ws.bufferedAmount < 16000000)
      ws.send(JSON.stringify(msg));
  };
  const broadcast = (room, clockOnly = false) => {
    const state = rooms.get(room);
    for (const [ws, meta] of sockets)
      if (meta.room === room) {
        if (meta.skipState) {
          meta.skipState = false;
          continue;
        }
        if (!clockOnly) {
          send(ws, {
            type: "state",
            state: projectState(state, meta.role, meta.station),
          });
          continue;
        }
        const station = state.scenario.stations.find(
          (s) => s.id === meta.station,
        );
        const positions =
          meta.role !== "element"
            ? state.positions
            : Object.fromEntries(
                Object.entries(state.positions).filter(([id]) =>
                  state.scenario.stations.some(
                    (s) =>
                      s.id === id &&
                      (id === meta.station ||
                        (s.player && s.team === station?.team)),
                  ),
                ),
              );
        send(ws, {
          type: "tick",
          clock: state.clock,
          frozen: state.frozen,
          positions,
          serverNow: Date.now(),
          clockRevision: clockRevision.get(room) || 0,
        });
      }
  };
  const disconnectStation = (room, station) => {
    for (const [ws, meta] of sockets)
      if (
        meta.room === room &&
        meta.station === station &&
        meta.role !== "trainer"
      )
        ws.close(4001, "Device assignment replaced");
  };
  const revoke = (room, station) => {
    for (const [key, value] of credentials)
      if (value.room === room && value.station === station)
        credentials.delete(key);
    for (const [key, value] of invites)
      if (value.room === room && value.station === station) invites.delete(key);
    disconnectStation(room, station);
    dirty = true;
  };
  // Build identity of the served artifact. Missing file means an unbundled or
  // pre-identity build; clients treat that as compatible and never block on it.
  let build = null;
  try {
    build = JSON.parse(await readFile(resolve(dist, "build.json"), "utf8"));
  } catch {
    /* no build.json */
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    if (req.url === "/health") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("ok");
      return;
    }
    if (req.url === "/version") {
      res.writeHead(200, {
        "content-type": "application/json",
        "cache-control": "no-store",
      });
      res.end(
        JSON.stringify({
          build: build?.id ?? null,
          commit: build?.commit ?? null,
          builtAt: build?.builtAt ?? null,
          version: build?.version ?? null,
          protocol: PROTOCOL,
        }),
      );
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end();
      return;
    }
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const path = resolve(
        dist,
        `.${pathname === "/" ? "/index.html" : pathname}`,
      );
      if (!path.startsWith(dist + sep)) throw new Error("Invalid path");
      const body = await readFile(path);
      const mime =
        {
          ".html": "text/html",
          ".js": "text/javascript",
          ".css": "text/css",
          ".json": "application/json",
          ".webmanifest": "application/manifest+json",
          ".svg": "image/svg+xml",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".woff2": "font/woff2",
          ".ttf": "font/ttf",
        }[extname(path)] || "application/octet-stream";
      res.writeHead(200, {
        "content-type": mime,
        "cache-control":
          extname(path) === ".html" || path.endsWith("sw.js")
            ? "no-cache"
            : "public, max-age=3600",
      });
      res.end(req.method === "HEAD" ? undefined : body);
    } catch {
      res.writeHead(404);
      res.end("Build ScreenForge first: npm run build");
    }
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: 14000000 });
  server.on("upgrade", (req, socket, head) => {
    // Same-origin deployment; explicit allowlist for a separate frontend if required.
    let allowed = false;
    try {
      const origin = new URL(req.headers.origin);
      allowed =
        origin.host === req.headers.host ||
        (process.env.EXERCISE_ORIGINS || "").split(",").includes(origin.origin);
    } catch {
      /* no origin */
    }
    if (!allowed || req.url !== "/exercise") {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws));
  });
  wss.on("connection", (ws) => {
    const timeout = setTimeout(
      () => ws.close(4003, "Authentication required"),
      10000,
    );
    let alive = true,
      windowStart = Date.now(),
      messages = 0;
    ws.on("pong", () => {
      alive = true;
    });
    const heartbeat = setInterval(() => {
      if (!alive) return ws.terminate();
      alive = false;
      ws.ping();
    }, 15000);
    ws.on("error", () => {});
    ws.on("message", (raw) => {
      let msg;
      try {
        if (Date.now() - windowStart > 1000) {
          windowStart = Date.now();
          messages = 0;
        }
        if (++messages > 60) throw new Error("Too many requests");
        msg = JSON.parse(String(raw));
        let meta = sockets.get(ws);
        if (msg.type === "hello") {
          if (meta) throw new Error("Already authenticated");
          const auth = hello.parse(msg);
          if (auth.protocol !== undefined && auth.protocol !== PROTOCOL) {
            send(ws, { type: "error", message: "Protocol version mismatch" });
            ws.close(4003, "Protocol version mismatch");
            return;
          }
          if (["trainer", "safety", "assessor"].includes(auth.role)) {
            if (!equal(auth.token, secret)) {
              send(ws, { type: "error", message: "Trainer key rejected" });
              ws.close(4003);
              return;
            }
            if (auth.role === "trainer" && !rooms.has(auth.room)) {
              if (rooms.size >= 100) throw new Error("Room limit reached");
              const state = newState(auth.room);
              rooms.set(auth.room, state);
              baseline.set(auth.room, structuredClone(state.scenario));
              dirty = true;
            }
            if (!rooms.has(auth.room)) throw new Error("Unknown room");
            meta = {
              room: auth.room,
              role: auth.role,
              station: "",
              expires: Date.now() + 43200000,
            };
          } else {
            const collection = auth.invite ? invites : credentials,
              key = hash(auth.token),
              value = collection.get(key);
            if (
              !value ||
              value.expires < Date.now() ||
              value.room !== auth.room ||
              value.station !== auth.station ||
              value.role !== auth.role
            ) {
              send(ws, {
                type: "error",
                message:
                  "Assignment expired or revoked. Request a new QR code.",
              });
              ws.close(4003);
              return;
            }
            const state = rooms.get(value.room),
              st = state?.scenario.stations.find((s) => s.id === value.station);
            if (!st || st.role !== value.role)
              throw new Error("Station no longer exists");
            if (auth.invite) {
              collection.delete(key);
              revoke(value.room, value.station);
              const session = token();
              meta = { ...value, expires: Date.now() + 86400000 * 7 };
              credentials.set(hash(session), meta);
              send(ws, { type: "credential", token: session });
              dirty = true;
            } else meta = value;
            disconnectStation(meta.room, meta.station);
            state.presence[meta.station] = {
              online: true,
              lastSeen: Date.now(),
            };
          }
          clearTimeout(timeout);
          sockets.set(ws, meta);
          send(ws, {
            type: "ready",
            role: meta.role,
            station: meta.station,
            protocol: PROTOCOL,
            build: build?.id ?? null,
            serverSeq: roomSeq.get(meta.room) || 0,
            serverNow: Date.now(),
            clockRevision: clockRevision.get(meta.room) || 0,
          });
          const currentSeq = roomSeq.get(meta.room) || 0;
          if (
            ["trainer", "safety", "assessor"].includes(meta.role) &&
            typeof auth.lastServerSeq === "number" &&
            auth.lastServerSeq > 0 &&
            auth.lastServerSeq < currentSeq
          ) {
            const log = roomLog.get(meta.room) || [];
            const first = log.length ? log[0].serverSeq : Infinity;
            if (auth.lastServerSeq >= first - 1) {
              send(ws, { type: "resumed", serverSeq: currentSeq });
              send(ws, {
                type: "events",
                serverSeq: currentSeq,
                events: log
                  .filter((r) => r.serverSeq > auth.lastServerSeq)
                  .map((r) => r.event),
              });
              meta.skipState = true;
            }
          }
          broadcast(meta.room);
          return;
        }
        if (!meta) throw new Error("Authenticate first");
        if (meta.expires < Date.now()) {
          ws.close(4003, "Session expired");
          return;
        }
        const state = rooms.get(meta.room);
        const eventId =
          typeof msg.eventId === "string" && msg.eventId.length <= 80
            ? msg.eventId
            : "";
        if (eventId) {
          const cached = roomDedup.get(meta.room)?.get(eventId);
          if (cached) {
            send(ws, {
              type: "ack",
              command: msg.type,
              eventId,
              serverSeq: cached.serverSeq,
              result: "duplicate",
            });
            return;
          }
        }
        if (msg.type === "signal") {
          const st = state.scenario.stations.find((s) => s.id === meta.station);
          const target = [...sockets].find(
            ([other, m]) =>
              other !== ws && m.room === meta.room && m.station === msg.to,
          );
          const type = msg.data?.type;
          if (
            !target ||
            !["request", "offer", "answer", "ice", "stop"].includes(type) ||
            JSON.stringify(msg.data).length > 100000
          )
            return;
          const targetStation = state.scenario.stations.find(
            (s) => s.id === target[1].station,
          );
          const publishing = st?.module === "camera" && target[1].role === "hq";
          const viewing =
            meta.role === "hq" && targetStation?.module === "camera";
          if (
            !(publishing || viewing) ||
            state.cameraOffline[publishing ? meta.station : target[1].station]
          )
            throw new Error("Camera unavailable");
          send(target[0], {
            type: "signal",
            from: meta.station,
            data: msg.data,
          });
          return;
        }
        if (msg.type === "diagnostic" && meta.role === "element") {
          const st = state.scenario.stations.find((s) => s.id === meta.station);
          if (!st || !["countdown", "access", "lock"].includes(st.module))
            throw new Error("No diagnostics for this module");
          meta.inspected = true;
          send(ws, { type: "diagnostic", code: st.code, station: st.id });
          return;
        }
        if (msg.type === "gps" && meta.role === "element") {
          const st = state.scenario.stations.find((s) => s.id === meta.station);
          if (!st?.player || state.scenario.mode !== "LIVE")
            throw new Error("Tracking unavailable for this station");
          const samples = z
            .array(position)
            .min(1)
            .max(120)
            .parse(msg.samples)
            .sort((a, b) => a.timestamp - b.timestamp);
          for (const p of samples) {
            if (
              p.timestamp > Date.now() + 30000 ||
              p.timestamp < Date.now() - 3600000 ||
              p.timestamp <= (state.positions[meta.station]?.timestamp || 0)
            )
              continue;
            state.positions[meta.station] = { ...p, received: Date.now() };
          }
          const before = new Set(state.fired);
          evaluate(state, { type: "zone", station: meta.station });
          journalNewFired(meta.room, before);
          send(ws, { type: "gps-ack", timestamp: samples.at(-1).timestamp });
        } else if (msg.type === "module-event" && meta.role === "element") {
          const st = state.scenario.stations.find((s) => s.id === meta.station);
          if (
            state.frozen ||
            !(moduleEvents[st?.module] || []).includes(msg.value)
          )
            throw new Error("Module event not available");
          const before = new Set(state.fired);
          appendEvent(meta.room, meta.role, {
            type: "module.event",
            station: meta.station,
            value: msg.value,
          });
          evaluate(state, {
            type: "signal",
            station: meta.station,
            value: msg.value,
          });
          journalNewFired(meta.room, before);
        } else if (msg.type === "intervention" && meta.role === "element") {
          const st = state.scenario.stations.find((s) => s.id === meta.station);
          if (
            state.frozen ||
            st?.module !== "medical" ||
            !["treated", "tourniquet", "oxygen", "evacuated"].includes(
              msg.value,
            )
          )
            throw new Error("Intervention unavailable");
          const values = state.interventions[meta.station] || [];
          if (!values.includes(msg.value)) {
            const before = new Set(state.fired);
            appendEvent(meta.room, meta.role, {
              type: "intervention.reported",
              station: meta.station,
              value: msg.value,
            });
            evaluate(state, {
              type: "intervention",
              station: meta.station,
              value: msg.value,
            });
            journalNewFired(meta.room, before);
          }
        } else if (msg.type === "unlock" && meta.role === "element") {
          const st = state.scenario.stations.find((s) => s.id === meta.station);
          if (
            state.frozen ||
            !st ||
            !["countdown", "access", "lock"].includes(st.module) ||
            (st.module === "countdown" && state.clock >= st.duration)
          )
            throw new Error("Terminal unavailable");
          if (!meta.inspected)
            throw new Error("Read the current diagnostic report first");
          if (Date.now() < (meta.retryAfter || 0))
            throw new Error("Input locked briefly after incorrect code");
          if (!equal(st.code, String(msg.code))) {
            meta.retryAfter = Date.now() + 3000;
            throw new Error("Code rejected. Read the ACTIVE shunt entry.");
          }
          if (!state.props[st.id]) {
            const before = new Set(state.fired);
            appendEvent(meta.room, meta.role, {
              type: "access.granted",
              station: st.id,
            });
            evaluate(state, { type: "prop", station: st.id });
            journalNewFired(meta.room, before);
          }
        } else if (msg.type === "prop" && meta.role === "element") {
          const st = state.scenario.stations.find((s) => s.id === meta.station);
          if (state.frozen || !st || !st.bindings.prop)
            throw new Error("No prop bound to this station");
          const prop = state.scenario.props.find(
            (p) => p.id === st.bindings.prop,
          );
          if (!prop || !prop.states.includes(String(msg.state)))
            throw new Error("Invalid prop state");
          const before = new Set(state.fired);
          const propsBefore = { ...state.propStates };
          appendEvent(meta.room, meta.role, {
            type: "prop.changed",
            prop: st.bindings.prop,
            state: String(msg.state),
          });
          for (const event of workflowStartsForProp(
            state,
            st.bindings.prop,
            String(msg.state),
            state.clock,
          ))
            appendEvent(meta.room, meta.role, event);
          reactToPropChanges(meta.room, meta.role, propsBefore);
          evaluate(state, { type: "prop", station: st.id });
          journalNewFired(meta.room, before);
        } else if (msg.type === "interaction" && meta.role === "element") {
          const st = state.scenario.stations.find((s) => s.id === meta.station);
          if (state.frozen || !st) throw new Error("Interaction unavailable");
          const events = interactionEvents(
            state,
            meta.station,
            String(msg.value ?? "").slice(0, 500),
          );
          if (!events.length) throw new Error("No active task");
          const before = new Set(state.fired);
          const propsBefore = { ...state.propStates };
          for (const event of events) appendEvent(meta.room, meta.role, event);
          reactToPropChanges(meta.room, meta.role, propsBefore);
          evaluate(state);
          journalNewFired(meta.room, before);
        } else if (msg.type === "abort" && ["trainer", "safety"].includes(meta.role)) {
          appendEvent(meta.room, meta.role, {
            type: "exercise.aborted",
            by: meta.role,
          });
        } else if (
          msg.type === "note" &&
          ["trainer", "safety", "assessor"].includes(meta.role)
        ) {
          const text = String(msg.text || "").trim().slice(0, 500);
          if (!text) throw new Error("Empty note");
          appendEvent(meta.room, meta.role, {
            type: "note.added",
            role: meta.role,
            text,
          });
        } else if (
          msg.type === "transport" &&
          meta.role === "safety" &&
          msg.command === "pause"
        ) {
          appendEvent(meta.room, meta.role, {
            type: "exercise.transport",
            command: "pause",
          });
        } else {
          if (meta.role !== "trainer")
            throw new Error("Trainer permission required");
          if (msg.type === "provision") {
            const st = state.scenario.stations.find(
              (s) => s.id === msg.station,
            );
            if (!st) throw new Error("Unknown station");
            for (const [key, value] of invites)
              if (value.room === meta.room && value.station === st.id)
                invites.delete(key);
            const invitation = token(),
              expires = Date.now() + 600000;
            invites.set(hash(invitation), {
              room: meta.room,
              station: st.id,
              role: st.role,
              expires,
            });
            send(ws, {
              type: "invitation",
              token: invitation,
              station: st.id,
              role: st.role,
              expires,
            });
            return;
          } else if (msg.type === "revoke") {
            revoke(meta.room, ident.parse(msg.station));
          } else if (msg.type === "configure") {
            if (!state.frozen)
              throw new Error("Pause the exercise before editing its scenario");
            if (msg.revision !== state.revision)
              throw new Error("Scenario changed elsewhere. Reload your draft.");
            const parsed = scenarioSchema.parse(msg.scenario);
            if (JSON.stringify(parsed).length > 10000000)
              throw new Error("Scenario too large");
            for (const st of state.scenario.stations)
              if (
                !parsed.stations.some(
                  (s) => s.id === st.id && s.role === st.role,
                )
              )
                revoke(meta.room, st.id);
            baseline.set(meta.room, structuredClone(parsed));
            appendEvent(meta.room, meta.role, {
              type: "scenario.saved",
              scenario: parsed,
            });
            for (const m of sockets.values())
              if (m.room === meta.room) m.inspected = false;
            send(ws, { type: "saved", revision: state.revision });
          } else if (msg.type === "fire") {
            const inject = state.scenario.injects.find((r) => r.id === msg.inject);
            if (!inject) throw new Error("Unknown inject");
            if (state.frozen) throw new Error("Resume the exercise before firing");
            if (state.fired.includes(inject.id)) throw new Error("Already fired");
            const propsBefore = { ...state.propStates };
            appendEvent(meta.room, meta.role, {
              type: "inject.fired",
              inject: inject.id,
            });
            reactToPropChanges(meta.room, meta.role, propsBefore);
          } else if (msg.type === "reschedule") {
            const inject = state.scenario.injects.find((r) => r.id === msg.inject);
            if (!inject) throw new Error("Unknown inject");
            if (state.fired.includes(inject.id)) throw new Error("Already fired");
            const to = z.number().min(0).max(86400).parse(msg.to);
            appendEvent(meta.room, meta.role, {
              type: "msel.rescheduled",
              inject: inject.id,
              from: inject.scheduledAt ?? inject.at,
              to,
              reason: String(msg.reason || "").slice(0, 120),
            });
          } else if (msg.type === "message") {
            const to = String(msg.to || "all").slice(0, 40);
            const text = String(msg.text || "").trim().slice(0, 280);
            if (!text) throw new Error("Empty message");
            if (
              to !== "all" &&
              to !== "hq" &&
              !state.scenario.stations.some((s) => s.id === to)
            )
              throw new Error("Unknown recipient");
            appendEvent(meta.room, meta.role, {
              type: "message.posted",
              from: "excon",
              to,
              text,
            });
          } else if (msg.type === "transport") {
            if (msg.command === "play" || msg.command === "pause") {
              if (msg.command === "play") {
                const blocking = lintMission(state.scenario).filter(
                  (f) => f.severity === "error",
                );
                if (blocking.length)
                  throw new Error(
                    `Mission has ${blocking.length} blocking error(s)`,
                  );
              }
              appendEvent(meta.room, meta.role, {
                type: "exercise.transport",
                command: msg.command,
              });
            } else if (msg.command === "reset") {
              for (const m of sockets.values())
                if (m.room === meta.room) m.inspected = false;
              appendFileSync(
                journalPath(meta.room),
                JSON.stringify({
                  serverSeq: nextSeq(meta.room),
                  wallAt: Date.now(),
                  actor: meta.role,
                  event: { type: "exercise.reset" },
                }) + "\n",
              );
              const next = newState(
                meta.room,
                structuredClone(baseline.get(meta.room)),
              );
              next.revision = state.revision + 1;
              next.presence = state.presence;
              rooms.set(meta.room, next);
              bumpClock(meta.room);
            } else throw new Error("Unknown transport command");
          } else if (msg.type === "action") {
            const action = actionSchema.parse(msg.action);
            if (action.type !== "message") {
              const rows =
                action.type === "patient"
                  ? state.scenario.patients
                  : action.type === "release"
                    ? state.scenario.dossiers
                    : action.type === "objective"
                      ? state.scenario.objectives
                      : state.scenario.stations;
              if (!rows.some((r) => r.id === action.target))
                throw new Error("Unknown action target");
            }
            const propsBefore = { ...state.propStates };
            appendEvent(meta.room, meta.role, {
              type: "action.applied",
              action,
            });
            reactToPropChanges(meta.room, meta.role, propsBefore);
          } else if (msg.type === "patient") {
            const patient = patientSchema.parse(msg.patient),
              i = state.scenario.patients.findIndex((p) => p.id === patient.id);
            if (i < 0) throw new Error("Unknown patient");
            scenarioSchema.parse({
              ...state.scenario,
              patients: state.scenario.patients.map((p, index) =>
                index === i ? patient : p,
              ),
            });
            appendEvent(meta.room, meta.role, {
              type: "patient.changed",
              patient,
            });
          } else if (msg.type === "workflow-start") {
            const workflow = state.scenario.workflows.find(
              (w) => w.id === msg.workflow,
            );
            if (!workflow) throw new Error("Unknown workflow");
            if (workflow.trigger.type !== "manual")
              throw new Error("Workflow starts from its trigger");
            if (state.frozen)
              throw new Error("Resume the exercise before starting a workflow");
            if (state.workflows[workflow.id])
              throw new Error("Workflow already started");
            const propsBefore = { ...state.propStates };
            for (const event of workflowStartEvents(
              state,
              workflow.id,
              state.clock,
            ))
              appendEvent(meta.room, meta.role, event);
            reactToPropChanges(meta.room, meta.role, propsBefore);
          } else throw new Error("Unknown command");
        }
        dirty = true;
        // The ACK mirrors the current journal position instead of consuming a
        // new number, so the event sequence stays gap-free for replay/resume.
        const serverSeq = roomSeq.get(meta.room) || 0;
        rememberCommand(meta.room, eventId, serverSeq);
        send(ws, {
          type: "ack",
          command: msg.type,
          eventId: eventId || undefined,
          serverSeq,
          result: "applied",
        });
        broadcast(meta.room);
      } catch (error) {
        const message =
          error instanceof z.ZodError
            ? error.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .slice(0, 3)
                .join("; ")
            : error.message;
        send(ws, { type: "error", message });
        if (typeof msg?.eventId === "string" && msg.eventId) {
          const m = sockets.get(ws);
          send(ws, {
            type: "rejected",
            eventId: msg.eventId,
            reason: message,
            serverSeq: (m && roomSeq.get(m.room)) || 0,
          });
        }
      }
    });
    ws.on("close", () => {
      clearTimeout(timeout);
      clearInterval(heartbeat);
      const meta = sockets.get(ws);
      sockets.delete(ws);
      if (meta?.station) {
        const state = rooms.get(meta.room);
        if (
          state &&
          ![...sockets.values()].some(
            (m) => m.room === meta.room && m.station === meta.station,
          )
        ) {
          state.presence[meta.station] = {
            online: false,
            lastSeen: Date.now(),
          };
          broadcast(meta.room);
        }
      }
    });
  });
  let last = performance.now();
  const tick = setInterval(() => {
    const now = performance.now(),
      delta = (now - last) / 1000;
    last = now;
    for (const [room, state] of rooms) {
      if (!state.frozen) {
        const fired = state.fired.length;
        const before = new Set(state.fired);
        const propsBefore = { ...state.propStates };
        advance(state, delta);
        for (const event of workflowTick(state, state.clock))
          appendEvent(room, "engine", event);
        dirty = true;
        if (state.fired.length !== fired) journalNewFired(room, before);
        reactToPropChanges(room, "engine", propsBefore);
        broadcast(room, state.fired.length === fired);
      }
    }
  }, 250);
  const saveTimer = setInterval(() => {
    for (const map of [invites, credentials])
      for (const [key, value] of map)
        if (value.expires < Date.now()) map.delete(key);
    void persist();
  }, 5000);
  const snapshotTimer = setInterval(() => {
    for (const room of rooms.keys()) void writeSnapshotFor(room);
  }, 30000);
  await new Promise((resolve) => server.listen(port, host, resolve));
  return {
    server,
    secret,
    port: server.address().port,
    close: async () => {
      clearInterval(tick);
      clearInterval(saveTimer);
      clearInterval(snapshotTimer);
      for (const ws of wss.clients) ws.terminate();
      await new Promise((resolve) => wss.close(resolve));
      await new Promise((resolve) => server.close(resolve));
      await Promise.all([...rooms.keys()].map((room) => writeSnapshotFor(room)));
      await persist();
    },
  };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const app = await startExercise();
  console.log(`ScreenForge: http://localhost:${app.port}/?role=trainer`);
  console.log(`Trainer key: ${app.secret}`);
  console.log(
    "For tablets use a trusted HTTPS reverse proxy. Set EXERCISE_ADMIN_KEY to keep the trainer key across restarts.",
  );
  for (const sig of ["SIGINT", "SIGTERM"])
    process.once(sig, () => void app.close().then(() => process.exit()));
}
