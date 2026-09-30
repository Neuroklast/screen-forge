import type { TrainingState } from "../core/training";
import { buildTimeline, timelineCsv } from "../core/timeline";

const KIND_LABEL: Record<string, string> = {
  planned: "Geplant",
  rescheduled: "Verschoben",
  actual: "Tatsächlich",
};

export function MelTimeline({ state }: { state: TrainingState }) {
  const entries = buildTimeline(state);
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
        <h2>MEL-Zeitstrahl</h2>
        <button onClick={download}>MEL exportieren (CSV)</button>
      </div>
      <ul className="event-log mel-timeline">
        {entries.map((entry, index) => (
          <li key={`${entry.kind}-${entry.injectId ?? index}-${entry.at}`}>
            <span>{entry.at.toFixed(0)} s</span>
            <b>{KIND_LABEL[entry.kind] ?? entry.kind}</b>
            <span>{entry.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
