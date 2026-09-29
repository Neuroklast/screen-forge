import { Activity, Radio } from "lucide-react";
import { StageFrame } from "./StageFrame";
import { useExerciseMaybe } from "../core/useExercise";
import { useSceneClock } from "../core/runtime";
import { vitalsOf } from "../core/patient";
import "./hq.css";

export function HqView({ room }: { room: string }) {
  const ex = useExerciseMaybe();
  const clock = useSceneClock();
  const patient = ex?.state.patient;
  const v = patient ? vitalsOf(patient, clock.elapsed, 2048) : null;
  const elements = ex?.state.stations.filter((s) => s.role === "element") ?? [];
  return (
    <div className="hq">
      <header className="hq-bar">
        <div>
          <strong>OPERATIONS</strong>
          <span>HQ / Read-only</span>
        </div>
        <div className={`hq-link ${ex?.online ? "up" : "down"}`}>
          <Radio size={12} />
          {ex?.online ? "Room verbunden" : "Kein Server"}
        </div>
        <div>
          Raum <code>{room}</code>
        </div>
      </header>
      <div className="hq-grid">
        <aside className="hq-rail">
          <h2>Elemente</h2>
          <ul>
            {elements.map((s) => (
              <li key={s.id}>
                <b>{s.name}</b>
                <small>
                  {s.scene} · {s.id}
                </small>
              </li>
            ))}
          </ul>
          {patient && v && (
            <div className="hq-casualty">
              <h2>Casualty</h2>
              <div className="hq-patient">
                <span>{patient.name}</span>
                <b data-kind={patient.kind}>{patient.kind.toUpperCase()}</b>
              </div>
              <dl>
                <div>
                  <dt>HR</dt>
                  <dd>{v.hr}</dd>
                </div>
                <div>
                  <dt>SpO2</dt>
                  <dd>{v.spo2}</dd>
                </div>
                <div>
                  <dt>RR</dt>
                  <dd>{v.rr}</dd>
                </div>
                <div>
                  <dt>NIBP</dt>
                  <dd>
                    {v.sys}/{v.dia}
                  </dd>
                </div>
              </dl>
              <p className="hq-note">
                <Activity size={12} /> Keine Steuerung auf dieser Ansicht.
              </p>
            </div>
          )}
        </aside>
        <main className="hq-stage">
          <StageFrame scene="tracking" />
        </main>
      </div>
    </div>
  );
}
