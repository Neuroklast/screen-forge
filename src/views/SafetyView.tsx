import { useState } from "react";
import { useTraining } from "../core/useExercise";
import "../training/roles.css";

export function SafetyView({ room }: { room: string }) {
  const ex = useTraining();
  const [text, setText] = useState("");
  const aborted = ex.state.phase === "aborted";
  return (
    <main className="training-app">
      <header className="field-header">
        <b>Sicherheit · {room}</b>
        <span>
          {ex.online ? "verbunden" : "offline"} · {ex.state.phase}
        </span>
      </header>
      {aborted && (
        <div className="abort-banner" role="alert">
          ÜBUNG ABGEBROCHEN
        </div>
      )}
      <section className="panel">
        <h2>Abbruch</h2>
        <p>
          Sofortiger Übungsabbruch, unabhängig von der Übungsleitung. Kein
          Bestätigungsdialog.
        </p>
        <div className="button-row">
          <button
            className="danger"
            disabled={!ex.online || aborted}
            onClick={() => ex.send({ type: "abort" })}
          >
            Übung abbrechen
          </button>
          <button
            disabled={!ex.online || ex.state.frozen || aborted}
            onClick={() => ex.send({ type: "transport", command: "pause" })}
          >
            Pause
          </button>
        </div>
      </section>
      <section className="panel">
        <h2>Notiz</h2>
        <textarea
          aria-label="Sicherheitsnotiz"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          disabled={!ex.online || !text.trim()}
          onClick={() => {
            ex.send({ type: "note", text });
            setText("");
          }}
        >
          Notiz speichern
        </button>
      </section>
      <section className="panel">
        <h2>Status</h2>
        <p>
          {ex.state.scenario.stations.length} Geräte ·{" "}
          {ex.state.scenario.patients.length} Patienten · Phase {ex.state.phase}
        </p>
        <ul className="presence-list">
          {Object.entries(ex.state.presence).map(([id, p]) => (
            <li key={id}>
              {id}: {p.online ? "online" : "offline"}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
