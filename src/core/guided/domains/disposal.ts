import { workflowSchema, type Workflow } from "../../workflow.ts";
import { factBoolean, factString } from "../facts.ts";
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

// Disposal pack: fictional assembly, cordon and a staged neutralisation flow.
const RULE_SETUP = "eod-setup";
const RULE_CORDON = "eod-cordon";
const RULE_CONSEQUENCE = "eod-consequence";

function meta(ruleId: string, subjectKey: string): GeneratedMeta {
  return { source: "guided", ruleId, subjectKey, userModified: false };
}

const questions: GuidedQuestion[] = [
  {
    id: "q.eod.assembly",
    domain: "disposal",
    group: "eod.assembly",
    labelKey: "guided.eod.assembly.label",
    priority: "structural",
    dependsOn: [],
    appliesWhen: () => true,
    options: [
      {
        id: "armed",
        labelKey: "guided.eod.assembly.armed",
        effects: [{ fact: "eod.assembly", value: "armed" }],
      },
      {
        id: "identified",
        labelKey: "guided.eod.assembly.identified",
        effects: [{ fact: "eod.assembly", value: "identified" }],
      },
      {
        id: "unclear",
        labelKey: "guided.eod.assembly.unclear",
        effects: [{ fact: "eod.assembly", value: "unclear" }],
      },
    ],
  },
  {
    id: "q.eod.access",
    domain: "disposal",
    group: "eod.access",
    labelKey: "guided.eod.access.label",
    priority: "structural",
    dependsOn: [],
    appliesWhen: () => true,
    options: [
      {
        id: "yes",
        labelKey: "guided.eod.access.yes",
        effects: [{ fact: "eod.accessSecured", value: true }],
      },
      {
        id: "no",
        labelKey: "guided.eod.access.no",
        effects: [{ fact: "eod.accessSecured", value: false }],
      },
    ],
  },
  {
    id: "q.eod.failure",
    domain: "disposal",
    group: "eod.failure",
    labelKey: "guided.eod.failure.label",
    priority: "structural",
    dependsOn: ["eod.assembly"],
    appliesWhen: (facts) => factString(facts, "eod.assembly") !== undefined,
    options: [
      {
        id: "retry",
        labelKey: "guided.eod.failure.retry",
        effects: [{ fact: "eod.failureMode", value: "retry" }],
      },
      {
        id: "consequence",
        labelKey: "guided.eod.failure.consequence",
        effects: [{ fact: "eod.failureMode", value: "consequence" }],
      },
      {
        id: "abort",
        labelKey: "guided.eod.failure.abort",
        effects: [{ fact: "eod.failureMode", value: "abort" }],
      },
    ],
  },
];

function setupFlow(
  failureMode: string,
  stationId: string,
  propId: string,
  objectiveId: string,
): Workflow {
  const origin = meta(RULE_SETUP, "main");
  const nodes: Workflow["nodes"] = [
    { id: "start", name: "Start", type: "start", position: { x: 0, y: 120 }, origin },
    {
      id: "surface",
      name: "Console",
      type: "show-surface",
      station: stationId,
      surface: "console",
      position: { x: 240, y: 120 },
      origin,
    },
    {
      id: "read",
      name: "Read datasheet",
      type: "task",
      task: "datasheet",
      config: { subject: "countdown", title: "Assembly datasheet" },
      position: { x: 480, y: 120 },
      origin,
    },
    {
      id: "confirm",
      name: "Assembly disarmed?",
      type: "task",
      task: "confirm",
      config: { prompt: "Assembly disarmed?" },
      position: { x: 720, y: 120 },
      origin,
    },
    {
      id: "disarm",
      name: "Mark disarmed",
      type: "set-prop-state",
      prop: propId,
      state: "disarmed",
      position: { x: 960, y: 120 },
      origin,
    },
    {
      id: "done",
      name: "Objective complete",
      type: "complete-objective",
      objective: objectiveId,
      position: { x: 1200, y: 120 },
      origin,
    },
    { id: "end", name: "End", type: "end", outcome: "success", position: { x: 1440, y: 120 }, origin },
  ];
  const edges: Workflow["edges"] = [
    { id: "e1", source: "start", output: "out", target: "surface" },
    { id: "e2", source: "surface", output: "out", target: "read" },
    { id: "e3", source: "read", output: "success", target: "confirm" },
    { id: "e4", source: "confirm", output: "success", target: "disarm" },
    { id: "e5", source: "disarm", output: "out", target: "done" },
    { id: "e6", source: "done", output: "out", target: "end" },
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
      { id: "e7", source: "confirm", output: "failure", target: "retry" },
      { id: "e8", source: "retry", output: "out", target: "confirm" },
    );
  } else if (failureMode === "consequence") {
    nodes.push(
      {
        id: "report",
        name: "Consequence report",
        type: "task",
        task: "report",
        config: {
          prompt: "Report the consequence",
          fields: [{ id: "status", label: "Status" }],
        },
        position: { x: 720, y: 320 },
        origin,
      },
      {
        id: "end-fail",
        name: "Not disarmed",
        type: "end",
        outcome: "failure",
        position: { x: 960, y: 320 },
        origin,
      },
    );
    edges.push(
      { id: "e7", source: "confirm", output: "failure", target: "report" },
      { id: "e8", source: "report", output: "success", target: "end-fail" },
    );
  } else {
    nodes.push({
      id: "end-fail",
      name: "Not disarmed",
      type: "end",
      outcome: "failure",
      position: { x: 960, y: 320 },
      origin,
    });
    edges.push({
      id: "e7",
      source: "confirm",
      output: "failure",
      target: "end-fail",
    });
  }
  return workflowSchema.parse({
    id: generatedId(RULE_SETUP, "main", "flow"),
    version: 1,
    name: "Neutralise assembly",
    trigger: { type: "manual" },
    entry: "start",
    nodes,
    edges,
    variables: [],
    origin,
  });
}

