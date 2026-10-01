import { workflowSchema, type Workflow } from "../../workflow.ts";
import { factString } from "../facts.ts";
import { generatedId, makeSuggestionId } from "../meta.ts";
import type {
  DomainPack,
  GeneratedMeta,
  GuidedQuestion,
  GuidedRule,
  ScenarioOperation,
  Suggestion,
} from "../types.ts";

// Minimal medical pack. It proves that packs compose: enabled next to SAR it
// contributes patient handling without touching SAR's generated content.
const RULE_PATIENT = "med-patient";
const RULE_CLARITY = "med-clarity";

function meta(ruleId: string, subjectKey: string): GeneratedMeta {
  return { source: "guided", ruleId, subjectKey, userModified: false };
}

const questions: GuidedQuestion[] = [
  {
    id: "q.med.arrival",
    domain: "medical",
    group: "med.arrival",
    labelKey: "guided.med.arrival.label",
    priority: "structural",
    dependsOn: [],
    appliesWhen: () => true,
    options: [
      {
        id: "present",
        labelKey: "guided.med.arrival.present",
        effects: [{ fact: "med.arrival", value: "present" }],
      },
      {
        id: "found",
        labelKey: "guided.med.arrival.found",
        effects: [{ fact: "med.arrival", value: "found" }],
      },
      {
        id: "later",
        labelKey: "guided.med.arrival.later",
        effects: [{ fact: "med.arrival", value: "later" }],
      },
      {
        id: "event",
        labelKey: "guided.med.arrival.event",
        effects: [{ fact: "med.arrival", value: "event" }],
      },
    ],
  },
  {
    id: "q.med.clarity",
    domain: "medical",
    group: "med.clarity",
    labelKey: "guided.med.clarity.label",
    priority: "useful",
    dependsOn: ["med.arrival"],
    appliesWhen: (facts) => factString(facts, "med.arrival") !== undefined,
    options: [
      {
        id: "clear",
        labelKey: "guided.med.clarity.clear",
        effects: [{ fact: "med.clarity", value: "clear" }],
      },
      {
        id: "partial",
        labelKey: "guided.med.clarity.partial",
        effects: [{ fact: "med.clarity", value: "partial" }],
      },
      {
        id: "none",
        labelKey: "guided.med.clarity.none",
        effects: [{ fact: "med.clarity", value: "none" }],
      },
    ],
  },
  {
    id: "q.med.treatment",
    domain: "medical",
    group: "med.treatment",
    labelKey: "guided.med.treatment.label",
    priority: "structural",
    dependsOn: ["med.arrival"],
    appliesWhen: (facts) => factString(facts, "med.arrival") !== undefined,
    options: [
      {
        id: "basic",
        labelKey: "guided.med.treatment.basic",
        effects: [{ fact: "med.treatment", value: "basic" }],
      },
      {
        id: "advanced",
        labelKey: "guided.med.treatment.advanced",
        effects: [{ fact: "med.treatment", value: "advanced" }],
      },
    ],
  },
];

function patientFlow(stationId: string, objectiveId: string): Workflow {
  const origin = meta(RULE_PATIENT, "main");
  return workflowSchema.parse({
    id: generatedId(RULE_PATIENT, "main", "flow"),
    version: 1,
    name: "Assess and treat patient",
    trigger: { type: "manual" },
    entry: "start",
    nodes: [
      { id: "start", name: "Start", type: "start", position: { x: 0, y: 120 }, origin },
      {
        id: "surface",
        name: "Treatment console",
        type: "show-surface",
        station: stationId,
        surface: "console",
        position: { x: 240, y: 120 },
        origin,
      },
      {
        id: "assessed",
        name: "Patient assessed?",
        type: "task",
        task: "confirm",
        config: { prompt: "Patient assessed?" },
        position: { x: 480, y: 120 },
        origin,
      },
      {
        id: "done",
        name: "Objective complete",
        type: "complete-objective",
        objective: objectiveId,
        position: { x: 720, y: 120 },
        origin,
      },
      { id: "end", name: "End", type: "end", outcome: "success", position: { x: 960, y: 120 }, origin },
      { id: "retry", name: "Retry delay", type: "delay", seconds: 30, position: { x: 480, y: 320 }, origin },
    ],
    edges: [
      { id: "e1", source: "start", output: "out", target: "surface" },
      { id: "e2", source: "surface", output: "out", target: "assessed" },
      { id: "e3", source: "assessed", output: "success", target: "done" },
      { id: "e4", source: "assessed", output: "failure", target: "retry" },
      { id: "e5", source: "retry", output: "out", target: "assessed" },
      { id: "e6", source: "done", output: "out", target: "end" },
    ],
    variables: [],
    origin,
  });
}

