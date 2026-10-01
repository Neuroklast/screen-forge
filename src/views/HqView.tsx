import { useTraining } from "../core/useExercise";
import { TacticalMap } from "../training/TacticalMap";
import { CameraFeed } from "../training/CameraFeed";
import { DossierCards } from "../training/Dossiers";
import { DeviceTools } from "../training/DeviceTools";
import { vitalsOf } from "../core/patient";
import { labelFor } from "../core/labels";
import { t } from "../i18n";
export function HqView({ room }: { room: string }) {
  const ex = useTraining();
  return (
    <main className="training-app hq-view">
      <header className="training-header">
        <div>
          <span className="eyebrow">{t("hq.eyebrow", { room })}</span>
          <h1>{ex.state.scenario.name}</h1>
        </div>
        <span>
          {t(ex.online ? "common.connectedTitle" : "common.offlineTitle")} ·{" "}
          {ex.state.frozen
            ? t("common.paused")
            : labelFor("mode", ex.state.scenario.mode)}
        </span>
      </header>
      <div className="training-columns">
        <TacticalMap />
        <section className="panel">
          <h2>{t("hq.situation")}</h2>
          {ex.state.scenario.objectives.map((o) => (
            <p key={o.id}>
              {t(
                ex.state.completed.includes(o.id)
                  ? "hq.completed"
                  : "hq.open",
              )}
              : {o.name}
            </p>
          ))}
          <h3>{t("hq.stations")}</h3>
          {ex.state.scenario.stations.map((s) => (
            <p key={s.id}>
              {s.name} ·{" "}
              {t(
                ex.state.presence[s.id]?.online
                  ? "common.connectedTitle"
                  : "common.offlineTitle",
              )}
            </p>
          ))}
          {ex.state.scenario.patients.map((p) => {
            const v = {
              ...vitalsOf(p, ex.state.clock, ex.state.scenario.seed),
              ...p.overrides,
            };
            return (
              <div className="hq-patient-card" key={p.id}>
                <h3>
                  {p.name} · {labelFor("triage", p.triage)}
                </h3>
                <p>
                  HR {v.hr} · SpO₂ {v.spo2}% · NIBP {v.sys}/{v.dia}
                </p>
                <small>{p.injuries}</small>
              </div>
            );
          })}
        </section>
      </div>
      <div className="training-columns">
        {ex.state.scenario.stations
          .filter((s) => s.module === "camera")
          .map((s) => (
            <CameraFeed key={s.id} station={s.id} />
          ))}
      </div>
      <DossierCards dossiers={ex.state.scenario.dossiers} />
      <section className="panel">
        <h2>{t("hq.log")}</h2>
        <ol className="event-log">
          {ex.state.log
            .slice(-40)
            .reverse()
            .map((e, i) => (
              <li key={i}>
                <time>{e.at.toFixed(0)}s</time>
                {e.message}
              </li>
            ))}
        </ol>
      </section>
      {ex.state.messages.length > 0 && (
        <section className="panel">
          <h2>{t("hq.messages")}</h2>
          <ul className="event-log">
            {ex.state.messages.slice(-8).map((m, i) => (
              <li key={i}>
                <time>{m.at.toFixed(0)}s</time>
                {m.text}
              </li>
            ))}
          </ul>
        </section>
      )}
      <DeviceTools />
    </main>
  );
}
