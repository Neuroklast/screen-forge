import { describe, it, expect } from "vitest";
import {
  advance,
  evaluate,
  newState,
  projectState,
  scenarioSchema,
  template,
  dueAt,
  distance,
} from "./training";
import { sessionFromSearch, stationUrl } from "./session";
import { createPatient, ecgPath, vitalsOf } from "./patient";
describe("exercise runtime", () => {
  it("uses server elapsed time, freezes and fires a timer exactly once", () => {
    const s = newState("test");
    advance(s, 1);
    expect(s.clock).toBe(0);
    s.frozen = false;
    s.clock = 179;
    advance(s, 1);
    expect(s.scenario.patients[0].kind).toBe("desat");
    expect(s.fired).toEqual(["rule-1"]);
    const logSize = s.log.length;
    advance(s, 1);
    expect(s.log).toHaveLength(logSize);
  });
  it("does not deteriorate after the configured intervention", () => {
    const s = newState("test");
    s.frozen = false;
    s.clock = 180;
    s.interventions["med-1"] = ["treated"];
    evaluate(s);
    expect(s.scenario.patients[0].kind).toBe("stable");
    expect(s.fired).toContain("rule-1");
  });
  it("does not leak rules, codes or unreleased dossiers", () => {
    const s = newState("test");
    const hq = projectState(s, "hq");
    expect(hq.scenario.rules).toEqual([]);
    expect(hq.scenario.stations.every((st) => !st.code)).toBe(true);
    const field = projectState(s, "element", "med-1");
    expect(field.scenario.patients).toHaveLength(1);
    expect(field.log).toEqual([]);
    expect(s.scenario.stations.find((st) => st.id === "prop-1")?.code).toBe(
      "7392",
    );
  });
  it("validates bindings and physically inconsistent overrides", () => {
    const s = template("sar");
    s.stations[1].entityId = "missing";
    expect(scenarioSchema.safeParse(s).success).toBe(false);
    s.stations[1].entityId = "patient-1";
    s.patients[0].overrides = { sys: 80, dia: 100 };
    expect(scenarioSchema.safeParse(s).success).toBe(false);
  });
  it("requires fresh, accurate positions in a zone", () => {
    const s = newState("test");
    s.frozen = false;
    const r = s.scenario.rules[0];
    Object.assign(r, {
      trigger: "zone",
      station: "player-1",
      zone: "zone-1",
      unless: "",
    });
    const z = s.scenario.zones[0];
    s.positions["player-1"] = {
      ...z,
      accuracy: 150,
      timestamp: 100000,
      received: 100000,
    };
    evaluate(s, { type: "zone", station: "player-1" }, 100000);
    expect(s.fired).toEqual([]);
    s.positions["player-1"].accuracy = 5;
    evaluate(s, { type: "zone", station: "player-1" }, 120000);
    expect(s.fired).toEqual([]);
    evaluate(s, { type: "zone", station: "player-1" }, 100000);
    expect(s.fired).toContain(r.id);
  });
  it("replays identical routes and random event times from the same seed", () => {
    const a = newState("a", template("film")),
      b = newState("b", template("film"));
    a.frozen = b.frozen = false;
    advance(a, 1, 1000);
    advance(b, 1, 1000);
    expect(a.positions).toEqual(b.positions);
    expect(dueAt(a.scenario.rules[0], 2048)).toBe(
      dueAt(b.scenario.rules[0], 2048),
    );
    expect(distance({ lat: 0, lng: 0 }, { lat: 0, lng: 0 })).toBe(0);
  });
  it("keeps session parsing explicit and heart traces tied to pulse", () => {
    expect(sessionFromSearch("?role=trainer").role).toBe("trainer");
    expect(sessionFromSearch("").role).toBe("film");
    expect(stationUrl("http://x", "r", "element", "med-1")).toContain(
      "station=med-1",
    );
    expect(vitalsOf(createPatient(), 4, 2048).hr).toBeGreaterThan(50);
    expect(ecgPath("stable", 1, 60)).not.toEqual(ecgPath("stable", 1, 120));
    expect(ecgPath("arrest", 1, 0)).not.toContain("NaN");
  });
});
