import { z } from "zod";

export type UiControl =
  | "text"
  | "number"
  | "duration"
  | "segmented"
  | "toggle"
  | "station-reference"
  | "entity-reference";

export type UiField = { path: string; control: UiControl; label: string };

// One definition feeds serialization, validation, defaults, the trainer form,
// reference linting and documentation. The schema is the data truth; `ui` is
// the presentation truth.
export type TaskBlockDefinition<T = unknown> = {
  type: string;
  version: number;
  category: string;
  schema: z.ZodType<T>;
  defaults: () => T;
  ui: { icon?: string; category: string; fields: UiField[] };
  validateReferences?: (value: T, scenario: unknown) => string[];
};

const registry = new Map<string, TaskBlockDefinition>();

export function defineTaskBlock<T>(
  def: TaskBlockDefinition<T>,
): TaskBlockDefinition<T> {
  if (registry.has(def.type))
    throw new Error(`Task block already defined: ${def.type}`);
  registry.set(def.type, def as TaskBlockDefinition);
  return def;
}

export function taskBlock(type: string): TaskBlockDefinition | undefined {
  return registry.get(type);
}

export function taskBlocks(): TaskBlockDefinition[] {
  return [...registry.values()];
}

export function clearTaskBlocks(): void {
  registry.clear();
}

export function registerBuiltins(): void {
  defineTaskBlock({
    type: "hacking",
    version: 1,
    category: "terminal",
    schema: z.object({
      duration: z.number().min(1).max(900),
      difficulty: z.number().min(1).max(5),
      targetStationId: z.string(),
      failurePolicy: z.enum(["retry", "degrade", "lockout"]),
    }),
    defaults: () => ({
      duration: 60,
      difficulty: 2,
      targetStationId: "",
      failurePolicy: "retry" as const,
    }),
    ui: {
      icon: "terminal",
      category: "terminal",
      fields: [
        { path: "duration", control: "duration", label: "Dauer" },
        { path: "difficulty", control: "segmented", label: "Schwierigkeit" },
        {
          path: "targetStationId",
          control: "station-reference",
          label: "Zielterminal",
        },
      ],
    },
  });
  defineTaskBlock({
    type: "medical",
    version: 1,
    category: "medical",
    schema: z.object({
      patientId: z.string(),
      assessment: z.enum(["march", "simple"]),
    }),
    defaults: () => ({ patientId: "", assessment: "simple" as const }),
    ui: {
      icon: "medical",
      category: "medical",
      fields: [
        { path: "patientId", control: "entity-reference", label: "Patient" },
        { path: "assessment", control: "segmented", label: "Beurteilung" },
      ],
    },
  });
  defineTaskBlock({
    type: "camera",
    version: 1,
    category: "camera",
    schema: z.object({ feed: z.enum(["live", "offline"]) }),
    defaults: () => ({ feed: "live" as const }),
    ui: {
      icon: "camera",
      category: "camera",
      fields: [{ path: "feed", control: "segmented", label: "Quelle" }],
    },
  });
  defineTaskBlock({
    type: "tracking",
    version: 1,
    category: "tracking",
    schema: z.object({ player: z.boolean() }),
    defaults: () => ({ player: false }),
    ui: {
      icon: "tracking",
      category: "tracking",
      fields: [{ path: "player", control: "toggle", label: "GPS" }],
    },
  });
}

registerBuiltins();
