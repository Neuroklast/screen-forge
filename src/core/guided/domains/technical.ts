import { workflowSchema, type Workflow } from "../../workflow.ts";
import { factString } from "../facts.ts";
import { generatedId, makeSuggestionId } from "../meta.ts";
import { withOrganization } from "./organization.ts";
import type {
  DomainPack,
  GeneratedMeta,
  GuidedQuestion,
  GuidedRule,
  ScenarioOperation,
  Suggestion,
} from "../types.ts";

// Technical incident pack: diagnose and fix a fault, with optional access work.
const RULE_DIAGNOSE = "tech-diagnose";
const RULE_ACCESS = "tech-access";
const RULE_ESCALATE = "tech-escalate";

function meta(ruleId: string, subjectKey: string): GeneratedMeta {
  return { source: "guided", ruleId, subjectKey, userModified: false };
}

const questions: GuidedQuestion[] = [
  {
    id: "q.tech.cause",
    domain: "technical",
    group: "tech.cause",
    labelKey: "guided.tech.cause.label",
    priority: "structural",
    dependsOn: [],
    appliesWhen: () => true,
    options: [
      {
        id: "yes",
        labelKey: "guided.tech.cause.yes",
        effects: [{ fact: "tech.causeKnown", value: "yes" }],
      },
      {
        id: "partial",
        labelKey: "guided.tech.cause.partial",
        effects: [{ fact: "tech.causeKnown", value: "partial" }],
      },
      {
        id: "no",
        labelKey: "guided.tech.cause.no",
        effects: [{ fact: "tech.causeKnown", value: "no" }],
      },
    ],
  },
  {
    id: "q.tech.access",
    domain: "technical",
    group: "tech.access",
    labelKey: "guided.tech.access.label",
    priority: "structural",
    dependsOn: [],
    appliesWhen: () => true,
    options: [
      {
        id: "direct",
        labelKey: "guided.tech.access.direct",
        effects: [{ fact: "tech.access", value: "direct" }],
      },
      {
        id: "remote",
        labelKey: "guided.tech.access.remote",
        effects: [{ fact: "tech.access", value: "remote" }],
      },
      {
        id: "locked",
        labelKey: "guided.tech.access.locked",
        effects: [{ fact: "tech.access", value: "locked" }],
      },
    ],
  },
  {
    id: "q.tech.failure",
    domain: "technical",
    group: "tech.failure",
    labelKey: "guided.tech.failure.label",
    priority: "structural",
    dependsOn: ["tech.causeKnown"],
    appliesWhen: (facts) => factString(facts, "tech.causeKnown") !== undefined,
    options: [
      {
        id: "retry",
        labelKey: "guided.tech.failure.retry",
        effects: [{ fact: "tech.failureMode", value: "retry" }],
      },
      {
        id: "escalate",
        labelKey: "guided.tech.failure.escalate",
        effects: [{ fact: "tech.failureMode", value: "escalate" }],
      },
      {
        id: "abort",
        labelKey: "guided.tech.failure.abort",
        effects: [{ fact: "tech.failureMode", value: "abort" }],
      },
    ],
  },
];

function diagnoseFlow(
  failureMode: string,
  stationId: string,
  objectiveId: string,
): Workflow {
  const origin = meta(RULE_DIAGNOSE, "main");
  const nodes: Workflow["nodes"] = [
    { id: "start", name: "Start", type: "start", position: { x: 0, y: 120 }, origin },
    {
      id: "surface",
      name: "Diagnostics console",
      type: "show-surface",
      station: stationId,
      surface: "console",
      position: { x: 240, y: 120 },
      origin,
    },
    {
      id: "read",
      name: "Read subsystem readings",
      type: "task",
      task: "inspect",
      config: {
        prompt: "Read the subsystem readings",
        lines: ["CONTROL: DEGRADED", "RELAY: STANDBY"],
      },
      position: { x: 480, y: 120 },
      origin,
    },
    {
      id: "isolate",
      name: "Fault isolated?",
      type: "task",
      task: "confirm",
      config: { prompt: "Fault isolated?" },
      position: { x: 720, y: 120 },
      origin,
    },
    {
      id: "done",
      name: "Objective complete",
      type: "complete-objective",
      objective: objectiveId,
      position: { x: 960, y: 120 },
      origin,
    },
    { id: "end", name: "End", type: "end", outcome: "success", position: { x: 1200, y: 120 }, origin },
  ];
  const edges: Workflow["edges"] = [
    { id: "e1", source: "start", output: "out", target: "surface" },
    { id: "e2", source: "surface", output: "out", target: "read" },
    { id: "e3", source: "read", output: "success", target: "isolate" },
    { id: "e4", source: "isolate", output: "success", target: "done" },
    { id: "e5", source: "done", output: "out", target: "end" },
  ];
  if (failureMode === "retry") {
    nodes.push({
      id: "retry",
      name: "Retry delay",
      type: "delay",
      seconds: 30,
      position: { x: 720, y: 320 },
      origin,
    });
    edges.push(
      { id: "e6", source: "isolate", output: "failure", target: "retry" },
      { id: "e7", source: "retry", output: "out", target: "isolate" },
    );
  } else {
    nodes.push({
      id: "end-fail",
      name: "Not isolated",
      type: "end",
      outcome: "failure",
      position: { x: 960, y: 320 },
      origin,
    });
    edges.push({
      id: "e6",
      source: "isolate",
      output: "failure",
      target: "end-fail",
    });
  }
  return workflowSchema.parse({
    id: generatedId(RULE_DIAGNOSE, "main", "flow"),
    version: 1,
    name: "Diagnose fault",
    trigger: { type: "manual" },
    entry: "start",
    nodes,
    edges,
    variables: [],
    origin,
  });
}

