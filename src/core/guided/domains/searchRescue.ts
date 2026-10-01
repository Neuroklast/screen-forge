import {
  workflowSchema,
  type Workflow,
  type WorkflowEdge,
  type WorkflowNode,
} from "../../workflow.ts";
import { factBoolean, factString } from "../facts.ts";
import { generatedId, makeSuggestionId } from "../meta.ts";
import type {
  DomainPack,
  GeneratedMeta,
  GuidedContext,
  GuidedQuestion,
  GuidedRule,
  ScenarioOperation,
  Suggestion,
} from "../types.ts";

// Search & Rescue pack. All generated mission content is English; question
// labels are German studio chrome resolved through i18n keys.
const RULE_LOCATE = "sar-locate";
const RULE_RECOVER = "sar-recover";
const RULE_SOURCES = "sar-sources";
const RULE_CONDITION = "sar-condition";

const MAP = { lat: 51.23, lng: 6.78 };

function meta(ruleId: string, subjectKey: string): GeneratedMeta {
  return { source: "guided", ruleId, subjectKey, userModified: false };
}

const questions: GuidedQuestion[] = [
  {
    id: "q.sar.target",
    domain: "search-rescue",
    group: "sar.target",
    labelKey: "guided.sar.target.label",
    priority: "structural",
    dependsOn: [],
    appliesWhen: () => true,
    options: [
      {
        id: "person",
        labelKey: "guided.sar.target.person",
        effects: [{ fact: "sar.targetKind", value: "person" }],
      },
      {
        id: "group",
        labelKey: "guided.sar.target.group",
        effects: [{ fact: "sar.targetKind", value: "group" }],
      },
      {
        id: "vehicle",
        labelKey: "guided.sar.target.vehicle",
        effects: [{ fact: "sar.targetKind", value: "vehicle" }],
      },
      {
        id: "object",
        labelKey: "guided.sar.target.object",
        effects: [{ fact: "sar.targetKind", value: "object" }],
      },
    ],
  },
  {
    id: "q.sar.location",
    domain: "search-rescue",
    group: "sar.location",
    labelKey: "guided.sar.location.label",
    priority: "structural",
    dependsOn: [],
    appliesWhen: () => true,
    options: [
      {
        id: "exact",
        labelKey: "guided.sar.location.exact",
        effects: [{ fact: "sar.locationKnowledge", value: "exact" }],
      },
      {
        id: "approximate",
        labelKey: "guided.sar.location.approximate",
        effects: [{ fact: "sar.locationKnowledge", value: "approximate" }],
      },
      {
        id: "unknown",
        labelKey: "guided.sar.location.unknown",
        effects: [{ fact: "sar.locationKnowledge", value: "unknown" }],
      },
    ],
  },
  {
    id: "q.sar.sources",
    domain: "search-rescue",
    group: "sar.sources",
    labelKey: "guided.sar.sources.label",
    priority: "useful",
    multi: true,
    dependsOn: ["sar.locationKnowledge"],
    appliesWhen: (facts) => {
      const knowledge = factString(facts, "sar.locationKnowledge");
      return knowledge !== undefined && knowledge !== "exact";
    },
    options: [
      {
        id: "radio",
        labelKey: "guided.sar.sources.radio",
        effects: [{ fact: "sar.source.radio", value: true }],
      },
      {
        id: "gps",
        labelKey: "guided.sar.sources.gps",
        effects: [{ fact: "sar.source.gps", value: true }],
      },
      {
        id: "map",
        labelKey: "guided.sar.sources.map",
        effects: [{ fact: "sar.source.map", value: true }],
      },
      {
        id: "witness",
        labelKey: "guided.sar.sources.witness",
        effects: [{ fact: "sar.source.witness", value: true }],
      },
      {
        id: "beacon",
        labelKey: "guided.sar.sources.beacon",
        effects: [{ fact: "sar.source.beacon", value: true }],
      },
    ],
  },
  {
    id: "q.sar.failure",
    domain: "search-rescue",
    group: "sar.failure",
    labelKey: "guided.sar.failure.label",
    priority: "structural",
    dependsOn: ["sar.locationKnowledge"],
    appliesWhen: (facts) =>
      factString(facts, "sar.locationKnowledge") !== undefined,
    options: [
      {
        id: "retry",
        labelKey: "guided.sar.failure.retry",
        effects: [{ fact: "sar.failureMode", value: "retry" }],
      },
      {
        id: "consequence",
        labelKey: "guided.sar.failure.consequence",
        effects: [{ fact: "sar.failureMode", value: "consequence" }],
      },
      {
        id: "alternative",
        labelKey: "guided.sar.failure.alternative",
        effects: [{ fact: "sar.failureMode", value: "alternative" }],
      },
      {
        id: "end",
        labelKey: "guided.sar.failure.end",
        effects: [{ fact: "sar.failureMode", value: "end" }],
      },
    ],
  },
  {
    id: "q.sar.condition",
    domain: "search-rescue",
    group: "sar.condition",
    labelKey: "guided.sar.condition.label",
    priority: "useful",
    dependsOn: [],
    appliesWhen: () => true,
    options: [
      {
        id: "unknown",
        labelKey: "guided.sar.condition.unknown",
        effects: [{ fact: "sar.targetCondition", value: "unknown" }],
      },
      {
        id: "stable",
        labelKey: "guided.sar.condition.stable",
        effects: [{ fact: "sar.targetCondition", value: "stable" }],
      },
      {
        id: "critical",
        labelKey: "guided.sar.condition.critical",
        effects: [{ fact: "sar.targetCondition", value: "critical" }],
      },
    ],
  },
];

