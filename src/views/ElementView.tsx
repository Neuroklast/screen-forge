import { useEffect, useState } from "react";
import { moduleEvents } from "../core/training";
import { useTraining } from "../core/useExercise";
import { DeviceTools } from "../training/DeviceTools";
import { DossierCards } from "../training/Dossiers";
import { DeviceSurface } from "../training/DeviceSurface";
import { labelFor } from "../core/labels";
import { t } from "../i18n";
import "../training/roles.css";
import "./field.css";

// Operator surface: a fixed viewport that mutates into the interface the
// current state needs (workflow task, module, or abort). No web header and no
// document scroll stack — only the active surface owns the screen.
type Drawer = "messages" | "device" | "files" | null;

const MEDICAL_ACTIONS: [string, string][] = [
  ["treated", "field.reportTreatment"],
  ["tourniquet", "field.tourniquet"],
  ["oxygen", "field.oxygen"],
  ["evacuated", "field.evacuated"],
];

export function ElementView({ station }: { station: string }) {
  const ex = useTraining();
  const [drawer, setDrawer] = useState<Drawer>(null);
  const row = ex.state.scenario.stations.find((s) => s.id === station);
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (
        ex.online &&
        !ex.state.frozen &&
        detail?.type === "signal" &&
        (moduleEvents[row?.module || ""] || []).includes(detail.value)
      )
        ex.send({ type: "module-event", value: detail.value });
    };
    window.addEventListener("screenforge:input", handler);
    return () => window.removeEventListener("screenforge:input", handler);
  }, [row?.module, ex.online, ex.state.frozen, ex.send]);

  if (!row)
    return (
      <main className="training-app field-app">
        <div className="field-empty">
          <h1>{t("field.stationUnavailable")}</h1>
          <p>{t("field.requestQr")}</p>
        </div>
      </main>
    );

  const aborted = ex.state.phase === "aborted";
  const allMessages = ex.state.messages;
  const messages = allMessages.slice(-6).reverse();
  const phaseState = aborted ? "aborted" : ex.state.frozen ? "paused" : "live";
  const phaseLabel = aborted
    ? t("common.aborted")
    : ex.state.frozen
      ? t("common.paused")
      : t("field.live");

  const surface = <DeviceSurface station={station} host="field" />;

  const actions =
    row.module === "medical" ? (
      <div className="field-action-row">
        {MEDICAL_ACTIONS.map(([value, label]) => (
          <button
            key={value}
            disabled={
              !ex.online ||
              ex.state.frozen ||
              ex.state.interventions[station]?.includes(value)
            }
            onClick={() => ex.send({ type: "intervention", value })}
          >
            {t(label)}
          </button>
        ))}
      </div>
  ) : ["intranet", "hologram"].includes(row.module) ? (
    <div className="field-action-row">
      <button
        disabled={!ex.online || ex.state.frozen}
        onClick={() =>
          ex.send({
            type: "module-event",
            value:
              row.module === "intranet"
                ? "identity.confirmed"
                : "analysis.complete",
          })
        }
      >
        {row.module === "intranet" ? t("field.identity") : t("field.analysis")}
      </button>
    </div>
  ) : null;

  const drawerTitle =
    drawer === "messages"
      ? t("field.messages")
      : drawer === "files"
        ? t("field.personnelFiles")
        : t("field.device");

  return (
    <main className="training-app field-app">
      {aborted && (
        <div className="abort-banner field-abort" role="alert">
          {t("common.aborted")}
        </div>
      )}
      <header className="field-status">
        <div className="field-identity">
          <b>{row.name}</b>
          <span>
            {row.team} · {labelFor("mode", ex.state.scenario.mode)}
          </span>
        </div>
        <div className="field-marks">
          <span className="field-exercise">{t("common.exercise")}</span>
          <span className={`field-phase is-${phaseState}`}>{phaseLabel}</span>
          <span className={`field-link ${ex.online ? "is-up" : "is-down"}`}>
            {ex.online ? t("field.link") : t("field.offline")}
          </span>
        </div>
        <div className="field-tools">
          <button
            className={drawer === "messages" ? "active" : ""}
            onClick={() =>
              setDrawer(drawer === "messages" ? null : "messages")
            }
          >
            {t("field.messages")}
            {allMessages.length ? ` · ${allMessages.length}` : ""}
          </button>
          {row.module === "os" && (
            <button
              className={drawer === "files" ? "active" : ""}
              onClick={() => setDrawer(drawer === "files" ? null : "files")}
            >
              {t("field.files")}
            </button>
          )}
          <button
            className={drawer === "device" ? "active" : ""}
            onClick={() => setDrawer(drawer === "device" ? null : "device")}
          >
            {t("field.device")}
          </button>
        </div>
      </header>
      <section className="field-stage">{surface}</section>
      {actions && <footer className="field-actions">{actions}</footer>}
      {drawer && (
        <div className="field-drawer" role="dialog" aria-label={drawerTitle}>
          <header>
            <b>{drawerTitle}</b>
            <button aria-label={t("common.close")} onClick={() => setDrawer(null)}>
              ×
            </button>
          </header>
          <div className="field-drawer-body">
            {drawer === "messages" ? (
              messages.length ? (
                <ul className="field-messages">
                  {messages.map((m, i) => (
                    <li key={i}>
                      <time>{m.at.toFixed(1)}s</time>
                      {m.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{t("field.noMessages")}</p>
              )
            ) : drawer === "files" ? (
              <DossierCards dossiers={ex.state.scenario.dossiers} />
            ) : (
              <DeviceTools />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
