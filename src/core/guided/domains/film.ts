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

// Film pack: a sequence of beats with an explicit outcome shape.
const RULE_SEQUENCE = "film-sequence";
const RULE_ACTOR = "film-actor";
const RULE_PROPS = "film-props";

function meta(ruleId: string, subjectKey: string): GeneratedMeta {
  return { source: "guided", ruleId, subjectKey, userModified: false };
}

const questions: GuidedQuestion[] = [
  {
    id: "q.film.action",
    domain: "film",
    group: "film.action",
    labelKey: "guided.film.action.label",
    priority: "structural",
    dependsOn: [],
    appliesWhen: () => true,
    options: [
      {
        id: "linear",
        labelKey: "guided.film.action.linear",
        effects: [{ fact: "film.action", value: "linear" }],
      },
      {
        id: "failure",
        labelKey: "guided.film.action.failure",
        effects: [{ fact: "film.action", value: "failure" }],
      },
      {
        id: "reactions",
        labelKey: "guided.film.action.reactions",
        effects: [{ fact: "film.action", value: "reactions" }],
      },
      {
        id: "timed",
        labelKey: "guided.film.action.timed",
        effects: [{ fact: "film.action", value: "timed" }],
      },
    ],
  },
];

function sequenceFlow(
  action: string,
  stationId: string,
  objectiveId: string,
): Workflow {
  const origin = meta(RULE_SEQUENCE, "main");
  const nodes: Workflow["nodes"] = [
    { id: "start", name: "Start", type: "start", position: { x: 0, y: 120 }, origin },
    {
      id: "surface",
      name: "Stage",
      type: "show-surface",
      station: stationId,
      surface: "console",
      position: { x: 240, y: 120 },
      origin,
    },
  ];
  const edges: Workflow["edges"] = [
    { id: "e1", source: "start", output: "out", target: "surface" },
  ];
  const end = {
    id: "end",
    name: "End",
    type: "end" as const,
    outcome: "success" as const,
    position: { x: 1200, y: 120 },
    origin,
  };
  const done = {
    id: "done",
    name: "Objective complete",
    type: "complete-objective" as const,
    objective: objectiveId,
    position: { x: 960, y: 120 },
    origin,
  };
  const endFail = {
    id: "end-fail",
    name: "Beat failed",
    type: "end" as const,
    outcome: "failure" as const,
    position: { x: 960, y: 320 },
    origin,
  };
  if (action === "timed") {
    nodes.push(
      {
        id: "timer",
        name: "Beat timer",
        type: "task",
        task: "countdown",
        config: { prompt: "Beat running", seconds: 30 },
        position: { x: 480, y: 120 },
        origin,
      },
      done,
      end,
      endFail,
    );
    edges.push(
      { id: "e2", source: "surface", output: "out", target: "timer" },
      { id: "e3", source: "timer", output: "success", target: "done" },
      { id: "e4", source: "timer", output: "failure", target: "end-fail" },
      { id: "e5", source: "done", output: "out", target: "end" },
    );
  } else if (action === "reactions") {
    nodes.push(
      {
        id: "choice",
        name: "Reaction",
        type: "task",
        task: "choice",
        config: {
          prompt: "How does the scene continue?",
          options: [
            { id: "proceed", label: "Proceed" },
            { id: "fail", label: "Fail" },
            { id: "timeout", label: "Timeout" },
          ],
        },
        position: { x: 480, y: 120 },
        origin,
      },
      done,
      end,
      endFail,
    );
    edges.push(
      { id: "e2", source: "surface", output: "out", target: "choice" },
      { id: "e3", source: "choice", output: "proceed", target: "done" },
      { id: "e4", source: "choice", output: "fail", target: "end-fail" },
      { id: "e5", source: "choice", output: "timeout", target: "end-fail" },
      { id: "e6", source: "done", output: "out", target: "end" },
    );
  } else {
    nodes.push(
      {
        id: "beat",
        name: "Beat complete?",
        type: "task",
        task: "confirm",
        config: { prompt: "Beat complete?" },
        position: { x: 480, y: 120 },
        origin,
      },
      done,
      end,
      endFail,
    );
    edges.push(
      { id: "e2", source: "surface", output: "out", target: "beat" },
      { id: "e3", source: "beat", output: "success", target: "done" },
      { id: "e4", source: "beat", output: "failure", target: "end-fail" },
      { id: "e5", source: "done", output: "out", target: "end" },
    );
  }
  return workflowSchema.parse({
    id: generatedId(RULE_SEQUENCE, "main", "flow"),
    version: 1,
    name: "Sequence",
    trigger: { type: "manual" },
    entry: "start",
    nodes,
    edges,
    variables: [],
    origin,
  });
}

