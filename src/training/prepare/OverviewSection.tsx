import { useRef } from "react";
import { useTraining } from "../../core/useExercise";
import { nextIncomplete, prepareReadiness } from "../../core/readiness";
import { t } from "../../i18n";
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
                { scenario: draft.name, log: ex.state.log },
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
                ["time", "message"],
                ...ex.state.log.map((e) => [
                  e.at.toFixed(1),
                  e.message.replace(/"/g, '""'),
                ]),
              ];
              const csv = rows
                .map((r) => r.map((c) => `"${c}"`).join(","))
                .join("\n");
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
    </Panel>
  );
}
