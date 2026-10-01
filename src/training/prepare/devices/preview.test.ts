import { describe, expect, it } from "vitest";
import { blankScenario, stationSchema } from "../../../core/training";
import { devicePresets } from "../devicePresets";
import { addDevice } from "./commands";
import {
  previewCue,
  previewExercise,
  previewStates,
  previewTrainingState,
} from "./preview";

const terminal = devicePresets.find((row) => row.id === "terminal")!;

describe("preview sandbox", () => {
  it("maps every preview state to a renderer cue", () => {
    expect(previewStates).toHaveLength(5);
    expect(previewCue("warning")).toBe("warning");
    expect(previewCue("critical")).toBe("warning");
    expect(previewCue("safe")).toBe("complete");
    expect(previewCue("normal")).toBe("idle");
    expect(previewCue("offline")).toBe("idle");
  });

  it("derives the state from the draft without mutating it", () => {
    const { scenario, id } = addDevice(
      blankScenario("custom"),
      terminal,
      "scenario",
    );
    const before = structuredClone(scenario);
    const state = previewTrainingState(scenario, id, "offline");
    expect(scenario).toEqual(before);
    expect(state.scenario).toBe(scenario);
    expect(state.frozen).toBe(true);
    expect(state.presence[id].online).toBe(false);
    expect(state.workflows).toEqual({});
  });

  it("seeds safe and critical cues from the preview state", () => {
    const { scenario, id } = addDevice(
      blankScenario("custom"),
      terminal,
      "scenario",
    );
    expect(previewTrainingState(scenario, id, "safe").moduleEvents[id]).toEqual([
      "preview.safe",
    ]);
    const station = stationSchema.parse({
      id: "ord",
      name: "Ordnance",
      role: "element",
      module: "ordnance",
      bindings: { prop: "prop-1" },
    });
    const withProp = {
      ...scenario,
      stations: [...scenario.stations, station],
      props: [
        {
          id: "prop-1",
          kind: "ordnance" as const,
          name: "Prop",
          states: ["armed", "tampered"],
          initial: "armed",
          visible: true,
          ordnanceId: "",
        },
      ],
    };
    expect(
      previewTrainingState(withProp, "ord", "critical").propStates["prop-1"],
    ).toBe("tampered");
  });

  it("exposes an inert exercise value", () => {
    const { scenario, id } = addDevice(
      blankScenario("custom"),
      terminal,
      "scenario",
    );
    const value = previewExercise(
      previewTrainingState(scenario, id, "normal"),
      id,
    );
    expect(value.send({ type: "abort" })).toBe(false);
    expect(value.online).toBe(true);
    expect(value.room).toBe("preview");
  });
});
