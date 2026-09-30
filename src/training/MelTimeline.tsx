import type { TrainingState } from "../core/training";
import { buildTimeline, timelineCsv } from "../core/timeline";
import { t } from "../i18n";

const KIND_KEY: Record<string, string> = {
  planned: "mel.planned",
  rescheduled: "mel.rescheduled",
  actual: "mel.actual",
};

export function MelTimeline({
  state,
  onStartWorkflow,
}: {
  state: TrainingState;
  onStartWorkflow?: (id: string) => void;
}) {
  const entries = buildTimeline(state);
  const manualFlows = state.scenario.workflows.filter(
    (workflow) => workflow.trigger.type === "manual",
  );
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([timelineCsv(entries)], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `screenforge-mel-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section className="panel">
      <div className="button-row">
        <h2>{t("mel.title")}</h2>
        <button onClick={download}>{t("mel.export")}</button>
      </div>
      {manualFlows.length > 0 && (
        <div className="button-row">
          {manualFlows.map((workflow) => {
            const started = !!state.workflows[workflow.id];
            return (
              <button
                key={workflow.id}
                disabled={started || state.frozen || !onStartWorkflow}
                onClick={() => onStartWorkflow?.(workflow.id)}
              >
                {t("mel.startFlow", { name: workflow.name })}
                {started ? ` · ${t("mel.flowStarted")}` : ""}
              </button>
            );
          })}
        </div>
      )}
      <ul className="event-log mel-timeline">
        {entries.map((entry, index) => (
          <li key={`${entry.kind}-${entry.injectId ?? index}-${entry.at}`}>
            <span>{entry.at.toFixed(0)} s</span>
            <b>{t(KIND_KEY[entry.kind] ?? entry.kind)}</b>
            <span>{entry.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
