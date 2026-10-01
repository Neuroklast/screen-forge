import { describe, expect, it } from "vitest";
import { setLocale } from "../../i18n";
import { blankScenario, injectSchema } from "../training";
import { createWorkflow } from "../workflowEdit";
import { term, termPhrase } from "./index";
import { setDensity, setTerminology } from "./settings";

// Switching language, terminology or density must never touch scenario or
// workflow state; it only changes rendered labels.
describe("terminology isolation", () => {
  it("never mutates scenario or workflow data when settings change", () => {
    const scenario = blankScenario("custom");
    scenario.name = "Relay";
    scenario.workflows = [createWorkflow("wf-1")];
    scenario.injects = [
      injectSchema.parse({
        id: "event-1",
        name: "Checkpoint",
        trigger: "timer",
        at: 60,
        actions: [{ type: "message", text: "Stand by" }],
      }),
    ];
    const before = JSON.stringify(scenario);
    const workflowBefore = JSON.stringify(scenario.workflows[0]);

    setLocale("en");
    setTerminology("general");
    setDensity("simple");
    term("mission");
    termPhrase("comms.lastReport", { time: "10:42" });

    setLocale("de");
    setTerminology("military");
    setDensity("full");
    term("mission");
    term("exercise_control");
    term("common_operational_picture", { form: "acronym" });
    termPhrase("force.ready", { callsign: "ALPHA" });

    expect(JSON.stringify(scenario)).toBe(before);
    expect(JSON.stringify(scenario.workflows[0])).toBe(workflowBefore);
  });
});
