import { useState } from "react";
import type { TrainingStation } from "../core/training";
import { useTraining } from "../core/useExercise";
import { resolveOrdnanceType } from "../core/ordnance";
import { t } from "../i18n";
import "./device.css";

// The stage list and failure modes come from the mission's ordnance catalogue
// entry, so the console stays in sync with the data sheet. The fallback stages
// are localized chrome.
const FALLBACK_STAGE_KEYS = [
  "ordnance.stage.casing",
  "ordnance.stage.diagnostics",
  "ordnance.stage.bypass",
  "ordnance.stage.disarm",
];

export function OrdnanceConsole({ station }: { station: TrainingStation }) {
  const ex = useTraining();
  const propId = station.bindings.prop;
  const prop = ex.state.scenario.props.find((p) => p.id === propId);
  const state = ex.state.propStates[propId] ?? prop?.initial ?? "armed";
  const entry = resolveOrdnanceType(
    prop?.ordnanceId || "",
    ex.state.scenario.ordnanceTypes,
  );
  const stages = entry?.stages ?? FALLBACK_STAGE_KEYS.map((key) => t(key));
  const [step, setStep] = useState(0);
  const [methodId, setMethodId] = useState(entry?.methods[0]?.id ?? "");
  const method = entry?.methods.find((m) => m.id === methodId);
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
    if (next === stages.length - 1) ex.send({ type: "prop", state: "bypassed" });
    if (next >= stages.length) {
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
      {entry && (
        <p className="device-note">
          {entry.designation} · {entry.category}
        </p>
      )}
      <p className="device-note">
        Fictional maintenance console. Run the stages in order.
      </p>
      {entry && entry.methods.length > 1 && (
        <label className="device-note">
          Method
          <select
            value={methodId}
            onChange={(e) => setMethodId(e.target.value)}
            disabled={locked}
          >
            {entry.methods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <ol className="device-stages">
        {stages.map((label, i) => (
          <li
            key={label}
            className={i < step ? "done" : i === step ? "active" : ""}
          >
            <button onClick={() => run(i)} disabled={locked}>
              {i + 1}. {label}
            </button>
          </li>
        ))}
      </ol>
      {method && (
        <ul className="device-steps">
          {method.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
      {state === "tampered" && (
        <p className="device-alert">{t("ordnance.tampered")}</p>
      )}
      {state === "disarmed" && (
        <p className="device-ok">{t("ordnance.disarmed")}</p>
      )}
      {entry && entry.failures.length > 0 && (
        <details className="device-failures">
          <summary>{t("ordnance.failureModes")}</summary>
          <ul>
            {entry.failures.map((f) => (
              <li key={f.id}>
                <b>{f.name}</b> — {f.trigger} ({f.outcome})
              </li>
            ))}
          </ul>
        </details>
      )}
      <small>{prop?.name || "No ordnance bound"}</small>
    </section>
  );
}
