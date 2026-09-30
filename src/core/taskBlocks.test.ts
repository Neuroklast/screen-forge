import { describe, expect, it } from "vitest";
import {
  defineTaskBlock,
  taskBlock,
  taskBlocks,
  type TaskBlockDefinition,
} from "./taskBlocks";
import { z } from "zod";

describe("task block registry", () => {
  it("registers built-in blocks", () => {
    expect(taskBlocks().map((b) => b.type)).toEqual(
      expect.arrayContaining(["hacking", "medical", "camera", "tracking"]),
    );
  });

  it("provides defaults that satisfy the schema", () => {
    const block = taskBlock("hacking");
    expect(block).toBeDefined();
    const defaults = block!.defaults();
    expect(block!.schema.safeParse(defaults).success).toBe(true);
  });

  it("registers the migrated widget tasks with a surface and ports", () => {
    for (const [type, surface] of [
      ["dial", "dial"],
      ["code-table", "code-table"],
      ["datasheet", "datasheet"],
      ["timer", "timer"],
      ["countdown", "countdown"],
      ["message-viewer", "message-viewer"],
      ["file-browser", "file-browser"],
    ] as const) {
      const block = taskBlock(type);
      expect(block?.surface).toBe(surface);
      expect(block?.ports).toContain("success");
      expect(block!.schema.safeParse(block!.defaults()).success).toBe(true);
    }
  });

  it("rejects duplicate type definitions", () => {
    const def: TaskBlockDefinition = {
      type: "duplicate-test",
      version: 1,
      category: "test",
      schema: z.object({}),
      defaults: () => ({}),
      ui: { category: "test", fields: [] },
    };
    defineTaskBlock(def);
    expect(() => defineTaskBlock(def)).toThrow(/already defined/);
  });
});