function locateFlow(
  failureMode: string,
  stationId: string,
  objectiveId: string,
): Workflow {
  const origin = meta(RULE_LOCATE, "main");
  const nodes: WorkflowNode[] = [
    { id: "start", name: "Start", type: "start", position: { x: 0, y: 120 }, origin },
    {
      id: "surface",
      name: "Search console",
      type: "show-surface",
      station: stationId,
      surface: "console",
      position: { x: 240, y: 120 },
      origin,
    },
    {
      id: "window",
      name: "Search window",
      type: "task",
      task: "countdown",
      config: { prompt: "Search window running", seconds: 300 },
      position: { x: 480, y: 120 },
      origin,
    },
    {
      id: "found",
      name: "Target located?",
      type: "task",
      task: "confirm",
      config: { prompt: "Target located?" },
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
    {
      id: "end",
      name: "End",
      type: "end",
      outcome: "success",
      position: { x: 1200, y: 120 },
      origin,
    },
  ];
  const edges: WorkflowEdge[] = [
    { id: "e1", source: "start", output: "out", target: "surface" },
    { id: "e2", source: "surface", output: "out", target: "window" },
    { id: "e3", source: "window", output: "success", target: "found" },
    { id: "e4", source: "found", output: "success", target: "done" },
    { id: "e5", source: "done", output: "out", target: "end" },
  ];
  if (failureMode === "end") {
    nodes.push({
      id: "end-fail",
      name: "Search failed",
      type: "end",
      outcome: "failure",
      position: { x: 960, y: 320 },
      origin,
    });
    edges.push(
      { id: "e6", source: "window", output: "failure", target: "end-fail" },
      { id: "e7", source: "found", output: "failure", target: "end-fail" },
    );
  } else if (failureMode === "consequence") {
    nodes.push({
      id: "report",
      name: "Negative report",
      type: "task",
      task: "report",
      config: {
        prompt: "Report the negative result",
        fields: [{ id: "status", label: "Status" }],
      },
      position: { x: 720, y: 320 },
      origin,
    });
    nodes.push({
      id: "end-fail",
      name: "Search failed",
      type: "end",
      outcome: "failure",
      position: { x: 960, y: 320 },
      origin,
    });
    edges.push(
      { id: "e6", source: "window", output: "failure", target: "report" },
      { id: "e7", source: "found", output: "failure", target: "report" },
      { id: "e8", source: "report", output: "success", target: "end-fail" },
    );
  } else if (failureMode === "alternative") {
    nodes.push({
      id: "choice",
      name: "Alternative path",
      type: "task",
      task: "choice",
      config: {
        prompt: "How should the search continue?",
        options: [
          { id: "replan", label: "Replan search" },
          { id: "support", label: "Request support" },
          { id: "abort", label: "Abort search" },
        ],
      },
      position: { x: 720, y: 320 },
      origin,
    });
    nodes.push(
      {
        id: "end-support",
        name: "Support requested",
        type: "end",
        outcome: "failure",
        position: { x: 960, y: 420 },
        origin,
      },
      {
        id: "end-abort",
        name: "Search aborted",
        type: "end",
        outcome: "failure",
        position: { x: 1200, y: 420 },
        origin,
      },
    );
    edges.push(
      { id: "e6", source: "window", output: "failure", target: "choice" },
      { id: "e7", source: "found", output: "failure", target: "choice" },
      { id: "e8", source: "choice", output: "replan", target: "window" },
      { id: "e9", source: "choice", output: "support", target: "end-support" },
      { id: "e10", source: "choice", output: "abort", target: "end-abort" },
    );
  } else {
    nodes.push({
      id: "retry",
      name: "Retry delay",
      type: "delay",
      seconds: 30,
      position: { x: 720, y: 320 },
      origin,
    });
    edges.push(
      { id: "e6", source: "window", output: "failure", target: "retry" },
      { id: "e7", source: "found", output: "failure", target: "retry" },
      { id: "e8", source: "retry", output: "out", target: "window" },
    );
  }
  return workflowSchema.parse({
    id: generatedId(RULE_LOCATE, "main", "flow"),
    version: 1,
    name: "Locate target",
    trigger: { type: "manual" },
    entry: "start",
    nodes,
    edges,
    variables: [],
    origin,
  });
}

function recoverFlow(stationId: string, objectiveId: string): Workflow {
  const origin = meta(RULE_RECOVER, "main");
  return workflowSchema.parse({
    id: generatedId(RULE_RECOVER, "main", "flow"),
    version: 1,
    name: "Recover target",
    trigger: { type: "manual" },
    entry: "start",
    nodes: [
      { id: "start", name: "Start", type: "start", position: { x: 0, y: 120 }, origin },
      {
        id: "surface",
        name: "Recovery console",
        type: "show-surface",
        station: stationId,
        surface: "console",
        position: { x: 240, y: 120 },
        origin,
      },
      {
        id: "reached",
        name: "Target reached?",
        type: "task",
        task: "confirm",
        config: { prompt: "Target reached?" },
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
      { id: "e2", source: "surface", output: "out", target: "reached" },
      { id: "e3", source: "reached", output: "success", target: "done" },
      { id: "e4", source: "reached", output: "failure", target: "retry" },
      { id: "e5", source: "retry", output: "out", target: "reached" },
      { id: "e6", source: "done", output: "out", target: "end" },
    ],
    variables: [],
    origin,
  });
}

const locate: GuidedRule = {
  id: RULE_LOCATE,
  domain: "search-rescue",
  dependsOn: ["sar.locationKnowledge", "sar.failureMode", "sar.targetKind"],
  evaluate(ctx): Suggestion[] {
    const knowledge = factString(ctx.facts, "sar.locationKnowledge");
    if (!knowledge || knowledge === "exact") return [];
    const failureMode = factString(ctx.facts, "sar.failureMode") ?? "retry";
    const targetKind = factString(ctx.facts, "sar.targetKind") ?? "person";
    const subject = "main";
    const stationId = generatedId(RULE_LOCATE, subject, "player");
    const objectiveId = generatedId(RULE_LOCATE, subject, "objective");
    const zoneId = generatedId(RULE_LOCATE, subject, "zone");
    const operations: ScenarioOperation[] = [
      {
        op: "add-station",
        station: {
          id: stationId,
          name: "Search Team 01",
          role: "element",
          module: "tracking",
          player: true,
          origin: meta(RULE_LOCATE, subject),
        },
      },
      {
        op: "add-objective",
        objective: {
          id: objectiveId,
          name: "Locate and report target",
          origin: meta(RULE_LOCATE, subject),
        },
      },
      {
        op: "add-workflow",
        workflow: locateFlow(failureMode, stationId, objectiveId),
      },
    ];
    if (knowledge === "unknown")
      operations.push({
        op: "add-zone",
        zone: {
          id: zoneId,
          name: "Search area",
          lat: MAP.lat,
          lng: MAP.lng,
          radius: 150,
          origin: meta(RULE_LOCATE, subject),
        },
      });
    return [
      {
        id: makeSuggestionId(RULE_LOCATE, subject, {
          knowledge,
          failureMode,
          targetKind,
        }),
        ruleId: RULE_LOCATE,
        subjectKey: subject,
        reason: { key: "guided.reason.sar-locate", params: { knowledge } },
        operations,
      },
    ];
  },
};

const recover: GuidedRule = {
  id: RULE_RECOVER,
  domain: "search-rescue",
  dependsOn: ["sar.locationKnowledge", "sar.targetCondition"],
  evaluate(ctx): Suggestion[] {
    if (factString(ctx.facts, "sar.locationKnowledge") !== "exact") return [];
    const subject = "main";
    const stationId = generatedId(RULE_RECOVER, subject, "player");
    const objectiveId = generatedId(RULE_RECOVER, subject, "objective");
    return [
      {
        id: makeSuggestionId(RULE_RECOVER, subject, {
          condition: factString(ctx.facts, "sar.targetCondition") ?? "unknown",
        }),
        ruleId: RULE_RECOVER,
        subjectKey: subject,
        reason: { key: "guided.reason.sar-recover" },
        operations: [
          {
            op: "add-station",
            station: {
              id: stationId,
              name: "Recovery Team 01",
              role: "element",
              module: "tracking",
              player: true,
              origin: meta(RULE_RECOVER, subject),
            },
          },
          {
            op: "add-objective",
            objective: {
              id: objectiveId,
              name: "Recover and hand over target",
              origin: meta(RULE_RECOVER, subject),
            },
          },
          {
            op: "add-workflow",
            workflow: recoverFlow(stationId, objectiveId),
          },
        ],
      },
    ];
  },
};

const sources: GuidedRule = {
  id: RULE_SOURCES,
  domain: "search-rescue",
  dependsOn: [
    "sar.locationKnowledge",
    "sar.source.radio",
    "sar.source.gps",
    "sar.source.map",
    "sar.source.witness",
    "sar.source.beacon",
  ],
  evaluate(ctx): Suggestion[] {
    const knowledge = factString(ctx.facts, "sar.locationKnowledge");
    if (!knowledge || knowledge === "exact") return [];
    const subject = "main";
    const operations: ScenarioOperation[] = [];
    const origin = meta(RULE_SOURCES, subject);
    if (factBoolean(ctx.facts, "sar.source.beacon")) {
      const propId = generatedId(RULE_SOURCES, subject, "beacon");
      operations.push({
        op: "add-prop",
        prop: {
          id: propId,
          kind: "beacon",
          name: "Beacon 01",
          states: ["off", "active", "interference"],
          initial: "off",
          origin,
        },
      });
      operations.push({
        op: "add-station",
        station: {
          id: generatedId(RULE_SOURCES, subject, "console"),
          name: "Beacon console",
          role: "element",
          module: "beacon",
          bindings: { patient: "", prop: propId, objective: "" },
          origin,
        },
      });
    }
    if (factBoolean(ctx.facts, "sar.source.radio"))
      operations.push({
        op: "add-station",
        station: {
          id: generatedId(RULE_SOURCES, subject, "radio"),
          name: "Radio",
          role: "element",
          module: "comms",
          origin,
        },
      });
    if (factBoolean(ctx.facts, "sar.source.map"))
      operations.push({
        op: "add-zone",
        zone: {
          id: generatedId(RULE_SOURCES, subject, "map"),
          name: "Reported area",
          lat: MAP.lat,
          lng: MAP.lng,
          radius: 120,
          origin,
        },
      });
    if (!operations.length) return [];
    return [
      {
        id: makeSuggestionId(RULE_SOURCES, subject, {
          radio: factBoolean(ctx.facts, "sar.source.radio") ?? false,
          gps: factBoolean(ctx.facts, "sar.source.gps") ?? false,
          map: factBoolean(ctx.facts, "sar.source.map") ?? false,
          witness: factBoolean(ctx.facts, "sar.source.witness") ?? false,
          beacon: factBoolean(ctx.facts, "sar.source.beacon") ?? false,
        }),
        ruleId: RULE_SOURCES,
        subjectKey: subject,
        reason: { key: "guided.reason.sar-sources" },
        operations,
      },
    ];
  },
};

const condition: GuidedRule = {
  id: RULE_CONDITION,
  domain: "search-rescue",
  dependsOn: ["sar.targetCondition"],
  evaluate(ctx): Suggestion[] {
    if (factString(ctx.facts, "sar.targetCondition") !== "critical") return [];
    const subject = "main";
    const injectId = generatedId(RULE_CONDITION, subject, "event");
    return [
      {
        id: makeSuggestionId(RULE_CONDITION, subject, { condition: "critical" }),
        ruleId: RULE_CONDITION,
        subjectKey: subject,
        reason: { key: "guided.reason.sar-condition" },
        operations: [
          {
            op: "add-event",
            inject: {
              id: injectId,
              name: "Target condition critical",
              trigger: "timer",
              at: 120,
              actions: [
                { type: "message", text: "Target condition critical" },
              ],
              category: "contingency",
              purpose: "Report and escalate the target condition",
              expectedOutcome: ["condition.reported"],
              origin: meta(RULE_CONDITION, subject),
            },
          },
        ],
      },
    ];
  },
};

export const searchRescuePack: DomainPack = {
  id: "search-rescue",
  token: "sar",
  scenarioType: "sar",
  questions,
  rules: [locate, recover, sources, condition],
};
