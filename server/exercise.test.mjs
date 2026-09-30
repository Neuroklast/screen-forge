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
        const timer = setTimeout(() => {
          const i = waiting.indexOf(entry);
          if (i >= 0) waiting.splice(i, 1);
          reject(
            new Error(
              "Message timed out: " +
                predicate.toString() +
                " queued=" +
                queue.map((m) => m.type + ":" + (m.message || "")).join(","),
            ),
          );
        }, 4000);
        const entry = {
          predicate,
          resolve: (value) => {
            clearTimeout(timer);
            resolve(value);
          },
        };
        waiting.push(entry);
      });
    },
  };
}
const type = (t) => (m) => m.type === t;

test("play is rejected while the mission linter reports blocking errors", async () => {
  const dir = await mkdtemp(join(tmpdir(), "screenforge-"));
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
    });
    const initial = (await c.next(type("state"))).state;
    const scenario = structuredClone(initial.scenario);
    scenario.stations = [];
    scenario.injects = [];
    c.send({ type: "configure", revision: 0, scenario });
    await c.next(type("saved"));
    c.send({ type: "transport", command: "play", eventId: "play-empty" });
    assert.match((await c.next(type("error"))).message, /blocking error/);
    assert.match(
      (
        await c.next(
          (m) => m.type === "rejected" && m.eventId === "play-empty",
        )
      ).reason,
      /blocking error/,
    );
  } finally {
    for (const cl of clients) cl.ws.terminate();
    await app?.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("authenticated multi-device lifecycle, validation, diagnostics, revocation and restart", async () => {
  const dir = await mkdtemp(join(tmpdir(), "screenforge-"));
  let app;
  const clients = [];
  try {
    app = await startExercise({ port: 0, secret: "test-secret", dataDir: dir });
    const connect = async () => {
      const c = client(app.port);
      clients.push(c);
      await c.ready;
      return c;
    };
    const bad = await connect();
    bad.send({
      type: "hello",
      role: "trainer",
      room: "room",
      station: "",
      token: "wrong",
    });
    assert.match((await bad.next(type("error"))).message, /rejected/);
    const trainer = await connect();
    trainer.send({
      type: "hello",
      role: "trainer",
      room: "room",
      station: "",
      token: "test-secret",
    });
    const initial = (await trainer.next(type("state"))).state;
    assert.equal(initial.frozen, true);
    trainer.send({
      type: "configure",
      revision: 0,
      scenario: { ...initial.scenario, patients: [] },
    });
    assert.match(
      (await trainer.next(type("error"))).message,
      /Patient missing/,
    );
    const scenario = structuredClone(initial.scenario);
    scenario.map.tiles = "";
    scenario.stations.find((s) => s.id === "prop-1").code = "482916";
    scenario.stations.find((s) => s.id === "prop-1").presentation = {
      scene: "intranet",
      config: { title: "RELAY 07" },
      revision: 3,
    };
    scenario.dossiers = [
      {
        id: "intel",
        name: "Hidden person",
        role: "role",
        blood: "O+",
        allergies: "",
        clearance: "4",
        status: "active",
        facility: "field",
        notes: "secret",
        events: [],
        photo: "",
        released: false,
      },
    ];
    trainer.send({ type: "configure", revision: 0, scenario });
    await trainer.next(type("saved"));
    const assign = async (station) => {
      trainer.send({ type: "provision", station });
      const invite = await trainer.next(type("invitation"));
      const c = await connect();
      c.send({
        type: "hello",
        role: invite.role,
        room: "room",
        station,
        token: invite.token,
        invite: true,
      });
      const credential = (await c.next(type("credential"))).token;
      const state = (await c.next(type("state"))).state;
      return { c, credential, invite, state };
    };
    const prop = await assign("prop-1"),
      hq = await assign("hq"),
      medic = await assign("med-1");
    assert.equal(prop.state.scenario.injects.length, 0);
    assert.equal(prop.state.scenario.dossiers.length, 0);
    assert.equal(
      prop.state.scenario.stations.find((s) => s.id === "prop-1").code,
      "",
    );
    assert.equal(
      prop.state.scenario.stations.find((s) => s.id === "prop-1").presentation
        .config.title,
      "RELAY 07",
    );
    assert.deepEqual(prop.state.moduleEvents, { "prop-1": [] });
    assert.equal(hq.state.scenario.dossiers.length, 0);
    hq.c.send({ type: "transport", command: "play" });
    assert.match((await hq.c.next(type("error"))).message, /permission/);
    prop.c.send({ type: "configure", revision: 1, scenario });
    assert.match((await prop.c.next(type("error"))).message, /permission/);
    const replay = await connect();
    replay.send({
      type: "hello",
      role: "element",
      room: "room",
      station: "prop-1",
      token: prop.invite.token,
      invite: true,
    });
    assert.match((await replay.next(type("error"))).message, /expired/);
    trainer.send({ type: "transport", command: "play" });
    await trainer.next((m) => m.type === "ack" && m.command === "transport");
    prop.c.send({ type: "unlock", code: "482916" });
    assert.match((await prop.c.next(type("error"))).message, /diagnostic/);
    prop.c.send({ type: "diagnostic" });
    assert.equal((await prop.c.next(type("diagnostic"))).code, "482916");
    prop.c.send({ type: "unlock", code: "482916" });
    const solved = await prop.c.next(
      (m) => m.type === "state" && m.state.props["prop-1"],
    );
    assert.equal(solved.state.props["prop-1"], true);
    medic.c.send({ type: "intervention", value: "treated" });
    await medic.c.next(
      (m) =>
        m.type === "state" &&
        m.state.interventions["med-1"]?.includes("treated"),
    );
    trainer.send({
      type: "action",
      action: { type: "release", target: "intel" },
    });
    assert.equal(
      (
        await hq.c.next(
          (m) => m.type === "state" && m.state.scenario.dossiers.length === 1,
        )
      ).state.scenario.dossiers[0].notes,
      "secret",
    );
    await trainer.next(type("tick"));
    trainer.send({ type: "transport", command: "pause" });
    const paused = (
      await trainer.next(
        (m) => m.type === "state" && m.state.clock > 0 && m.state.frozen,
      )
    ).state;
    trainer.send({ type: "configure", revision: 0, scenario });
    assert.match(
      (await trainer.next(type("error"))).message,
      /changed elsewhere/,
    );
    trainer.send({ type: "transport", command: "reset" });
    const reset = (
      await trainer.next((m) => m.type === "state" && m.state.revision === 2)
    ).state;
    assert.equal(reset.clock, 0);
    assert.deepEqual(reset.props, {});
    assert.equal(reset.scenario.dossiers[0].released, false);
    assert.ok(paused.clock > 0);
    trainer.send({ type: "revoke", station: "prop-1" });
    await trainer.next((m) => m.type === "ack" && m.command === "revoke");
    const revoked = await connect();
    revoked.send({
      type: "hello",
      role: "element",
      room: "room",
      station: "prop-1",
      token: prop.credential,
    });
    assert.match((await revoked.next(type("error"))).message, /revoked/);
    for (const c of clients) c.ws.terminate();
    await app.close();
    app = await startExercise({ port: 0, secret: "test-secret", dataDir: dir });
    const restored = await connect();
    restored.send({
      type: "hello",
      role: "hq",
      room: "room",
      station: "hq",
      token: hq.credential,
    });
    const restoredState = (await restored.next(type("state"))).state;
    assert.equal(restoredState.frozen, true);
    assert.equal(restoredState.scenario.name, scenario.name);
  } finally {
    for (const c of clients) c.ws.terminate();
    await app?.close();
    await rm(dir, { recursive: true, force: true });
  }
});
