import { describe, expect, it } from "vitest";
import { applyEvent, domainEventSchema, type DomainEvent } from "./events";
import { newState, template } from "./training";

const scenario = template("sar");

describe("domain events", () => {
  it("validates event shapes", () => {
    expect(
      domainEventSchema.safeParse({ type: "exercise.aborted", by: "safety" })
        .success,
    ).toBe(true);
    expect(
      domainEventSchema.safeParse({ type: "inject.fired", inject: "rule-1" })
        .success,
    ).toBe(true);
    expect(domainEventSchema.safeParse({ type: "nope" }).success).toBe(false);
  });

  it("records module events per station for authoritative replay", () => {
    const s = newState("room", scenario);
    applyEvent(s, {
      type: "module.event",
      station: "files-1",
      value: "shell.success",
    });
    applyEvent(s, {
      type: "module.event",
      station: "files-1",
      value: "shell.success",
    });
    expect(s.moduleEvents["files-1"]).toEqual(["shell.success"]);
  });

  it("separates a suppressed inject from a fired one", () => {
    const s = newState("room", scenario);
    // `rule-1` carries `unless: "treated"`; report the treatment first.
    applyEvent(s, {
      type: "intervention.reported",
      station: "med-1",
      value: "treated",
    });
    applyEvent(s, { type: "inject.fired", inject: "rule-1" });
    expect(s.fired).toContain("rule-1");
    expect(s.skipped).toContain("rule-1");
    expect(s.log.at(-1)?.message).toContain("Skipped");
  });

  it("replays the same event log to identical state", () => {
    const events: DomainEvent[] = [
      { type: "scenario.saved", scenario },
      { type: "exercise.transport", command: "play" },
      { type: "inject.fired", inject: "rule-1" },
      { type: "note.added", role: "assessor", text: "ok" },
      { type: "message.posted", from: "excon", to: "all", text: "hi" },
      { type: "exercise.aborted", by: "safety" },
    ];
    const a = newState("room", scenario);
    const b = newState("room", scenario);
    for (const e of events) applyEvent(a, e);
    for (const e of events) applyEvent(b, e);
    expect(a).toEqual(b);
    expect(a.phase).toBe("aborted");
    expect(a.frozen).toBe(true);
    expect(a.fired).toContain("rule-1");
    expect(a.notes.length).toBe(1);
    expect(a.messages.length).toBe(1);
  });
});
