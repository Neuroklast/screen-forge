import { describe, expect, it } from "vitest";
import { resolvePhrase } from "./resolve";

describe("phrase resolution", () => {
  it("interpolates parameters per profile", () => {
    expect(
      resolvePhrase("comms.lastReport", "en-professional", { time: "10:42" }),
    ).toBe("Last report 10:42");
    expect(
      resolvePhrase("comms.lastReport", "de-bundeswehr", { time: "10:42" }),
    ).toBe("Letzte Meldung 10:42");
    expect(
      resolvePhrase("force.ready", "de-bundeswehr", { callsign: "ALPHA" }),
    ).toBe("ALPHA / EINSATZBEREIT");
  });

  it("keeps an unknown parameter placeholder visible", () => {
    expect(resolvePhrase("comms.lastReport", "en-professional")).toBe(
      "Last report {time}",
    );
  });

  it("falls back safely for unknown phrases", () => {
    expect(resolvePhrase("no.such.phrase", "de-bundeswehr")).toBe(
      "No such phrase",
    );
  });
});
