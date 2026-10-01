import { describe, expect, it } from "vitest";
import { defaults } from "./config";
import {
  failStep,
  gate,
  lintShow,
  migrateShow,
  nextStep,
  showNodePorts,
  showSchema,
  timeoutStep,
  triggerMatches,
  type Show,
  type Take,
} from "./director";
import { removeNode, replaceNode, setOutputTarget } from "./graphEdit";
import { showTemplateLabels, showTemplates } from "./showTemplates";
import { warheadState } from "../scenes/shared/Warhead";

const take = (id: string, extra: Partial<Take> = {}): Take => ({
  kind: "take",
  id,
  name: id,
  config: defaults(),
  cue: "idle",
  operation: "",
  trigger: "time",
  duration: 5,
  value: "Enter",
  timeout: 0,
  ...extra,
});

function graph(
  nodes: Take[],
  edges: [string, string, string][],
  entry = nodes[0].id,
): Show {
  return showSchema.parse({
    version: 3,
    name: "test",
    entry,
    nodes: [...nodes, { kind: "end", id: "end", name: "" }],
    edges: edges.map(([source, output, target], index) => ({
      id: `e${index}`,
      source,
      output,
      target,
    })),
  });
}

describe("film show graph", () => {
  it("follows explicit success edges and stops at a terminal", () => {
    const show = graph(
      [take("a"), take("b")],
      [
        ["a", "success", "b"],
        ["b", "success", "end"],
      ],
    );
    expect(nextStep(show, "a")?.id).toBe("b");
    expect(nextStep(show, "b")).toBe(null);
    expect(failStep(show, "a")).toBe(null);
  });

  it("routes failure and timeout ports, falling back to the failure branch", () => {
    const show = graph(
      [take("a"), take("b")],
      [["a", "fail", "b"]],
    );
    expect(failStep(show, "a")?.id).toBe("b");
    expect(timeoutStep(show, "a")?.id).toBe("b");
    const withTimeout = graph(
      [take("a", { timeout: 3 }), take("b")],
      [
        ["a", "fail", "end"],
        ["a", "timeout", "b"],
      ],
    );
    expect(timeoutStep(withTimeout, "a")?.id).toBe("b");
  });

  it("rejects missing edge targets and duplicate node ids", () => {
    expect(
      showSchema.safeParse({
        version: 3,
        name: "x",
        entry: "a",
        nodes: [take("a"), { kind: "end", id: "end", name: "" }],
        edges: [{ id: "e", source: "a", output: "success", target: "ghost" }],
      }).success,
    ).toBe(false);
    expect(
      showSchema.safeParse({
        version: 3,
        name: "x",
        entry: "a",
        nodes: [take("a"), take("a")],
        edges: [],
      }).success,
    ).toBe(false);
  });

  it("migrates legacy steps and next/onFail into real edges", () => {
    const legacy = {
      version: 1,
      name: "legacy",
      steps: [
        {
          ...take("a", { trigger: "signal" }),
          next: "",
          onFail: "end",
        },
        { ...take("b"), next: "end", onFail: "" },
      ],
    };
    const show = migrateShow(legacy);
    expect(show.nodes.map((node) => node.id).sort()).toEqual(["a", "b", "end"]);
    expect(nextStep(show, "a")?.id).toBe("b");
    expect(failStep(show, "a")).toBe(null);
    expect(nextStep(show, "b")).toBe(null);
    expect(show.entry).toBe("a");
  });

  it("flags unreachable nodes and branches without a terminal", () => {
    const show = graph(
      [take("a"), take("b"), take("c")],
      [
        ["a", "success", "end"],
        ["b", "success", "b"],
      ],
    );
    const findings = lintShow(show);
    expect(findings.some((finding) => finding.nodeId === "c")).toBe(true);
    expect(findings.some((finding) => finding.nodeId === "b")).toBe(true);
  });

  it("survives a JSON import/export roundtrip", () => {
    const show = graph(
      [take("a", { timeout: 4 }), take("b")],
      [
        ["a", "success", "b"],
        ["a", "fail", "end"],
        ["b", "success", "end"],
      ],
    );
    expect(showSchema.parse(JSON.parse(JSON.stringify(show)))).toEqual(show);
  });

  it("keeps the graph consistent when nodes and ports change", () => {
    const show = graph(
      [take("a", { timeout: 5 }), take("b")],
      [
        ["a", "success", "b"],
        ["a", "fail", "end"],
        ["a", "timeout", "end"],
      ],
    );
    const removed = removeNode(show, "b");
    expect(removed.edges.some((edge) => edge.target === "b")).toBe(false);
    expect(removed.edges.some((edge) => edge.source === "b")).toBe(false);
    const retimed = replaceNode(show, { ...take("a"), timeout: 0 }, showNodePorts);
    expect(retimed.edges.some((edge) => edge.output === "timeout")).toBe(false);
    const retargeted = setOutputTarget(show, "a", "fail", "b", () => "e9");
    expect(retargeted.edges.filter((edge) => edge.source === "a" && edge.output === "fail")).toHaveLength(1);
    expect(retargeted.edges.find((edge) => edge.source === "a" && edge.output === "fail")?.target).toBe("b");
  });
});

describe("film triggers", () => {
  it("matches input gates by type and value and cannot be skipped by time", () => {
    const step = take("a", { trigger: "pin", value: "2048" });
    expect(triggerMatches(step, 99, { type: "key", value: "2048" })).toBe(false);
    expect(triggerMatches(step, 99, { type: "pin", value: "2048" })).toBe(true);
    expect(gate("file.found", "/archives/locator.beacon")).toBe(
      "file.found:/archives/locator.beacon",
    );
    expect(
      triggerMatches(
        take("a", { trigger: "signal", value: gate("shell.success") }),
        1,
        { type: "signal", value: gate("shell.success") },
      ),
    ).toBe(true);
  });

  it("warhead neutralization requires both handovers and precedes expiry", () => {
    expect(warheadState(20, 180, null, null, 15).safe).toBe(false);
    expect(warheadState(20, 180, 0, 9, 17).safe).toBe(true);
    expect(warheadState(180, 180, 0, 9, 178).expired).toBe(true);
  });

  it("loads every show template as a valid graph", () => {
    const branded = {
      ...defaults("terminal"),
      title: "UMBRELLA",
      brand: { mark: "umbrella" as const, logo: "" },
    };
    const list = showTemplates(branded);
    expect(list.map((template) => template.name)).toEqual([
      ...showTemplateLabels,
    ]);
    for (const template of list) {
      expect(showSchema.safeParse(template.show).success).toBe(true);
      expect(lintShow(template.show)).toEqual([]);
    }
  });
});
