import { describe, expect, it } from "vitest";
import { applyEvent } from "./events";
import { newState, template } from "./training";
import { buildTimeline, timelineCsv } from "./timeline";

describe("timeline", () => {
  it("separates planned, rescheduled and actual times", () => {
    const state = newState("room", template("sar"));
    const inject = state.scenario.injects[0];
    applyEvent(state, {
      type: "msel.rescheduled",
      inject: inject.id,
      from: inject.at,
      to: 30,
      reason: "earlier",
    });
    applyEvent(state, { type: "exercise.transport", command: "play" });
    const entries = buildTimeline(state);
    expect(entries.some((e) => e.kind === "planned" && e.at === inject.at)).toBe(
      true,
    );
    expect(entries.some((e) => e.kind === "rescheduled" && e.to === 30)).toBe(
      true,
    );
    expect(entries.some((e) => e.kind === "actual")).toBe(true);
  });

  it("exports a CSV with escaped labels", () => {
    const csv = timelineCsv([
      { at: 0, kind: "actual", label: 'a "quoted" event' },
    ]);
    expect(csv).toContain('"a ""quoted"" event"');
    expect(csv.split("\n").length).toBe(2);
  });
});