const setup: GuidedRule = {
  id: RULE_SETUP,
  domain: "disposal",
  dependsOn: ["eod.assembly", "eod.failureMode"],
  evaluate(ctx): Suggestion[] {
    const assembly = factString(ctx.facts, "eod.assembly");
    if (!assembly) return [];
    const failureMode = factString(ctx.facts, "eod.failureMode") ?? "retry";
    const subject = "main";
    const propId = generatedId(RULE_SETUP, subject, "assembly");
    const stationId = generatedId(RULE_SETUP, subject, "console");
    const objectiveId = generatedId(RULE_SETUP, subject, "objective");
    const origin = meta(RULE_SETUP, subject);
    return [
      {
        id: makeSuggestionId(RULE_SETUP, subject, { assembly, failureMode }),
        ruleId: RULE_SETUP,
        subjectKey: subject,
        reason: { key: "guided.reason.eod-setup", params: { assembly } },
        operations: [
          {
            op: "add-prop",
            prop: {
              id: propId,
              kind: "ordnance",
              name: "Assembly 01",
              states: ["armed", "bypassed", "disarmed", "tampered"],
              initial: assembly === "unclear" ? "bypassed" : "armed",
              origin,
            },
          },
          {
            op: "add-station",
            station: {
              id: stationId,
              name: "Console 01",
              role: "element",
              module: "ordnance",
              bindings: { patient: "", prop: propId, objective: "" },
              origin,
            },
          },
          {
            op: "add-objective",
            objective: {
              id: objectiveId,
              name: "Neutralise the assembly",
              origin,
            },
          },
          {
            op: "add-workflow",
            workflow: setupFlow(failureMode, stationId, propId, objectiveId),
          },
        ],
      },
    ];
  },
};

const cordon: GuidedRule = {
  id: RULE_CORDON,
  domain: "disposal",
  dependsOn: ["eod.accessSecured"],
  evaluate(ctx): Suggestion[] {
    if (factBoolean(ctx.facts, "eod.accessSecured") !== false) return [];
    const subject = "main";
    return [
      {
        id: makeSuggestionId(RULE_CORDON, subject, { accessSecured: false }),
        ruleId: RULE_CORDON,
        subjectKey: subject,
        reason: { key: "guided.reason.eod-cordon" },
        operations: [
          {
            op: "add-zone",
            zone: {
              id: generatedId(RULE_CORDON, subject, "zone"),
              name: "Cordon",
              lat: 51.23,
              lng: 6.78,
              radius: 150,
              origin: meta(RULE_CORDON, subject),
            },
          },
        ],
      },
    ];
  },
};

const consequence: GuidedRule = {
  id: RULE_CONSEQUENCE,
  domain: "disposal",
  dependsOn: ["eod.failureMode"],
  evaluate(ctx): Suggestion[] {
    if (factString(ctx.facts, "eod.failureMode") !== "consequence") return [];
    const subject = "main";
    return [
      {
        id: makeSuggestionId(RULE_CONSEQUENCE, subject, {
          failureMode: "consequence",
        }),
        ruleId: RULE_CONSEQUENCE,
        subjectKey: subject,
        reason: { key: "guided.reason.eod-consequence" },
        operations: [
          {
            op: "add-event",
            inject: {
              id: generatedId(RULE_CONSEQUENCE, subject, "event"),
              name: "Time window closing",
              trigger: "timer",
              at: 600,
              actions: [{ type: "message", text: "Time window closing" }],
              category: "contingency",
              purpose: "Create time pressure for the decision",
              expectedOutcome: ["decision.requested"],
              origin: meta(RULE_CONSEQUENCE, subject),
            },
          },
        ],
      },
    ];
  },
};

export const disposalPack: DomainPack = withOrganization({
  id: "disposal",
  token: "eod",
  scenarioType: "disposal",
  questions,
  rules: [setup, cordon, consequence],
});
