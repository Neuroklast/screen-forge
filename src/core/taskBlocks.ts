import { z } from "zod";

export type UiControl =
  | "text"
  | "lines"
  | "number"
  | "duration"
  | "segmented"
  | "toggle"
  | "station-reference"
  | "entity-reference";

export type UiField = { path: string; control: UiControl; label: string };

// One definition feeds serialization, validation, defaults, the trainer form,
// reference linting and documentation. The schema is the data truth; `ui` is
// the presentation truth. `ports` are the workflow outputs a task can take
// (workflow nodes connect edges to them); `surface` is the field surface the
// task renders on. Task config MUST NOT embed secret values — secrets live in
// workflow variables so the projection can redact them.
export type TaskBlockDefinition<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  type: string;
  version: number;
  category: string;
  schema: z.ZodType<T>;
  defaults: () => T;
  ui: { icon?: string; category: string; fields: UiField[] };
  ports?: string[];
  // Tasks with configurable outputs (choice) derive their ports from config.
  portsFor?: (config: Record<string, unknown>) => string[];
  surface?: string;
  validateReferences?: (value: T, scenario: unknown) => string[];
};

export const DEFAULT_TASK_PORTS = ["success", "failure"] as const;

const registry = new Map<string, TaskBlockDefinition>();

export function defineTaskBlock<T extends Record<string, unknown>>(
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

export function taskBlockPorts(type: string): string[] {
  return [...(taskBlock(type)?.ports ?? DEFAULT_TASK_PORTS)];
}

export function taskBlockPortsFor(
  type: string,
  config: Record<string, unknown>,
): string[] {
  const block = taskBlock(type);
  if (!block) return [...DEFAULT_TASK_PORTS];
  return block.portsFor?.(config) ?? [...(block.ports ?? DEFAULT_TASK_PORTS)];
}

export function registerBuiltins(): void {
  defineTaskBlock({
    type: "code-entry",
    version: 1,
    category: "access",
    schema: z.object({
      expectedValueRef: z.string().max(40).default(""),
      maxAttempts: z.number().int().min(1).max(9).default(3),
      inputLength: z.number().int().min(1).max(16).default(4),
      maskInput: z.boolean().default(true),
    }),
    defaults: () => ({
      expectedValueRef: "",
      maxAttempts: 3,
      inputLength: 4,
      maskInput: true,
    }),
    surface: "code-challenge",
    ui: {
      icon: "lock",
      category: "access",
      fields: [
        { path: "expectedValueRef", control: "text", label: "Wertquelle" },
        { path: "maxAttempts", control: "number", label: "Versuche" },
        { path: "inputLength", control: "number", label: "Stellen" },
        { path: "maskInput", control: "toggle", label: "Maskiert" },
      ],
    },
  });
  defineTaskBlock({
    type: "confirm",
    version: 1,
    category: "report",
    schema: z.object({ prompt: z.string().max(120).default("") }),
    defaults: () => ({ prompt: "" }),
    surface: "confirm",
    ui: {
      icon: "check",
      category: "report",
      fields: [{ path: "prompt", control: "text", label: "Hinweis" }],
    },
  });
  const choiceSchema = z
    .object({
      prompt: z.string().max(120).default(""),
      options: z
        .array(
          z.object({
            id: z.string().regex(/^[a-zA-Z0-9_-]{1,20}$/),
            label: z.string().max(60).default(""),
          }),
        )
        .min(2)
        .max(6)
        .default([
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ]),
    })
    .superRefine((value, ctx) => {
      if (new Set(value.options.map((o) => o.id)).size !== value.options.length)
        ctx.addIssue({ code: "custom", message: "Option ids must be unique" });
    });
  defineTaskBlock({
    type: "choice",
    version: 1,
    category: "interaction",
    schema: choiceSchema,
    defaults: () => ({
      prompt: "",
      options: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
    }),
    surface: "choice",
    portsFor: (config) => {
      const parsed = choiceSchema.safeParse(config);
      return parsed.success
        ? parsed.data.options.map((option) => option.id)
        : [...DEFAULT_TASK_PORTS];
    },
    ui: {
      icon: "list",
      category: "interaction",
      fields: [{ path: "prompt", control: "text", label: "Hinweis" }],
    },
  });
  defineTaskBlock({
    type: "wait-for-event",
    version: 1,
    category: "interaction",
    schema: z.object({
      prop: z.string().max(40).default(""),
      to: z.string().max(40).default(""),
    }),
    defaults: () => ({ prop: "", to: "" }),
    surface: "wait",
    ports: ["out"],
    ui: { icon: "clock", category: "interaction", fields: [] },
  });
  defineTaskBlock({
    type: "connect",
    version: 1,
    category: "interaction",
    schema: z.object({
      prompt: z.string().max(120).default(""),
      prop: z.string().max(40).default(""),
      to: z.string().max(40).default(""),
    }),
    defaults: () => ({ prompt: "", prop: "", to: "" }),
    surface: "connect",
    ports: ["success"],
    ui: { icon: "plug", category: "interaction", fields: [] },
  });
  const reportSchema = z
    .object({
      prompt: z.string().max(120).default(""),
      fields: z
        .array(
          z.object({
            id: z.string().regex(/^[a-zA-Z0-9_-]{1,20}$/),
            label: z.string().max(60).default(""),
          }),
        )
        .min(1)
        .max(6)
        .default([{ id: "note", label: "Note" }]),
    })
    .superRefine((value, ctx) => {
      if (new Set(value.fields.map((f) => f.id)).size !== value.fields.length)
        ctx.addIssue({ code: "custom", message: "Field ids must be unique" });
    });
  defineTaskBlock({
    type: "report",
    version: 1,
    category: "report",
    schema: reportSchema,
    defaults: () => ({ prompt: "", fields: [{ id: "note", label: "Note" }] }),
    surface: "report",
    ports: ["success"],
    ui: {
      icon: "report",
      category: "report",
      fields: [{ path: "prompt", control: "text", label: "Hinweis" }],
    },
  });
  defineTaskBlock({
    type: "inspect",
    version: 1,
    category: "report",
    schema: z.object({
      prompt: z.string().max(120).default(""),
      lines: z.array(z.string().max(120)).max(8).default([]),
    }),
    defaults: () => ({ prompt: "", lines: [] }),
    surface: "inspect",
    ports: ["success"],
    ui: {
      icon: "search",
      category: "report",
      fields: [{ path: "prompt", control: "text", label: "Hinweis" }],
    },
  });
  defineTaskBlock({
    type: "transfer",
    version: 1,
    category: "interaction",
    schema: z.object({
      prompt: z.string().max(120).default(""),
      seconds: z.number().int().min(1).max(60).default(5),
    }),
    defaults: () => ({ prompt: "", seconds: 5 }),
    surface: "transfer",
    ports: ["success"],
    ui: {
      icon: "transfer",
      category: "interaction",
      fields: [
        { path: "prompt", control: "text", label: "Hinweis" },
        { path: "seconds", control: "duration", label: "Dauer" },
      ],
    },
  });
  defineTaskBlock({
    type: "dial",
    version: 1,
    category: "interaction",
    schema: z.object({
      dials: z.number().int().min(1).max(4).default(3),
      seed: z.number().int().min(1).max(9999).default(1),
    }),
    defaults: () => ({ dials: 3, seed: 1 }),
    surface: "dial",
    ports: ["success"],
    ui: {
      icon: "sliders",
      category: "interaction",
      fields: [
        { path: "dials", control: "number", label: "Regler" },
        { path: "seed", control: "number", label: "Referenz" },
      ],
    },
  });
  defineTaskBlock({
    type: "code-table",
    version: 1,
    category: "interaction",
    schema: z.object({ message: z.string().max(60).default("RELAY") }),
    defaults: () => ({ message: "RELAY" }),
    surface: "code-table",
    ports: ["success"],
    ui: {
      icon: "table",
      category: "interaction",
      fields: [{ path: "message", control: "text", label: "Klartext" }],
    },
  });
  defineTaskBlock({
    type: "datasheet",
    version: 1,
    category: "report",
    schema: z.object({
      subject: z.string().max(40).default("countdown"),
      title: z.string().max(80).default(""),
      relayText: z.string().max(120).default(""),
    }),
    defaults: () => ({ subject: "countdown", title: "", relayText: "" }),
    surface: "datasheet",
    ports: ["success"],
    ui: {
      icon: "file",
      category: "report",
      fields: [
        { path: "subject", control: "text", label: "Thema" },
        { path: "title", control: "text", label: "Titel" },
        { path: "relayText", control: "text", label: "Funktext" },
      ],
    },
  });
  defineTaskBlock({
    type: "timer",
    version: 1,
    category: "interaction",
    schema: z.object({
      label: z.string().max(80).default(""),
      seconds: z.number().int().min(1).max(3600).default(10),
    }),
    defaults: () => ({ label: "", seconds: 10 }),
    surface: "timer",
    ports: ["success"],
    ui: {
      icon: "timer",
      category: "interaction",
      fields: [
        { path: "label", control: "text", label: "Bezeichnung" },
        { path: "seconds", control: "duration", label: "Dauer" },
      ],
    },
  });
  defineTaskBlock({
    type: "countdown",
    version: 1,
    category: "interaction",
    schema: z.object({
      prompt: z.string().max(120).default(""),
      seconds: z.number().int().min(1).max(3600).default(30),
    }),
    defaults: () => ({ prompt: "", seconds: 30 }),
    surface: "countdown",
    ports: ["success", "failure"],
    ui: {
      icon: "timer",
      category: "interaction",
      fields: [
        { path: "prompt", control: "text", label: "Hinweis" },
        { path: "seconds", control: "duration", label: "Frist" },
      ],
    },
  });
  defineTaskBlock({
    type: "message-viewer",
    version: 1,
    category: "report",
    schema: z.object({
      title: z.string().max(80).default(""),
      messages: z
        .array(z.string().max(200))
        .max(20)
        .default(["Archive service — Two manifests available"]),
    }),
    defaults: () => ({
      title: "",
      messages: ["Archive service — Two manifests available"],
    }),
    surface: "message-viewer",
    ports: ["success"],
    ui: {
      icon: "mail",
      category: "report",
      fields: [
        { path: "title", control: "text", label: "Titel" },
        { path: "messages", control: "lines", label: "Meldungen" },
      ],
    },
  });
  defineTaskBlock({
    type: "file-browser",
    version: 1,
    category: "report",
    schema: z.object({
      title: z.string().max(80).default(""),
      files: z
        .array(z.string().max(200))
        .max(20)
        .default(["incident-041.manifest — signed manifest"]),
    }),
    defaults: () => ({
      title: "",
      files: ["incident-041.manifest — signed manifest"],
    }),
    surface: "file-browser",
    ports: ["success"],
    ui: {
      icon: "folder",
      category: "report",
      fields: [
        { path: "title", control: "text", label: "Titel" },
        { path: "files", control: "lines", label: "Dateien" },
      ],
    },
  });
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
