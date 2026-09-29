import { describe, expect, it } from "vitest";
import { RingBuffer, TelemetryStore } from "./telemetry";

describe("telemetry", () => {
  it("keeps a bounded window of the newest samples", () => {
    const ring = new RingBuffer<number>(3);
    for (const n of [1, 2, 3, 4, 5]) ring.push(n);
    expect(ring.length).toBe(3);
    expect(ring.toArray()).toEqual([3, 4, 5]);
    expect(ring.latest()).toBe(5);
  });

  it("does not grow memory under sustained input", () => {
    const ring = new RingBuffer<number>(64);
    for (let i = 0; i < 100000; i++) ring.push(i);
    expect(ring.length).toBe(64);
    expect(ring.toArray().length).toBe(64);
  });

  it("notifies subscribers and reports the latest per channel", () => {
    const store = new TelemetryStore();
    let notifications = 0;
    const off = store.subscribe(() => notifications++);
    store.push("hr", 100, 118);
    store.push("hr", 200, 121);
    store.push("spo2", 200, 91);
    expect(notifications).toBe(3);
    expect(store.latest("hr")).toEqual({ at: 200, value: 121 });
    expect(store.latest("spo2")?.value).toBe(91);
    off();
    store.push("hr", 300, 120);
    expect(notifications).toBe(3);
  });
});
