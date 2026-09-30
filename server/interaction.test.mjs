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
          () =>
            reject(
              new Error(
                "timed out: " +
                  predicate.toString() +
                  " queued=" +
                  queue.map((m) => m.type + ":" + (m.message || "")).join(","),
              ),
            ),
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

const workflow = {
  id: "wf-pilot",
  version: 1,
  name: "Cable link",
  trigger: { type: "prop", prop: "device-alpha", to: "connected" },
  entry: "start",
  nodes: [
    { id: "start", type: "start" },
    { id: "link", type: "show-surface", station: "device-1", surface: "link" },
    {
      id: "code",
      type: "task",
      task: "code-entry",
      config: {
        expectedValueRef: "accessCode",
        maxAttempts: 3,
        inputLength: 4,
        maskInput: true,
      },
    },
    { id: "fail", type: "increment", variable: "attempts" },
    {
      id: "limit",
      type: "condition",
      variable: "attempts",
      operator: ">=",
      value: 3,
    },
    {
      id: "lockout",
      type: "show-surface",
      station: "device-1",
      surface: "lockout",
    },
    { id: "lockout-end", type: "end", outcome: "failure" },
    {
      id: "diagnostics",
      type: "show-surface",
      station: "device-1",
      surface: "diagnostics",
    },
    {
      id: "arm",
      type: "set-prop-state",
      prop: "device-alpha",
      state: "diagnosed",
    },
    { id: "done", type: "complete-objective", objective: "objective-1" },
    { id: "end", type: "end", outcome: "success" },
  ],
  edges: [
    { id: "e1", source: "start", output: "out", target: "link" },
    { id: "e2", source: "link", output: "out", target: "code" },
    { id: "e3", source: "code", output: "success", target: "diagnostics" },
    { id: "e4", source: "code", output: "failure", target: "fail" },
    { id: "e5", source: "fail", output: "out", target: "limit" },
    { id: "e6", source: "limit", output: "true", target: "lockout" },
    { id: "e7", source: "limit", output: "false", target: "code" },
    { id: "e8", source: "lockout", output: "out", target: "lockout-end" },
    { id: "e9", source: "diagnostics", output: "out", target: "arm" },
    { id: "e10", source: "arm", output: "out", target: "done" },
    { id: "e11", source: "done", output: "out", target: "end" },
  ],
  variables: [
    { id: "accessCode", kind: "string", initial: "7392", secret: true },
    { id: "attempts", kind: "number", initial: 0 },
  ],
};

const scenario = {
  version: 2,
  name: "Interaction",
  mode: "LIVE",
  seed: 1,
  map: { lat: 0, lng: 0, zoom: 5, tiles: "", attribution: "" },
  stations: [
    { id: "hq", name: "HQ", role: "hq", module: "tracking" },
    {
      id: "device-1",
      name: "Device",
      role: "element",
      module: "terminal",
      bindings: { patient: "", prop: "device-alpha", objective: "" },
    },
  ],
  props: [
    {
      id: "device-alpha",
      kind: "custom",
      name: "Device alpha",
      states: ["disconnected", "connected", "diagnosed", "locked"],
      initial: "disconnected",
    },
  ],
  objectives: [{ id: "objective-1", name: "Diagnose device" }],
  workflows: [workflow],
  injects: [],
};

async function connect(port, clients, hello) {
  const c = client(port);
  clients.push(c);
  await c.ready;
  c.send({
    type: "hello",
    room: "room",
    station: "",
    token: "test-secret",
    ...hello,
  });
  return c;
}

// Trainer configures and starts the mission; the device station joins and
// connects the prop so the workflow starts.
async function setup(dir, clients) {
  const app = await startExercise({
    port: 0,
    secret: "test-secret",
    dataDir: dir,
  });
  const trainer = await connect(app.port, clients, { role: "trainer" });
  await trainer.next(type("state"));
  trainer.send({ type: "configure", scenario, revision: 0 });
  await trainer.next(type("saved"));
  trainer.send({ type: "transport", command: "play" });
  await trainer.next((m) => m.type === "state" && m.state.phase === "running");
  trainer.send({ type: "provision", station: "device-1" });
  const invite = await trainer.next(type("invitation"));
  const device = await connect(app.port, clients, {
    role: "element",
    station: "device-1",
    token: invite.token,
    invite: true,
  });
  await device.next(type("credential"));
  await device.next(type("state"));
  return { app, trainer, device };
}

test("workflow runs from prop link to objective with server-authoritative state", async () => {
  const dir = await mkdtemp(join(tmpdir(), "screenforge-interaction-"));
  const clients = [];
  let app;
  try {
    const started = await setup(dir, clients);
    app = started.app;
    const { trainer, device } = started;

    device.send({ type: "prop", state: "connected" });
    const linked = await device.next(
      (m) =>
        m.type === "state" &&
        m.state.workflows?.["wf-pilot"]?.activeNodeIds?.includes("code"),
    );
    const instance = linked.state.workflows["wf-pilot"];
    assert.deepEqual(instance.surface, {
      station: "device-1",
      surface: "link",
    });
    assert.equal(instance.variables.accessCode, "");
    assert.equal(instance.variables.attempts, 0);

    device.send({ type: "interaction", value: "7392" });
    const done = await device.next(
      (m) =>
        m.type === "state" &&
        m.state.workflows?.["wf-pilot"]?.status === "completed",
    );
    assert.equal(done.state.workflows["wf-pilot"].outcome, "success");
    assert.ok(done.state.completed.includes("objective-1"));
    assert.equal(done.state.propStates["device-alpha"], "diagnosed");

    device.send({ type: "interaction", value: "7392", eventId: "stale-1" });
    assert.match((await device.next(type("error"))).message, /No active task/);

    const trainerView = await trainer.next(
      (m) =>
        m.type === "state" &&
        m.state.workflows?.["wf-pilot"]?.status === "completed",
    );
    assert.equal(
      trainerView.state.scenario.workflows[0].variables.find(
        (v) => v.id === "accessCode",
      ).initial,
      "7392",
    );
  } finally {
    for (const c of clients) c.ws.terminate();
    await app?.close();
    await rm(dir, { recursive: true, force: true });
  }
});

