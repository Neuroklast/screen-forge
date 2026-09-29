import { useState } from "react";
import type { TrainingStation } from "../core/training";
import { useTraining } from "../core/useExercise";
import "./device.css";

const STAGES = ["Inspect casing", "Read diagnostics", "Set bypass", "Disarm"];

export function OrdnanceConsole({ station }: { station: TrainingStation }) {
  const ex = useTraining();
  const propId = station.bindings.prop;
  const prop = ex.state.scenario.props.find((p) => p.id === propId);
  const state = ex.state.propStates[propId] ?? prop?.initial ?? "armed";
  const [step, setStep] = useState(0);
  const locked = !ex.online || ex.state.frozen || state === "disarmed";

  const run = (index: number) => {
    if (locked) return;
    if (index !== step) {
      ex.send({ type: "prop", state: "tampered" });
      ex.send({ type: "module-event", value: "ordnance.tampered" });
      setStep(0);
      return;
    }
    ex.send({ type: "module-event", value: "ordnance.stage" });
    const next = step + 1;
    setStep(next);
    if (next === 3) ex.send({ type: "prop", state: "bypassed" });
    if (next >= STAGES.length) {
      ex.send({ type: "prop", state: "disarmed" });
      ex.send({ type: "module-event", value: "ordnance.disarmed" });
    }
  };

  return (
    <section className="device-panel">
      <header className="device-head">
        <h2>{station.name}</h2>
        <span className={`device-state is-${state}`}>{state}</span>
      </header>
      <p className="device-note">
        Fictional maintenance console. Run the stages in order.
      </p>
      <ol className="device-stages">
        {STAGES.map((label, i) => (
          <li key={label} className={i < step ? "done" : i === step ? "active" : ""}>
            <button onClick={() => run(i)} disabled={locked}>
              {i + 1}. {label}
            </button>
          </li>
        ))}
      </ol>
      {state === "tampered" && (
        <p className="device-alert">Tampered. Stages reset.</p>
      )}
      {state === "disarmed" && (
        <p className="device-ok">Disarmed. Document the task.</p>
      )}
      <small>{prop?.name || "No ordnance bound"}</small>
    </section>
  );
}
