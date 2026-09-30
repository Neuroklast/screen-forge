import { useEffect } from "react";
import { moduleEvents } from "../core/training";
import { presentationConfig } from "../core/config";
import { WorkflowSurface } from "../scenes/workflow/Surfaces";
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
  const present = row.presentation;
  const instance =
    Object.values(ex.state.workflows).find((i) => i.status === "running") ??
    Object.values(ex.state.workflows)[0];
  const pending = (ex.state.workflowTriggers ?? []).find(
    (t) =>
      t.trigger.type === "prop" &&
      t.trigger.prop === row.bindings.prop &&
      ex.state.propStates[t.trigger.prop] !== t.trigger.to,
  );
  const connectState =
    pending?.trigger.type === "prop" ? pending.trigger.to : "";
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
      {!instance && connectState && (
        <section className="panel wf-connect">
          <h2>Device link</h2>
          <p>Attach the cable to start the device session.</p>
          <button
            disabled={!ex.online || ex.state.frozen}
            onClick={() => ex.send({ type: "prop", state: connectState })}
          >
            Connect device
          </button>
        </section>
      )}
      {instance ? (
        <WorkflowSurface
          config={presentationConfig(present?.scene ?? "terminal", present)}
          stationName={row.name}
          boundProp={row.bindings.prop}
          instance={instance}
          disabled={!ex.online || ex.state.frozen}
          onInput={(value) => ex.send({ type: "interaction", value })}
          onProp={(state) => ex.send({ type: "prop", state })}
        />
      ) : row.module === "tracking" ? (
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
          <StageFrame
            key={`${present?.scene ?? "os"}:${row.id}:${present?.revision ?? 0}`}
            scene={present?.scene ?? "os"}
            presentation={present}
            station={row.id}
            mark
          />
          <DossierCards dossiers={ex.state.scenario.dossiers} />
        </>
      ) : row.module === "terminal" ? (
        <StageFrame
          key={`${present?.scene ?? "terminal"}:${row.id}:${present?.revision ?? 0}`}
          scene={present?.scene ?? "terminal"}
          presentation={present}
          station={row.id}
          mark
        />
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
          key={`${present?.scene ?? row.module}:${row.bindings.patient}:${present?.revision ?? 0}`}
          scene={present?.scene ?? row.module}
          presentation={present}
          station={row.id}
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
