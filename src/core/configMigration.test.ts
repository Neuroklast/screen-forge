import { describe, it, expect } from "vitest";
import { defaults, schema } from "./config";

describe("config migration to sceneOptions", () => {
  it("moves legacy flat fields into sceneOptions", () => {
    const legacy = {
      ...defaults(),
      sceneOptions: undefined,
      osApp: "files",
      sequenceScale: 2,
      actorMode: false,
      script: "legacy command",
      commandsUntilSuccess: 6,
      device: "nuclear",
    };
    const parsed = schema.parse(legacy);
    expect(parsed.sceneOptions.os.startupApp).toBe("files");
    expect(parsed.sceneOptions.os.sequenceScale).toBe(2);
    expect(parsed.sceneOptions.terminal.actorMode).toBe(false);
    expect(parsed.sceneOptions.terminal.script).toBe("legacy command");
    expect(parsed.sceneOptions.terminal.commandsUntilSuccess).toBe(6);
    expect(parsed.sceneOptions.countdown.variant).toBe("nuclear");
  });

  it("keeps defaults for a config without sceneOptions", () => {
    const parsed = schema.parse({ ...defaults(), sceneOptions: undefined });
    expect(parsed.sceneOptions.os.startupApp).toBe("overview");
    expect(parsed.sceneOptions.terminal.commandsUntilSuccess).toBe(4);
    expect(parsed.sceneOptions.countdown.type).toBe("bomb");
  });

  it("renames the legacy studio workspace value training to rehearsal", () => {
    const parsed = schema.parse({ ...defaults(), workspace: "training" });
    expect(parsed.workspace).toBe("rehearsal");
  });
});
