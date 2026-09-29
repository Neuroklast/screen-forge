import { describe, expect, it } from "vitest";
import { estimateOffset, ServerClock } from "./clock";

describe("server clock", () => {
  it("estimates a robust median offset", () => {
    expect(
      estimateOffset([
        { serverNow: 1100, localNow: 1000 },
        { serverNow: 1102, localNow: 1000 },
        { serverNow: 1098, localNow: 1000 },
        { serverNow: 1101, localNow: 1000 },
      ]),
    ).toBe(100.5);
    expect(estimateOffset([])).toBe(0);
  });

  it("predicts server time between updates", () => {
    const clock = new ServerClock();
    clock.observe(1000, 0);
    expect(clock.now(0)).toBe(1000);
    expect(clock.now(500)).toBe(1500);
    clock.observe(2000, 1000);
    expect(clock.now(1000)).toBe(2000);
    expect(clock.now(1500)).toBe(2500);
  });

  it("recomputes a deadline after a frozen tab", () => {
    const clock = new ServerClock();
    clock.observe(1000, 0);
    const deadline = 1000 + 60000;
    expect(clock.remaining(deadline, 0)).toBe(60000);
    // 60 s frozen, then resumed: prediction advances with monotonic time.
    expect(clock.remaining(deadline, 60000)).toBe(0);
  });

  it("resets to local time when unsynced", () => {
    const clock = new ServerClock();
    clock.observe(5000, 0);
    clock.reset();
    expect(clock.now()).toBeCloseTo(Date.now(), -2);
  });
});
