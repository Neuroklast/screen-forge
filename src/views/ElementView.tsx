import { useEffect } from "react";
import { moduleEvents } from "../core/training";
import { StageFrame } from "./StageFrame";
import { useTraining } from "../core/useExercise";
import { TacticalMap } from "../training/TacticalMap";
import { CameraFeed } from "../training/CameraFeed";
import { DeviceTools } from "../training/DeviceTools";
import { DossierCards } from "../training/Dossiers";
import { TrainingTerminal } from "../training/TrainingTerminal";
import { OrdnanceConsole } from "../training/OrdnanceConsole";
import { OrdnanceDatasheet } from "../training/OrdnanceDatasheet";
import { BeaconControl } from "../training/BeaconControl";
import "../training/roles.css";
export function ElementView({ station }: { station: string }) {
  const ex = useTraining(),
    row = ex.state.scenario.stations.find((s) => s.id === station);
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
      <main className="training-app">
        <h1>Station no longer available</h1>
        <p>Ask the trainer for a new QR code.</p>
      </main>
    );
  return (
    <main className="training-app field-view">
      <header className="field-header">
        <b>{row.name}</b>
        <span>
          {row.team} · {ex.state.frozen ? "PAUSED" : ex.state.scenario.mode} ·
          EXERCISE
        </span>
      </header>
      {ex.state.phase === "aborted" && (
        <div className="abort-banner" role="alert">
          EXERCISE ABORTED
        </div>
      )}
      {row.module === "tracking" ? (
        <>
          <TacticalMap />
          <section className="panel">
            <h2>Tasking</h2>
            {ex.state.scenario.objectives.map((o) => (
              <p key={o.id}>
                {ex.state.completed.includes(o.id) ? "Complete" : "Open"}:{" "}
                {o.name}
              </p>
            ))}
          </section>
        </>
      ) : row.module === "camera" ? (
        <CameraFeed station={row.id} publish />
      ) : row.module === "os" ? (
        <>
          <StageFrame key={`os:${row.id}`} scene="os" mark />
          <DossierCards dossiers={ex.state.scenario.dossiers} />
        </>
      ) : row.module === "terminal" ? (
        <StageFrame key={`terminal:${row.id}`} scene="terminal" mark />
      ) : ["countdown", "access", "lock"].includes(row.module) ? (
        <TrainingTerminal station={row} />
      ) : row.module === "ordnance" ? (
        <OrdnanceConsole station={row} />
      ) : row.module === "data-sheet" && row.bindings.prop ? (
        <OrdnanceDatasheet
          ordnanceId={
            ex.state.scenario.props.find((p) => p.id === row.bindings.prop)
              ?.ordnanceId || ""
          }
          custom={ex.state.scenario.ordnanceTypes}
        />
      ) : row.module === "beacon" ? (
        <BeaconControl station={row} />
      ) : (
        <StageFrame
          key={`${row.module}:${row.bindings.patient}`}
          scene={row.module}
          mark
        />
      )}
      {row.module === "medical" && (
        <section className="panel">
          <p>
            {
              ex.state.scenario.patients.find((p) => p.id === row.bindings.patient)
                ?.injuries
            }
          </p>
          <div className="button-row">
            {[
              ["treated", "Report treatment"],
              ["tourniquet", "Tourniquet reported"],
              ["oxygen", "Oxygen reported"],
              ["evacuated", "Evacuation reported"],
            ].map(([value, label]) => (
              <button
                key={value}
                disabled={
                  !ex.online ||
                  ex.state.frozen ||
                  ex.state.interventions[station]?.includes(value)
                }
                onClick={() => ex.send({ type: "intervention", value })}
              >
                {label}
              </button>
            ))}
          </div>
          <small>
            Simulated values. Actions are logged; the scenario defines
            their effect.
          </small>
        </section>
      )}
      {["corporate", "hologram"].includes(row.module) && (
        <section className="panel">
          <button
            disabled={!ex.online || ex.state.frozen}
            onClick={() =>
              ex.send({
                type: "module-event",
                value:
                  row.module === "corporate"
                    ? "identity.confirmed"
                    : "analysis.complete",
              })
            }
          >
            {row.module === "corporate"
              ? "Report identity check"
              : "Report analysis complete"}
          </button>
        </section>
      )}
      {ex.state.messages.length > 0 && (
        <section className="panel">
          <h2>Messages</h2>
          <ul className="event-log">
            {ex.state.messages.slice(-6).map((m, i) => (
              <li key={i}>{m.text}</li>
            ))}
          </ul>
        </section>
      )}
      <DeviceTools />
    </main>
  );
}
