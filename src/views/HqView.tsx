import { useTraining } from "../core/useExercise";
import { TacticalMap } from "../training/TacticalMap";
import { CameraFeed } from "../training/CameraFeed";
import { DossierCards } from "../training/Dossiers";
import { DeviceTools } from "../training/DeviceTools";
import { vitalsOf } from "../core/patient";
export function HqView({ room }: { room: string }) {
  const ex = useTraining();
  return (
    <main className="training-app hq-view">
      <header className="training-header">
        <div>
          <span className="eyebrow">OPERATIONS / HQ · {room}</span>
          <h1>{ex.state.scenario.name}</h1>
        </div>
        <span>
          {ex.online ? "Verbunden" : "Offline"} ·{" "}
          {ex.state.frozen ? "PAUSIERT" : ex.state.scenario.mode}
        </span>
      </header>
      <div className="training-columns">
        <TacticalMap />
        <section className="panel">
          <h2>Lageübersicht</h2>
          {ex.state.scenario.objectives.map((o) => (
            <p key={o.id}>
              {ex.state.completed.includes(o.id) ? "Abgeschlossen" : "Offen"}:{" "}
              {o.name}
            </p>
          ))}
          <h3>Stationen</h3>
          {ex.state.scenario.stations.map((s) => (
            <p key={s.id}>
              {s.name} ·{" "}
              {ex.state.presence[s.id]?.online ? "Verbunden" : "Offline"}
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
                  {p.name} · {p.triage}
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
        <h2>Einsatzprotokoll</h2>
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
      <DeviceTools />
    </main>
  );
}