const manualScenario = {
  version: 2,
  name: "Manual flow",
  mode: "LIVE",
  seed: 2,
  map: { lat: 0, lng: 0, zoom: 5, tiles: "", attribution: "" },
  stations: [
    { id: "hq", name: "HQ", role: "hq", module: "tracking" },
    {
      id: "device-1",
      name: "Device",
      role: "element",
      module: "terminal",
      bindings: { patient: "", prop: "device-alpha", objective: "" },
    },
  ],
  props: [
    {
      id: "device-alpha",
      kind: "custom",
      name: "Device alpha",
      states: ["disconnected", "connected"],
      initial: "disconnected",
    },
  ],
  objectives: [{ id: "objective-1", name: "Connect device" }],
  workflows: [
    {
      id: "wf-connect",
      version: 1,
      name: "Connect flow",
      trigger: { type: "manual" },
      entry: "start",
      nodes: [
        { id: "start", type: "start" },
        {
          id: "connect",
          type: "task",
          task: "connect",
          config: {
            prompt: "Connect",
            prop: "device-alpha",
            to: "connected",
          },
        },
        {
          id: "done",
          type: "complete-objective",
          objective: "objective-1",
        },
        { id: "end", type: "end", outcome: "success" },
      ],
      edges: [
        { id: "e1", source: "start", output: "out", target: "connect" },
        { id: "e2", source: "connect", output: "success", target: "done" },
        { id: "e3", source: "done", output: "out", target: "end" },
      ],
    },
  ],
  injects: [],
};

test("manual workflow starts from EXCON and completes on a prop event", async () => {
  const dir = await mkdtemp(join(tmpdir(), "screenforge-interaction-"));
  const clients = [];
  let app;
  try {
    app = await startExercise({
      port: 0,
      secret: "test-secret",
      dataDir: dir,
    });
    const trainer = await connect(app.port, clients, { role: "trainer" });
    await trainer.next(type("state"));
    trainer.send({ type: "configure", scenario: manualScenario, revision: 0 });
    await trainer.next(type("saved"));
    trainer.send({ type: "transport", command: "play" });
    await trainer.next((m) => m.type === "state" && m.state.phase === "running");
    trainer.send({ type: "provision", station: "device-1" });
    const invite = await trainer.next(type("invitation"));
    const device = await connect(app.port, clients, {
      role: "element",
      station: "device-1",
      token: invite.token,
      invite: true,
    });
    await device.next(type("credential"));
    await device.next(type("state"));

    trainer.send({ type: "workflow-start", workflow: "wf-connect" });
    await trainer.next(
      (m) =>
        m.type === "state" &&
        m.state.workflows?.["wf-connect"]?.activeNodeIds?.includes("connect"),
    );
    const deviceView = await device.next(
      (m) =>
        m.type === "state" &&
        m.state.workflows?.["wf-connect"]?.activeTask?.task === "connect",
    );
    assert.equal(
      deviceView.state.workflows["wf-connect"].activeTask.node,
      "connect",
    );

    device.send({ type: "prop", state: "connected" });
    const done = await trainer.next(
      (m) =>
        m.type === "state" &&
        m.state.workflows?.["wf-connect"]?.status === "completed",
    );
    assert.equal(done.state.workflows["wf-connect"].outcome, "success");
    assert.ok(done.state.completed.includes("objective-1"));
    assert.equal(done.state.propStates["device-alpha"], "connected");

    trainer.send({
      type: "workflow-start",
      workflow: "wf-connect",
      eventId: "flow-again",
    });
    assert.match(
      (await trainer.next(type("error"))).message,
      /already started/,
    );
  } finally {
    for (const c of clients) c.ws.terminate();
    await app?.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("failure counter locks out and restart replay restores the instance", async () => {
  const dir = await mkdtemp(join(tmpdir(), "screenforge-interaction-"));
  const clients = [];
  let app;
  try {
    const started = await setup(dir, clients);
    app = started.app;
    const { device } = started;

    device.send({ type: "prop", state: "connected" });
    await device.next(
      (m) =>
        m.type === "state" &&
        m.state.workflows?.["wf-pilot"]?.activeNodeIds?.includes("code"),
    );
    let locked;
    for (const attempt of [1, 2, 3]) {
      device.send({ type: "interaction", value: "0000" });
      locked = await device.next(
        (m) =>
          m.type === "state" &&
          m.state.workflows?.["wf-pilot"]?.variables?.attempts === attempt,
      );
    }
    assert.equal(locked.state.workflows["wf-pilot"].status, "completed");
    assert.equal(locked.state.workflows["wf-pilot"].outcome, "failure");

    for (const c of clients) c.ws.terminate();
    await app.close();
    app = await startExercise({ port: 0, secret: "test-secret", dataDir: dir });
    const restored = await connect(app.port, clients, { role: "trainer" });
    const state = (await restored.next(type("state"))).state;
    assert.equal(state.workflows["wf-pilot"].status, "completed");
    assert.equal(state.workflows["wf-pilot"].variables.attempts, 3);
    assert.equal(state.workflows["wf-pilot"].outcome, "failure");
  } finally {
    for (const c of clients) c.ws.terminate();
    await app?.close();
    await rm(dir, { recursive: true, force: true });
  }
});
