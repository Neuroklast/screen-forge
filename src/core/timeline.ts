import type { TrainingState } from "./training";

export type TimelineKind = "planned" | "rescheduled" | "actual";

export type TimelineEntry = {
  at: number;
  kind: TimelineKind;
  label: string;
  injectId?: string;
  from?: number;
  to?: number;
};

// Reconstructs planned, EXCON-changed and actual times so the AAR can compare
// them. "Planned" is never overwritten; reschedules are separate entries.
export function buildTimeline(state: TrainingState): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  for (const r of state.scenario.injects) {
    const original = r.plannedAtOriginal ?? r.at;
    entries.push({
      at: original,
      kind: "planned",
      label: r.name,
      injectId: r.id,
    });
    if (r.scheduledAt != null && r.scheduledAt !== original)
      entries.push({
        at: r.scheduledAt,
        kind: "rescheduled",
        label: r.name,
        injectId: r.id,
        from: original,
        to: r.scheduledAt,
      });
  }
  for (const event of state.log)
    entries.push({ at: event.at, kind: "actual", label: event.message });
  return entries.sort((a, b) => a.at - b.at);
}

export function timelineCsv(entries: TimelineEntry[]): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return [
    "time,kind,inject,label,from,to",
    ...entries.map((e) =>
      [
        e.at,
        e.kind,
        escape(e.injectId ?? ""),
        escape(e.label),
        e.from ?? "",
        e.to ?? "",
      ].join(","),
    ),
  ].join("\n");
}