const patient: GuidedRule = {
  id: RULE_PATIENT,
  domain: "medical",
  dependsOn: ["med.arrival", "med.treatment"],
  evaluate(ctx): Suggestion[] {
    const arrival = factString(ctx.facts, "med.arrival");
    if (!arrival) return [];
    const treatment = factString(ctx.facts, "med.treatment") ?? "basic";
    const subject = "main";
    const patientId = generatedId(RULE_PATIENT, subject, "patient");
    const stationId = generatedId(RULE_PATIENT, subject, "station");
    const objectiveId = generatedId(RULE_PATIENT, subject, "objective");
    const origin = meta(RULE_PATIENT, subject);
    const operations: ScenarioOperation[] = [
      {
        op: "add-patient",
        patient: {
          id: patientId,
          name: "Patient 01",
          kind: arrival === "event" ? "trauma" : "stable",
          since: 0,
          origin,
        },
      },
      {
        op: "add-station",
        station: {
          id: stationId,
          name: "Medic 01",
          role: "element",
          module: "medical",
          bindings: { patient: patientId, prop: "", objective: "" },
          origin,
        },
      },
      {
        op: "add-objective",
        objective: {
          id: objectiveId,
          name: "Assess and treat patient",
          origin,
        },
      },
      { op: "add-workflow", workflow: patientFlow(stationId, objectiveId) },
    ];
    if (arrival === "later")
      operations.push({
        op: "add-event",
        inject: {
          id: generatedId(RULE_PATIENT, subject, "arrival"),
          name: "Patient arriving",
          trigger: "timer",
          at: 120,
          actions: [{ type: "message", text: "Patient arriving" }],
          category: "inject",
          purpose: "Announce the arriving patient",
          expectedOutcome: ["patient.arriving"],
          origin,
        },
      });
    if (arrival === "event")
      operations.push({
        op: "add-event",
        inject: {
          id: generatedId(RULE_PATIENT, subject, "onset"),
          name: "Patient condition onset",
          trigger: "timer",
          at: 120,
          actions: [
            { type: "message", text: "New patient reported" },
            { type: "patient", target: patientId, kind: "trauma" },
          ],
          category: "contingency",
          purpose: "Trigger the patient condition",
          expectedOutcome: ["patient.assessed"],
          origin,
        },
      });
    return [
      {
        id: makeSuggestionId(RULE_PATIENT, subject, { arrival, treatment }),
        ruleId: RULE_PATIENT,
        subjectKey: subject,
        reason: { key: "guided.reason.med-patient", params: { arrival } },
        operations,
      },
    ];
  },
};

const clarity: GuidedRule = {
  id: RULE_CLARITY,
  domain: "medical",
  dependsOn: ["med.clarity"],
  evaluate(ctx): Suggestion[] {
    if (factString(ctx.facts, "med.clarity") !== "none") return [];
    const subject = "main";
    return [
      {
        id: makeSuggestionId(RULE_CLARITY, subject, { clarity: "none" }),
        ruleId: RULE_CLARITY,
        subjectKey: subject,
        reason: { key: "guided.reason.med-clarity" },
        operations: [
          {
            op: "add-event",
            inject: {
              id: generatedId(RULE_CLARITY, subject, "event"),
              name: "Situation unclear",
              trigger: "timer",
              at: 90,
              actions: [
                { type: "message", text: "Situation reports contradict" },
              ],
              category: "inject",
              purpose: "Train assessment under incomplete information",
              expectedOutcome: ["information.requested"],
              origin: meta(RULE_CLARITY, subject),
            },
          },
        ],
      },
    ];
  },
};

// Medical scenarios disable the `teams` capability, so the organization step is
// deliberately not wired in here (a team would be invisible in the workspace).
export const medicalPack: DomainPack = {
  id: "medical",
  token: "med",
  scenarioType: "medical",
  questions,
  rules: [patient, clarity],
};
