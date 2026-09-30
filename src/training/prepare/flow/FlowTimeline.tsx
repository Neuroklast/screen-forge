import type { Inject } from "../../../core/training";
import type { Workflow } from "../../../core/workflow";
import type { FlowLink } from "../../../core/workflowEdit";
import { t } from "../../../i18n";
import { triggerLabel } from "./EventInspector";

export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

// The event lane of the flow workspace: one chip per event, in execution
// order. Chips that start a workflow say so; the internal split stays hidden.
export function FlowTimeline({
  events,
  links,
  workflows,
  selectedId,
  onSelect,
}: {
  events: Inject[];
  links: FlowLink[];
  workflows: Workflow[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const ordered = [...events].sort((a, b) => {
    const rank = (row: Inject) => (row.trigger === "timer" ? 0 : 1);
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    return a.at - b.at;
  });
  return (
    <div className="flow-timeline" aria-label={t("flow.timeline")}>
      <span className="palette-group-title">{t("flow.timeline")}</span>
      <div className="flow-chips">
        {ordered.map((event) => {
          const link = links.find((row) => row.inject === event.id);
          const linked = link
            ? workflows.find((row) => row.id === link.workflow)
            : undefined;
          return (
            <button
              key={event.id}
              aria-pressed={selectedId === event.id}
              className={`flow-chip ${selectedId === event.id ? "is-selected" : ""}`}
              onClick={() => onSelect(event.id)}
            >
              <span className="flow-chip-time">
                {event.trigger === "timer"
                  ? formatClock(event.at)
                  : triggerLabel(event.trigger)}
              </span>
              <span>{event.name}</span>
              {linked && (
                <span className="flow-chip-link">
                  {t("flow.linksTo", { name: linked.name })}
                </span>
              )}
            </button>
          );
        })}
        {!events.length && (
          <span className="flow-empty">{t("flow.addEvent")}</span>
        )}
      </div>
    </div>
  );
}
