import { useEffect, useState } from "react";
import {
  Activity,
  Copy,
  ExternalLink,
  Pause,
  Play,
  Radio,
  Shield,
} from "lucide-react";
import { patientKinds, vitalsOf, type PatientKind } from "../core/patient";
import { stationUrl } from "../core/session";
import { useExerciseMaybe } from "../core/useExercise";
import { loadDossiers, saveDossiers, type Dossier } from "../core/dossiers";
import { useSceneClock } from "../core/runtime";
import "./trainer.css";

const injects: { kind: PatientKind; label: string }[] = [
  { kind: "stable", label: "Stabil" },
  { kind: "tachy", label: "Tachykardie" },
  { kind: "brady", label: "Bradykardie" },
  { kind: "desat", label: "Desaturation" },
  { kind: "trauma", label: "Trauma" },
  { kind: "arrest", label: "Arrest" },
  { kind: "recovered", label: "Recovered" },
];

export function TrainerView({ room }: { room: string }) {
  const ex = useExerciseMaybe();
  const clock = useSceneClock();
  const [dossiers, setDossiers] = useState(loadDossiers);
  const [edit, setEdit] = useState<Dossier | null>(dossiers[0] ?? null);
  const [copied, setCopied] = useState("");
  useEffect(() => {
    if (!ex || ex.state.frozen) return;
    ex.send({ type: "clock", clock: clock.elapsed });
  }, [Math.floor(clock.elapsed), ex?.state.frozen]);
  if (!ex) return null;
  const origin = location.origin;
  const v = vitalsOf(ex.state.patient, clock.elapsed, 2048);
  const copy = (href: string, id: string) => {
    void navigator.clipboard.writeText(href);
    setCopied(id);
    setTimeout(() => setCopied(""), 1200);
  };
  const saveEdit = () => {
    if (!edit) return;
    const next = dossiers.map((d) => (d.id === edit.id ? edit : d));
    setDossiers(next);
    saveDossiers(next);
  };
  return (
    <div className="trainer">
      <header className="trainer-bar">
        <div>
          <strong>SCREENFORGE</strong>
          <span>Instructor</span>
        </div>
        <div className={`trainer-link ${ex.online ? "up" : "down"}`}>
          <Radio size={12} />
          {ex.online ? "Server verbunden" : "Kein Server — lokal"}
        </div>
        <div className="trainer-clock">
          <span>Versteckte Uhr</span>
          <b>{ex.state.frozen ? "PAUSE" : clock.elapsed.toFixed(0).padStart(4, "0")}s</b>
        </div>
        <div>
          Raum <code>{room}</code>
        </div>
      </header>
      <div className="trainer-grid">
        <section className="trainer-col">
          <h2>Stationen</h2>
          <p className="trainer-hint">
            Jede Station ist eine eigene Instanz. Öffnen oder Link kopieren.
          </p>
          <ul className="trainer-stations">
            {ex.state.stations.map((s) => {
              const href = stationUrl(origin, room, s.role, s.id);
              return (
                <li key={s.id}>
                  <div>
                    <b>{s.name}</b>
                    <small>
                      {s.role === "hq" ? "HQ" : "Element"} · {s.scene} · {s.id}
                    </small>
                  </div>
                  <div className="trainer-actions">
                    <button
                      type="button"
                      onClick={() => copy(href, s.id)}
                      aria-label={`Link ${s.name}`}
                    >
                      <Copy size={14} />
                      {copied === s.id ? "Kopiert" : "Link"}
                    </button>
                    <a href={href} target="_blank" rel="noreferrer">
                      <ExternalLink size={14} />
                      Öffnen
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="trainer-col trainer-casualty">
          <h2>Casualty</h2>
          <div className="trainer-status">
            <span>{ex.state.patient.name}</span>
            <b data-kind={ex.state.patient.kind}>
              {ex.state.patient.kind.toUpperCase()}
            </b>
          </div>
          <dl className="trainer-vitals">
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
            <div>
              <dt>GCS</dt>
              <dd>{v.gcs}</dd>
            </div>
            <div>
              <dt>Temp</dt>
              <dd>{v.temp.toFixed(1)}</dd>
            </div>
          </dl>
          <p className="trainer-hint">
            Nur hier sichtbar. Die Bühne zeigt den Monitor, nicht diese Steuerung.
          </p>
          <div className="trainer-injects">
            {injects.map((item) => (
              <button
                key={item.kind}
                type="button"
                className={
                  ex.state.patient.kind === item.kind ? "active" : ""
                }
                onClick={() => ex.send({ type: "inject", kind: item.kind })}
              >
                <Activity size={14} />
                {item.label}
              </button>
            ))}
          </div>
          <div className="trainer-transport">
            <button
              type="button"
              className={ex.state.frozen ? "active" : ""}
              onClick={() => ex.send({ type: "inject", kind: "freeze" })}
            >
              <Pause size={14} /> Pause
            </button>
            <button
              type="button"
              onClick={() => ex.send({ type: "inject", kind: "play" })}
            >
              <Play size={14} /> Lauf
            </button>
          </div>
        </section>
        <section className="trainer-col">
          <h2>Akten</h2>
          <div className="trainer-dossiers">
            {dossiers.map((d) => (
              <button
                key={d.id}
                type="button"
                className={edit?.id === d.id ? "active" : ""}
                onClick={() => setEdit(d)}
              >
                {d.photo ? <img src={d.photo} alt="" /> : <Shield size={16} />}
                <span>
                  <b>{d.name}</b>
                  <small>{d.id}</small>
                </span>
              </button>
            ))}
          </div>
          {edit && (
            <form
              className="trainer-form"
              onSubmit={(e) => {
                e.preventDefault();
                saveEdit();
              }}
            >
              <label>
                Name
                <input
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </label>
              <label>
                Rolle
                <input
                  value={edit.role}
                  onChange={(e) => setEdit({ ...edit, role: e.target.value })}
                />
              </label>
              <label>
                Blutgruppe
                <input
                  value={edit.blood}
                  onChange={(e) => setEdit({ ...edit, blood: e.target.value })}
                />
              </label>
              <label>
                Allergien
                <input
                  value={edit.allergies}
                  onChange={(e) =>
                    setEdit({ ...edit, allergies: e.target.value })
                  }
                />
              </label>
              <label>
                Einrichtung
                <input
                  value={edit.facility}
                  onChange={(e) =>
                    setEdit({ ...edit, facility: e.target.value })
                  }
                />
              </label>
              <label>
                Notiz
                <textarea
                  value={edit.notes}
                  rows={4}
                  onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
                />
              </label>
              <button type="submit">Akte speichern</button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
