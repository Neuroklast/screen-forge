import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WebSocket } from "ws";
import { startExercise } from "./exercise.mjs";

function client(port) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/exercise`, {
    origin: `http://127.0.0.1:${port}`,
  });
  const queue = [],
    waiting = [];
  ws.on("message", (raw) => {
    const msg = JSON.parse(String(raw));
    const i = waiting.findIndex((w) => w.predicate(msg));
    if (i >= 0) waiting.splice(i, 1)[0].resolve(msg);
    else queue.push(msg);
  });
  const ready = new Promise((resolve, reject) => {
    ws.once("open", resolve);
    ws.once("error", reject);
  });
  return {
    ws,
    ready,
    send: (msg) => ws.send(JSON.stringify(msg)),
    next: (predicate = () => true) => {
      const i = queue.findIndex(predicate);
      if (i >= 0) return Promise.resolve(queue.splice(i, 1)[0]);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("Message timed out")),
          4000,
        );
        waiting.push({
          predicate,
          resolve: (value) => {
            clearTimeout(timer);
            resolve(value);
          },
        });
      });
    },
  };
}
const type = (t) => (m) => m.type === t;

const scenario = {
  version: 2,
  name: "Protocol",
  mode: "LIVE",
  seed: 1,
  map: { lat: 0, lng: 0, zoom: 5, tiles: "", attribution: "" },
  stations: [{ id: "hq", name: "HQ", role: "hq", module: "tracking" }],
};

test("protocol v2: handshake, idempotent commands and rejection", async () => {
  const dir = await mkdtemp(join(tmpdir(), "screenforge-proto-"));
  let app;
  const clients = [];
  try {
    app = await startExercise({ port: 0, secret: "test-secret", dataDir: dir });
    const c = client(app.port);
    clients.push(c);
    await c.ready;
    c.send({
      type: "hello",
      role: "trainer",
      room: "room",
      station: "",
      token: "test-secret",
      protocol: 2,
      lastServerSeq: 0,
    });
    const ready = await c.next(type("ready"));
    assert.equal(ready.protocol, 2);
    assert.equal(typeof ready.serverNow, "number");
    await c.next(type("state"));

    c.send({ type: "configure", revision: 0, scenario, eventId: "cfg-1" });
    await c.next(type("saved"));
    const cfgAck = await c.next((m) => m.type === "ack" && m.eventId === "cfg-1");
    assert.equal(cfgAck.result, "applied");
    assert.ok(cfgAck.serverSeq > 0);

    c.send({ type: "transport", command: "play", eventId: "play-1" });
    await c.next((m) => m.type === "ack" && m.eventId === "play-1");

    c.send({ type: "message", to: "all", text: "dup", eventId: "msg-1" });
    const first = await c.next((m) => m.type === "ack" && m.eventId === "msg-1");
    assert.equal(first.result, "applied");
    c.send({ type: "message", to: "all", text: "dup", eventId: "msg-1" });
    const second = await c.next((m) => m.type === "ack" && m.eventId === "msg-1");
    assert.equal(second.result, "duplicate");
    assert.equal(second.serverSeq, first.serverSeq);

    const state = await c.next(
      (m) => m.type === "state" && m.state.messages.some((x) => x.text === "dup"),
    );
    assert.equal(
      state.state.messages.filter((x) => x.text === "dup").length,
      1,
    );

    c.send({ type: "transport", command: "bogus", eventId: "bad-1" });
    const rejected = await c.next(type("rejected"));
    assert.equal(rejected.eventId, "bad-1");
    assert.match(rejected.reason, /Unknown transport/);
  } finally {
    for (const c of clients) c.ws.terminate();
    await app?.close();
    await rm(dir, { recursive: true, force: true });
  }
});
