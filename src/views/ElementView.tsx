import { useEffect, useState } from "react";
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
import "./field.css";

// Operator surface: a fixed viewport that mutates into the interface the
// current state needs (workflow task, module, or abort). No web header and no
// document scroll stack — only the active surface owns the screen.
type Drawer = "messages" | "device" | "files" | null;

// Instrument widgets share one scene component; in the field they render as
// native surfaces (no letterbox) instead of the scaled studio stage.
const INSTRUMENT_SCENES = {
  rotary: "rotary",
  "code-table": "code-table",
  "data-sheet": "data-sheet",
  clock: "clock",
} as const;
function isInstrument(
  module: string,
): module is keyof typeof INSTRUMENT_SCENES {
  return module in INSTRUMENT_SCENES;
}

const MEDICAL_ACTIONS: [string, string][] = [
  ["treated", "Report treatment"],
  ["tourniquet", "Tourniquet reported"],
  ["oxygen", "Oxygen reported"],
  ["evacuated", "Evacuation reported"],
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
          <h1>Station no longer available</h1>
          <p>Ask the trainer for a new QR code.</p>
        </div>
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
  const aborted = ex.state.phase === "aborted";
  const allMessages = ex.state.messages;
  const messages = allMessages.slice(-6).reverse();
  const phaseLabel = aborted
    ? "ABORTED"
    : ex.state.frozen
      ? "PAUSED"
      : "LIVE";

  const surface = instance ? (
    <WorkflowSurface
      config={presentationConfig(present?.scene ?? "terminal", present)}
      stationName={row.name}
      boundProp={row.bindings.prop}
      instance={instance}
      disabled={!ex.online || ex.state.frozen}
      time={ex.state.clock}
      onInput={(value) => ex.send({ type: "interaction", value })}
      onProp={(state) => ex.send({ type: "prop", state })}
    />
  ) : connectState ? (
    <section className="field-connect">
      <h2>Device link</h2>
      <p>Attach the cable to start the device session.</p>
      <button
        disabled={!ex.online || ex.state.frozen}
        onClick={() => ex.send({ type: "prop", state: connectState })}
      >
        Connect device
      </button>
    </section>
  ) : row.module === "tracking" ? (
    <div className="field-map">
      <TacticalMap />
      <div className="field-overlay-panel">
        <h2>Tasking</h2>
        {ex.state.scenario.objectives.map((o) => (
          <p key={o.id}>
            {ex.state.completed.includes(o.id) ? "Complete" : "Open"}: {o.name}
          </p>
        ))}
      </div>
    </div>
  ) : row.module === "camera" ? (
    <CameraFeed station={row.id} publish />
  ) : ["countdown", "access", "lock"].includes(row.module) ? (
    <TrainingTerminal station={row} />
  ) : row.module === "ordnance" ? (
    <OrdnanceConsole station={row} />
  ) : row.module === "beacon" ? (
    <BeaconControl station={row} />
  ) : row.module === "data-sheet" && row.bindings.prop ? (
    <OrdnanceDatasheet
      ordnanceId={
        ex.state.scenario.props.find((p) => p.id === row.bindings.prop)
          ?.ordnanceId || ""
      }
      custom={ex.state.scenario.ordnanceTypes}
    />
  ) : isInstrument(row.module) ? (
    <StageFrame
      key={`${present?.scene ?? row.module}:${row.id}:${present?.revision ?? 0}`}
      scene={present?.scene ?? INSTRUMENT_SCENES[row.module]}
      presentation={present}
      station={row.id}
      mark
      native
    />
  ) : (
    <StageFrame
      key={`${present?.scene ?? row.module}:${row.id}:${present?.revision ?? 0}`}
      scene={present?.scene ?? row.module}
      presentation={present}
      station={row.id}
      mark
    />
  );

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
            {label}
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
        {row.module === "intranet"
          ? "Report identity check"
          : "Report analysis complete"}
      </button>
    </div>
  ) : null;

  const drawerTitle =
    drawer === "messages"
      ? "Messages"
      : drawer === "files"
        ? "Personnel files"
        : "Device";

  return (
    <main className="training-app field-app">
      {aborted && (
        <div className="abort-banner field-abort" role="alert">
          EXERCISE ABORTED
        </div>
      )}
      <header className="field-status">
        <div className="field-identity">
          <b>{row.name}</b>
          <span>
            {row.team} · {ex.state.scenario.mode}
          </span>
        </div>
        <div className="field-marks">
          <span className="field-exercise">EXERCISE</span>
          <span className={`field-phase is-${phaseLabel.toLowerCase()}`}>
            {phaseLabel}
          </span>
          <span className={`field-link ${ex.online ? "is-up" : "is-down"}`}>
            {ex.online ? "LINK" : "OFFLINE"}
          </span>
        </div>
        <div className="field-tools">
          <button
            className={drawer === "messages" ? "active" : ""}
            onClick={() =>
              setDrawer(drawer === "messages" ? null : "messages")
            }
          >
            Messages{allMessages.length ? ` · ${allMessages.length}` : ""}
          </button>
          {row.module === "os" && (
            <button
              className={drawer === "files" ? "active" : ""}
              onClick={() => setDrawer(drawer === "files" ? null : "files")}
            >
              Files
            </button>
          )}
          <button
            className={drawer === "device" ? "active" : ""}
            onClick={() => setDrawer(drawer === "device" ? null : "device")}
          >
            Device
          </button>
        </div>
      </header>
      <section className="field-stage">{surface}</section>
      {actions && <footer className="field-actions">{actions}</footer>}
      {drawer && (
        <div className="field-drawer" role="dialog" aria-label={drawerTitle}>
          <header>
            <b>{drawerTitle}</b>
            <button aria-label="Close" onClick={() => setDrawer(null)}>
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
                <p>No messages.</p>
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
