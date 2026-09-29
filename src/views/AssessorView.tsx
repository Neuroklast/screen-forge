import { useState } from "react";
import { useTraining } from "../core/useExercise";
import "../training/roles.css";

const clock = (at: number) =>
  `${String(Math.floor(at / 60)).padStart(2, "0")}:${String(
    Math.floor(at % 60),
  ).padStart(2, "0")}`;

export function AssessorView({ room }: { room: string }) {
  const ex = useTraining();
  const [text, setText] = useState("");
  return (
    <main className="training-app">
      <header className="field-header">
        <b>Beobachter · {room}</b>
        <span>
          {ex.online ? "verbunden" : "offline"} · {ex.state.phase}
        </span>
      </header>
      {ex.state.phase === "aborted" && (
        <div className="abort-banner" role="alert">
          ÜBUNG ABGEBROCHEN
        </div>
      )}
      <section className="panel">
        <h2>Zeitstrahl</h2>
        <ol className="timeline">
          {ex.state.log.slice(-80).map((entry, i) => (
            <li key={i}>
              <span>{clock(entry.at)}</span> {entry.message}
            </li>
          ))}
          {!ex.state.log.length && <li>Keine Einträge.</li>}
        </ol>
      </section>
      <section className="panel">
        <h2>Notiz</h2>
        <textarea
          aria-label="Beobachternotiz"
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
        <h2>Notizen</h2>
        <ul className="note-list">
          {ex.state.notes.map((note, i) => (
            <li key={i}>
              <span>{clock(note.at)}</span> {note.role}: {note.text}
            </li>
          ))}
          {!ex.state.notes.length && <li>Noch keine Notizen.</li>}
        </ul>
      </section>
    </main>
  );
}
