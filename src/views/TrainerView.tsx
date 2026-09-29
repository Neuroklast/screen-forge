import { patientKinds, type PatientKind } from "../core/patient";
import { stationUrl } from "../core/session";
import { useExerciseMaybe } from "../core/useExercise";
import { loadDossiers, saveDossiers, type Dossier } from "../core/dossiers";
import { useState } from "react";
export function TrainerView({ room }: { room: string }) {
  const ex = useExerciseMaybe();
  const [dossiers, setDossiers] = useState(loadDossiers);
  const [edit, setEdit] = useState<Dossier | null>(null);
  if (!ex) return null;
  const origin = location.origin;
  return (
    <div className="trainer-shell">
      <header>
        <strong>TRAINER</strong>
        <span>{ex.online ? "LINK UP" : "LOCAL / NO SERVER"}</span>
        <span>ROOM {room}</span>
      </header>
      <section>
        <h2>Stations</h2>
        {ex.state.stations.map((s) => (
          <p key={s.id}>
            <b>{s.name}</b> {s.scene}{" "}
            <a href={stationUrl(origin, room, s.role, s.id)} target="_blank">
              open
            </a>
          </p>
        ))}
        <p>
          HQ{" "}
          <a href={stationUrl(origin, room, "hq", "hq")} target="_blank">
            open
          </a>
        </p>
      </section>
      <section>
        <h2>Casualty inject</h2>
        <p>
          {ex.state.patient.name} / {ex.state.patient.kind} / hidden clock{" "}
          {ex.state.frozen ? "FROZEN" : Math.floor(ex.state.clock)}
        </p>
        <div className="trainer-injects">
          {patientKinds.map((k) => (
            <button
              key={k}
              onClick={() =>
                ex.send({ type: "inject", kind: k as PatientKind })
              }
            >
              {k}
            </button>
          ))}
          <button onClick={() => ex.send({ type: "inject", kind: "freeze" })}>
            freeze
          </button>
          <button onClick={() => ex.send({ type: "inject", kind: "play" })}>
            play
          </button>
        </div>
      </section>
      <section>
        <h2>Dossiers</h2>
        {dossiers.map((d) => (
          <button key={d.id} onClick={() => setEdit(d)}>
            {d.id} {d.name}
          </button>
        ))}
        {edit && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const next = dossiers.map((d) => (d.id === edit.id ? edit : d));
              setDossiers(next);
              saveDossiers(next);
              setEdit(null);
            }}
          >
            <input
              value={edit.name}
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            />
            <input
              value={edit.role}
              onChange={(e) => setEdit({ ...edit, role: e.target.value })}
            />
            <textarea
              value={edit.notes}
              onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
            />
            <button type="submit">Save</button>
          </form>
        )}
      </section>
    </div>
  );
}
