import { useRef } from "react";
import type { TrainingStation } from "../core/training";
import { useTraining } from "../core/useExercise";
import "./device.css";

export function BeaconControl({ station }: { station: TrainingStation }) {
  const ex = useTraining();
  const propId = station.bindings.prop;
  const prop = ex.state.scenario.props.find((p) => p.id === propId);
  const state = ex.state.propStates[propId] ?? prop?.initial ?? "off";
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locked = !ex.online || ex.state.frozen;

  const press = () => {
    if (locked || state === "active") return;
    timer.current = setTimeout(() => {
      timer.current = null;
      ex.send({ type: "prop", state: "active" });
      ex.send({ type: "module-event", value: "beacon.active" });
    }, 3000);
  };
  const release = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  return (
    <section className="device-panel">
      <header className="device-head">
        <h2>{station.name}</h2>
        <span className={`device-state is-${state}`}>{state}</span>
      </header>
      <p className="device-note">Signal device. Hold three seconds to activate.</p>
      <button
        className="device-hold"
        disabled={locked || state === "active"}
        onPointerDown={press}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
      >
        {state === "active" ? "ACTIVE" : "HOLD TO ACTIVATE"}
      </button>
      {state === "active" && (
        <button
          className="device-secondary"
          disabled={locked}
          onClick={() => ex.send({ type: "prop", state: "off" })}
        >
          Deactivate
        </button>
      )}
      <small>{prop?.name || "No beacon bound"}</small>
    </section>
  );
}
