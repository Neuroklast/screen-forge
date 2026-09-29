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
        const timer = setTimeout(() => reject(new Error("timed out")), 4000);
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
  name: "Control",
  mode: "LIVE",
  seed: 1,
  map: { lat: 0, lng: 0, zoom: 5, tiles: "", attribution: "" },
  stations: [
    { id: "hq", name: "HQ", role: "hq", module: "tracking" },
    {
      id: "b-1",
      name: "Bake",
      role: "element",
      module: "beacon",
      bindings: { patient: "", prop: "beacon-1", objective: "" },
    },
  ],
  props: [
    { id: "beacon-1", kind: "beacon", name: "Bake 01", states: ["off", "active"], initial: "off" },
  ],
  injects: [
    {
      id: "inj-1",
      name: "Manuell",
      trigger: "manual",
      actions: [{ type: "message", text: "Manuell ausgelöst" }],
      enabled: true,
    },
  ],
};

test("phase model, manual fire, safety abort and assessor notes", async () => {
  const dir = await mkdtemp(join(tmpdir(), "screenforge-control-"));
  let app;
  const clients = [];
  try {
    app = await startExercise({ port: 0, secret: "test-secret", dataDir: dir });
    const connect = async (role, room = "room") => {
      const c = client(app.port);
      clients.push(c);
      await c.ready;
      c.send({ type: "hello", role, room, station: "", token: "test-secret" });
      await c.next(type("ready"));
      return c;
    };
    const trainer = await connect("trainer");
    trainer.send({ type: "configure", scenario, revision: 0 });
    await trainer.next(type("saved"));
    trainer.send({ type: "transport", command: "play" });
    await trainer.next((m) => m.type === "state" && m.state.phase === "running");

    trainer.send({ type: "fire", inject: "inj-1" });
    const fired = await trainer.next(
      (m) => m.type === "state" && m.state.fired.includes("inj-1"),
    );
    assert.equal(fired.state.phase, "running");

    const safety = await connect("safety");
    safety.send({ type: "abort" });
    const aborted = await trainer.next(
      (m) => m.type === "state" && m.state.phase === "aborted",
    );
    assert.equal(aborted.state.frozen, true);

    const assessor = await connect("assessor");
    const projected = await assessor.next(
      (m) =>
        m.type === "state" &&
        m.state.scenario.stations.every((s) => !s.code),
    );
    assert.ok(projected);

    assessor.send({ type: "note", text: "Beobachtung" });
    await trainer.next(
      (m) =>
        m.type === "state" &&
        m.state.notes.some((n) => n.text === "Beobachtung"),
    );
  } finally {
    for (const c of clients) c.ws.close();
    await app?.close();
    await rm(dir, { recursive: true, force: true });
  }
});