const sequence: GuidedRule = {
  id: RULE_SEQUENCE,
  domain: "film",
  dependsOn: ["film.action"],
  evaluate(ctx): Suggestion[] {
    const action = factString(ctx.facts, "film.action");
    if (!action) return [];
    const subject = "main";
    const stationId = generatedId(RULE_SEQUENCE, subject, "stage");
    const objectiveId = generatedId(RULE_SEQUENCE, subject, "objective");
    const origin = meta(RULE_SEQUENCE, subject);
    return [
      {
        id: makeSuggestionId(RULE_SEQUENCE, subject, { action }),
        ruleId: RULE_SEQUENCE,
        subjectKey: subject,
        reason: { key: "guided.reason.film-sequence", params: { action } },
        operations: [
          {
            op: "add-station",
            station: {
              id: stationId,
              name: "Stage 01",
              role: "element",
              module: "intranet",
              origin,
            },
          },
          {
            op: "add-objective",
            objective: {
              id: objectiveId,
              name: "Sequence complete",
              origin,
            },
          },
          {
            op: "add-workflow",
            workflow: sequenceFlow(action, stationId, objectiveId),
          },
        ],
      },
    ];
  },
};

const actor: GuidedRule = {
  id: RULE_ACTOR,
  domain: "film",
  dependsOn: ["film.action"],
  evaluate(ctx): Suggestion[] {
    if (!factString(ctx.facts, "film.action")) return [];
    const subject = "main";
    return [
      {
        id: makeSuggestionId(RULE_ACTOR, subject, { actor: "lead" }),
        ruleId: RULE_ACTOR,
        subjectKey: subject,
        reason: { key: "guided.reason.film-actor" },
        operations: [
          {
            op: "add-actor",
            actor: {
              id: generatedId(RULE_ACTOR, subject, "actor"),
              name: "Lead",
              character: "Lead",
              origin: meta(RULE_ACTOR, subject),
            },
          },
        ],
      },
    ];
  },
};

const props: GuidedRule = {
  id: RULE_PROPS,
  domain: "film",
  dependsOn: ["film.action"],
  evaluate(ctx): Suggestion[] {
    if (factString(ctx.facts, "film.action") !== "reactions") return [];
    const subject = "main";
    const propId = generatedId(RULE_PROPS, subject, "prop");
    const origin = meta(RULE_PROPS, subject);
    return [
      {
        id: makeSuggestionId(RULE_PROPS, subject, { action: "reactions" }),
        ruleId: RULE_PROPS,
        subjectKey: subject,
        reason: { key: "guided.reason.film-props" },
        operations: [
          {
            op: "add-prop",
            prop: {
              id: propId,
              kind: "custom",
              name: "Handled device",
              states: ["idle", "active", "failed"],
              initial: "idle",
              origin,
            },
          },
          {
            op: "add-station",
            station: {
              id: generatedId(RULE_PROPS, subject, "device"),
              name: "Device console",
              role: "element",
              module: "terminal",
              bindings: { patient: "", prop: propId, objective: "" },
              origin,
            },
          },
        ],
      },
    ];
  },
};

export const filmPack: DomainPack = {
  id: "film",
  token: "film",
  scenarioType: "film",
  questions,
  rules: [sequence, actor, props],
};
