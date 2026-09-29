import { describe, it, expect } from "vitest";
import { applyExercise, createRoom } from "./exercise";
import { sessionFromSearch, stationUrl } from "./session";
import { createPatient, vitalsOf } from "./patient";
describe("exercise room", () => {
  it("injects patient kinds and freeze", () => {
    const room = createRoom("t");
    const desat = applyExercise(room, { type: "inject", kind: "desat" });
    expect(desat.patient.kind).toBe("desat");
    expect(applyExercise(desat, { type: "inject", kind: "freeze" }).frozen).toBe(
      true,
    );
  });
  it("parses trainer and element urls", () => {
    expect(sessionFromSearch("?role=trainer&room=alpha").role).toBe("trainer");
    expect(sessionFromSearch("?role=element&station=med-1").station).toBe(
      "med-1",
    );
    expect(sessionFromSearch("").role).toBe("film");
    expect(stationUrl("http://x", "r", "element", "med-1")).toContain(
      "role=element",
    );
  });
  it("keeps vitals finite and arrest at zero pulse", () => {
    const p = createPatient();
    const s = vitalsOf(p, 4, 2048);
    expect(s.hr).toBeGreaterThan(50);
    expect(
      vitalsOf({ ...p, kind: "arrest" }, 4, 2048).hr,
    ).toBe(0);
  });
});
