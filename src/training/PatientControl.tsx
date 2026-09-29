import { useState } from "react";
import { kinds, vitalSchema, type TrainingPatient } from "../core/training";
import { vitalsOf, type Vitals } from "../core/patient";
import { useTraining } from "../core/useExercise";
export function PatientControl({ patient: p }: { patient: TrainingPatient }) {
  const ex = useTraining(),
    [draft, setDraft] = useState<TrainingPatient | null>(null),
    [error, setError] = useState("");
  const current = draft || p,
    v = {
      ...vitalsOf(current, ex.state.clock, ex.state.scenario.seed),
      ...current.overrides,
    };
  const save = () => {
    const result = vitalSchema.safeParse(v);
    if (!result.success || v.dia > v.sys) {
      setError(
        "Werte außerhalb des Bereichs oder diastolischer Druck größer als systolischer Druck.",
      );
      return;
    }
    ex.send({ type: "patient", patient: current });
    setDraft(null);
    setError("");
  };
  return (
    <section className="panel">
      <div className="section-heading">
        <h3>{p.name}</h3>
        <span>{p.kind}</span>
      </div>
      <div className="button-row">
        {kinds.map((kind) => (
          <button
            disabled={!ex.online}
            key={kind}
            className={p.kind === kind ? "active" : ""}
            onClick={() => {
              setDraft(null);
              ex.send({
                type: "action",
                action: { type: "patient", target: p.id, kind },
              });
            }}
          >
            {kind}
          </button>
        ))}
      </div>
      <div className="vital-controls">
        {(Object.keys(v) as (keyof Vitals)[]).map((k) => (
          <label key={k}>
            {k.toUpperCase()}
            <input
              type="number"
              step={k === "temp" ? ".1" : "1"}
              value={Math.round(v[k] * 10) / 10}
              onChange={(e) =>
                setDraft({
                  ...current,
                  overrides: {
                    ...current.overrides,
                    [k]: Number(e.target.value),
                  },
                })
              }
            />
          </label>
        ))}
      </div>
      <label>
        Triage
        <select
          value={current.triage}
          onChange={(e) =>
            setDraft({
              ...current,
              triage: e.target.value as TrainingPatient["triage"],
            })
          }
        >
          {["green", "yellow", "red", "black"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label>
        Befund
        <textarea
          value={current.injuries}
          onChange={(e) => setDraft({ ...current, injuries: e.target.value })}
        />
      </label>
      <div className="button-row">
        <button disabled={!draft || !ex.online} onClick={save}>
          Werte übernehmen
        </button>
        <button onClick={() => setDraft(null)}>Verwerfen</button>
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
