import { useRef } from "react";
import { useTraining } from "../../core/useExercise";
import { csvCell } from "../../core/csv";
import { buildDebrief } from "../../core/debrief";
import { nextIncomplete, prepareReadiness } from "../../core/readiness";
import { t } from "../../i18n";
import { Term } from "../../ui/terminology/Term";
import { sectionTermId, term } from "../../core/terminology";
import { TacticalMap } from "../TacticalMap";
import type { PrepareSectionProps } from "./shared";
import { Panel } from "../../ui/primitives";

// Overview: status, entry actions and readiness. No domain editing lives here.
export function OverviewSection({
  draft,
  caps,
  connected,
  onGuided,
  onGallery,
  onImport,
  onGo,
}: PrepareSectionProps & {
  connected: number;
  onGuided: () => void;
  onGallery: () => void;
  onImport: (file: File) => void;
  onGo: (tab: string) => void;
}) {
  const ex = useTraining();
  const readiness = prepareReadiness(draft);
  const nextSection = nextIncomplete(readiness);
  // After a run the debrief reports what actually executed (the server's
  // scenario); before the first fire it is a planning checklist over the draft.
  const ran = ex.state.fired.length > 0 || ex.state.completed.length > 0;
  const debrief = buildDebrief(ran ? ex.state.scenario : draft, ex.state);
  const exportFile = (value: unknown, filename: string, type: string) => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(value, null, 2)], { type }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <Panel className="prepare">
      <span className="eyebrow">{t("prep.overview.eyebrow")}</span>
      <h2>{t("prep.overview.title")}</h2>
      <div className="template-grid">
        <button onClick={onGuided} disabled={!ex.state.frozen}>
          <strong>{t("prep.overview.new")}</strong>
          <span>{t("prep.overview.newDesc")}</span>
        </button>
        <button onClick={onGallery} disabled={!ex.state.frozen}>
          <strong>{t("prep.overview.template")}</strong>
          <span>{t("prep.overview.templateDesc")}</span>
        </button>
        <button onClick={() => onGo(nextSection)}>
          <strong>
            {t("prep.overview.next", {
              section: term(sectionTermId(nextSection)),
            })}
          </strong>
          <span>{draft.name}</span>
        </button>
        <label className="import-card">
          <strong>{t("prep.overview.import")}</strong>
          <span>{t("prep.overview.importDesc")}</span>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImport(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <div className="prepare-summary">
        <div>
          <b>
            {connected} / {draft.stations.length}
          </b>
          <span>{t("trainer.devicesConnected")}</span>
        </div>
        <div>
          <b>{draft.mode}</b>
          <span>{t("trainer.dataSource")}</span>
        </div>
        <div>
          <b>
            {ex.state.completed.length} / {draft.objectives.length}
          </b>
          <span>{t("trainer.objectivesDone")}</span>
        </div>
        <div>
          <b>{draft.workflows.length}</b>
          <span>{t("cap.workflows")}</span>
        </div>
      </div>
      <div className="training-columns">
        <TacticalMap />
        <section className="panel">
          <h2>{t("trainer.log")}</h2>
          <ol className="event-log">
            {ex.state.log
              .slice(-30)
              .reverse()
              .map((e, i) => (
                <li key={i}>
                  <time>{e.at.toFixed(1)}s</time>
                  {e.message}
                </li>
              ))}
          </ol>
          <button
            onClick={() =>
              exportFile(
                { scenario: draft.name, log: ex.state.log, debrief },
                "screenforge-debrief.json",
                "application/json",
              )
            }
          >
            {t("trainer.exportLog")}
          </button>
          <button
            onClick={() => {
              const rows = [
                ["objective", "event", "status", "expected", "evidence"],
                ...debrief.events.map((event) => [
                  event.objectiveName || "",
                  event.name,
                  event.status,
                  event.expectedOutcome.join(" | "),
                  event.evidence.join(" | "),
                ]),
              ];
              const csv = rows.map((r) => r.map(csvCell).join(",")).join("\n");
              const url = URL.createObjectURL(
                new Blob([csv], { type: "text/csv" }),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = "screenforge-aar.csv";
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            {t("prep.aar.export")}
          </button>
          <button
            onClick={() => {
              const rows = [
                ["time", "message"],
                ...ex.state.log.map((e) => [e.at.toFixed(1), e.message]),
              ];
              const csv = rows.map((r) => r.map(csvCell).join(",")).join("\n");
              const url = URL.createObjectURL(
                new Blob([csv], { type: "text/csv" }),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = "screenforge-debrief.csv";
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            {t("trainer.exportCsv")}
          </button>
        </section>
      </div>

      <section className="panel prepare-aar">
        <div className="section-heading">
          <h2>
            <Term id="after_action_review" />
          </h2>
          <span className="eyebrow">
            {t("prep.aar.summary", {
              done: debrief.summary.completed,
              objectives: debrief.summary.objectives,
              fired: debrief.summary.fired,
              events: debrief.summary.events,
              skipped: debrief.summary.skipped,
            })}
          </span>
        </div>
        {debrief.objectives.length === 0 ? (
          <p className="builder-hint">{t("prep.aar.noObjectives")}</p>
        ) : (
          <ul className="prepare-aar-list">
            {debrief.objectives.map((objective) => (
              <li
                key={objective.id}
                className={objective.completed ? "is-done" : ""}
              >
                <header>
                  <strong>{objective.name}</strong>
                  <span>
                    {t(objective.completed ? "prep.aar.met" : "prep.aar.open")}
                  </span>
                </header>
                {objective.events.length === 0 ? (
                  <p className="is-warning">{t("prep.aar.uncovered")}</p>
                ) : (
                  <ul>
                    {objective.events.map((event) => (
                      <li key={event.id}>
                        <span>{event.name}</span>
                        <b className={`is-${event.status}`}>
                          {t(`prep.aar.${event.status}`)}
                        </b>
                        {event.purpose && <small>{event.purpose}</small>}
                        {event.expectedOutcome.length > 0 && (
                          <small>
                            {t("prep.aar.expected")}:{" "}
                            {event.expectedOutcome.join(", ")}
                          </small>
                        )}
                        {event.evidence.length > 0 && (
                          <small>
                            {t("prep.aar.evidence")}: {event.evidence.join(", ")}
                          </small>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
        {debrief.unlinked.length > 0 && (
          <p className="prepare-aar-unlinked">
            {t("prep.aar.unlinked", { n: debrief.unlinked.length })}
          </p>
        )}
      </section>
    </Panel>
  );
}