const diagnose: GuidedRule = {
  id: RULE_DIAGNOSE,
  domain: "technical",
  dependsOn: ["tech.causeKnown", "tech.failureMode"],
  evaluate(ctx): Suggestion[] {
    const cause = factString(ctx.facts, "tech.causeKnown");
    if (!cause) return [];
    const failureMode = factString(ctx.facts, "tech.failureMode") ?? "retry";
    const subject = "main";
    const stationId = generatedId(RULE_DIAGNOSE, subject, "station");
    const objectiveId = generatedId(RULE_DIAGNOSE, subject, "objective");
    return [
      {
        id: makeSuggestionId(RULE_DIAGNOSE, subject, { cause, failureMode }),
        ruleId: RULE_DIAGNOSE,
        subjectKey: subject,
        reason: { key: "guided.reason.tech-diagnose", params: { cause } },
        operations: [
          {
            op: "add-station",
            station: {
              id: stationId,
              name: "Technician 01",
              role: "element",
              module: "terminal",
              origin: meta(RULE_DIAGNOSE, subject),
            },
          },
          {
            op: "add-objective",
            objective: {
              id: objectiveId,
              name: "Diagnose and fix the fault",
              origin: meta(RULE_DIAGNOSE, subject),
            },
          },
          {
            op: "add-workflow",
            workflow: diagnoseFlow(failureMode, stationId, objectiveId),
          },
        ],
      },
    ];
  },
};

const access: GuidedRule = {
  id: RULE_ACCESS,
  domain: "technical",
  dependsOn: ["tech.access"],
  evaluate(ctx): Suggestion[] {
    if (factString(ctx.facts, "tech.access") !== "locked") return [];
    const subject = "main";
    const propId = generatedId(RULE_ACCESS, subject, "keycard");
    return [
      {
        id: makeSuggestionId(RULE_ACCESS, subject, { access: "locked" }),
        ruleId: RULE_ACCESS,
        subjectKey: subject,
        reason: { key: "guided.reason.tech-access" },
        operations: [
          {
            op: "add-prop",
            prop: {
              id: propId,
              kind: "keycard",
              name: "Access keycard",
              states: ["locked", "unlocked"],
              initial: "locked",
              origin: meta(RULE_ACCESS, subject),
            },
          },
          {
            op: "add-station",
            station: {
              id: generatedId(RULE_ACCESS, subject, "access"),
              name: "Access panel",
              role: "element",
              module: "access",
              bindings: { patient: "", prop: propId, objective: "" },
              origin: meta(RULE_ACCESS, subject),
            },
          },
        ],
      },
    ];
  },
};

const escalate: GuidedRule = {
  id: RULE_ESCALATE,
  domain: "technical",
  dependsOn: ["tech.failureMode"],
  evaluate(ctx): Suggestion[] {
    const failureMode = factString(ctx.facts, "tech.failureMode");
    if (failureMode !== "escalate" && failureMode !== "abort") return [];
    const subject = "main";
    return [
      {
        id: makeSuggestionId(RULE_ESCALATE, subject, { failureMode }),
        ruleId: RULE_ESCALATE,
        subjectKey: subject,
        reason: { key: "guided.reason.tech-escalate" },
        operations: [
          {
            op: "add-event",
            inject: {
              id: generatedId(RULE_ESCALATE, subject, "event"),
              name:
                failureMode === "escalate"
                  ? "Escalation requested"
                  : "Fault not fixed",
              trigger: "timer",
              at: 300,
              actions: [
                {
                  type: "message",
                  text:
                    failureMode === "escalate"
                      ? "Escalation requested"
                      : "Fault not fixed",
                },
              ],
              category: "contingency",
              purpose: "Report the technical status to command",
              expectedOutcome: ["fault.reported"],
              origin: meta(RULE_ESCALATE, subject),
            },
          },
        ],
      },
    ];
  },
};

export const technicalPack: DomainPack = withOrganization({
  id: "technical",
  token: "tech",
  scenarioType: "technical",
  questions,
  rules: [diagnose, access, escalate],
});
