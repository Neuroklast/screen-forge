import { z } from "zod";
import { schema, defaults, type Config } from "./config";
export const stepSchema = z.object({
  id: z.string().max(80),
  name: z.string().max(60),
  config: schema,
  cue: z.enum(["idle", "active", "warning", "complete"]),
  operation: z.string().max(40).default(""),
  trigger: z.enum(["time", "key", "pin", "signal"]).default("signal"),
  duration: z.number().min(0.1).max(35999),
  value: z.string().max(80),
  next: z.string().max(80),
  onFail: z.string().max(80).default(""),
  timeout: z.number().min(0).max(35999).default(0),
});
export const showSchema = z
  .object({
    version: z.union([z.literal(1), z.literal(2)]).default(1),
    name: z.string().max(80),
    steps: z.array(stepSchema).max(60),
  })
  .refine(
    (show) => new Set(show.steps.map((s) => s.id)).size === show.steps.length,
    "Duplicate node IDs",
  )
  .refine(
    (show) =>
      show.steps.every(
        (s) =>
          (!s.next ||
          s.next === "end" ||
          show.steps.some((t) => t.id === s.next)) &&
        (!s.onFail ||
          s.onFail === "end" ||
          show.steps.some((t) => t.id === s.onFail)),
      ),
    "Invalid link",
  );
export type Show = z.infer<typeof showSchema>;
export type Step = z.infer<typeof stepSchema>;
export function newStep(config: Config): Step {
  return {
    id: crypto.randomUUID(),
    name: config.title,
    config: structuredClone(config),
    cue: "idle",
    operation: "",
    trigger: "time",
    duration: 10,
    value: "Enter",
    next: "",
    onFail: "",
    timeout: 0,
  };
}
export function failStep(show: Show, id: string) {
  const s = show.steps.find((x) => x.id === id);
  if (!s || !s.onFail || s.onFail === "end") return null;
  return show.steps.find((n) => n.id === s.onFail) ?? null;
}
export function nextStep(show: Show, id: string) {
  const index = show.steps.findIndex((s) => s.id === id),
    s = show.steps[index];
  return !s || s.next === "end"
    ? null
    : s.next
      ? (show.steps.find((n) => n.id === s.next) ?? null)
      : (show.steps[index + 1] ?? null);
}
export function gate(kind: "file.found" | "file.decrypt" | "shell.success", path = "") {
  return path ? `${kind}:${path}` : kind;
}
export function triggerMatches(
  step: Step,
  elapsed: number,
  input?: { type: string; value: string },
) {
  return step.trigger === "time"
    ? elapsed >= step.duration
    : !!input && input.type === step.trigger && input.value === step.value;
}
export function loadShow(): Show {
  try {
    return showSchema.parse(
      JSON.parse(localStorage.getItem("screenforge.show.v1") || "null"),
    );
  } catch {
    return {
      version: 2,
      name: "Take 01",
      steps: [newStep(defaults("terminal"))],
    };
  }
}
