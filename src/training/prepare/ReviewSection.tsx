import { findingCounts, lintMission } from "../../core/missionLint";
import { briefingFilename, missionBriefing } from "../../core/briefing";
import { t } from "../../i18n";
import { sectionTermId, term } from "../../core/terminology";
import type { PrepSection } from "../../core/readiness";
import { Term } from "../../ui/terminology/Term";
import type { PrepareSectionProps } from "./shared";
import { Panel } from "../../ui/primitives";

const SECTION_OF: Record<string, PrepSection> = {
  stations: "devices",
  props: "devices",
  patients: "participants",
  teams: "participants",
  actors: "participants",
  dossiers: "participants",
  zones: "scenario",
  objectives: "scenario",
  workflows: "flow",
  injects: "flow",
};

// Review: a launch gate. It shows the blocker/warning counts, one next action,
// and the start button; findings and briefing are secondary detail.
export function ReviewSection({
  draft,
  online,
  frozen,
  dirty,
  onStart,
  onGo,
  onNotice,
}: PrepareSectionProps & {
  online: boolean;
  frozen: boolean;
  dirty: boolean;
  onStart: () => void;
  onGo: (tab: string) => void;
  onNotice: (message: string) => void;
}) {
  const findings = lintMission(draft);
  const counts = findingCounts(findings);
  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");
  const infos = findings.filter((f) => f.severity === "info");
  const briefing = missionBriefing(draft, {
    date: `${new Date().toISOString().slice(0, 16).replace("T", " ")}Z`,
  });
  const blocked = counts.error > 0 || !online || dirty || !frozen;
  const blockReason =
    counts.error > 0
      ? t("prep.review.blocked", { count: errors.length })
      : !online
        ? term("disconnected")
        : dirty
          ? t("trainer.unsaved")
          : !frozen
            ? term("running")
            : t("prep.review.ready");
  const next = errors[0] ?? warnings[0] ?? infos[0];
  const sectionOf = (collection: string) =>
    SECTION_OF[collection] ?? "scenario";
  const exportJson = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(draft, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "screenforge-scenario.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const exportBriefing = () => {
    const url = URL.createObjectURL(
      new Blob([briefing], { type: "text/plain" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = briefingFilename(draft);
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <Panel className="prepare">
      <h2>
        <Term id="nav.review" />
      </h2>

      <section className="prepare-block launch-gate">
        <h3>{t("prep.review.readyTitle")}</h3>
        <div className="launch-counts">
          <span className={counts.error ? "is-error" : "is-ok"}>
            {counts.error} {t("prep.review.blockers")}
          </span>
          <span className={counts.warning ? "is-warning" : "is-ok"}>
            {counts.warning} {t("prep.review.warnings")}
          </span>
        </div>
        <div className="button-row">
          <button
            disabled={!next}
            onClick={() => next && onGo(sectionOf(next.path.collection))}
          >
            {t("prep.review.fixNext")}
          </button>
          <button
            className="primary"
            disabled={blocked}
            onClick={onStart}
            title={blocked ? blockReason : ""}
          >
            {t("trainer.start")}
          </button>
        </div>
        <p className="prepare-hint">{blockReason}</p>
      </section>

      <details className="prepare-advanced">
        <summary>{t("prep.review.details")}</summary>
        <ul className="prepare-findings">
          {errors.map((f) => (
            <li key={f.id} className="is-error">
              <span>{f.message}</span>
              <button
                className="prepare-fix"
                onClick={() => onGo(sectionOf(f.path.collection))}
              >
                {t("prep.review.fixIn", {
                  section: term(sectionTermId(sectionOf(f.path.collection))),
                })}
              </button>
            </li>
          ))}
          {warnings.map((f) => (
            <li key={f.id} className="is-warning">
              <span>{f.message}</span>
              <button
                className="prepare-fix"
                onClick={() => onGo(sectionOf(f.path.collection))}
              >
                {t("prep.review.fixIn", {
                  section: term(sectionTermId(sectionOf(f.path.collection))),
                })}
              </button>
            </li>
          ))}
          {infos.map((f) => (
            <li key={f.id} className="is-info">
              <span>{f.message}</span>
            </li>
          ))}
          {!findings.length && (
            <li className="is-ok">{t("prep.review.noFindings")}</li>
          )}
        </ul>
      </details>

      <section className="prepare-block">
        <h3>{t("prep.review.briefing")}</h3>
        <div className="button-row">
          <button
            onClick={() => {
              void navigator.clipboard
                ?.writeText(briefing)
                .then(() => onNotice(t("trainer.briefingCopied")))
                .catch(() => onNotice(t("trainer.copyFailed")));
            }}
          >
            {t("prep.review.copyBriefing")}
          </button>
          <button onClick={exportBriefing}>
            {t("prep.review.exportBriefing")}
          </button>
          <button onClick={exportJson}>{t("prep.review.saveTemplate")}</button>
        </div>
        <details className="prepare-advanced">
          <summary>{t("prep.review.details")}</summary>
          <pre className="briefing-text">{briefing}</pre>
        </details>
      </section>
    </Panel>
  );
}
