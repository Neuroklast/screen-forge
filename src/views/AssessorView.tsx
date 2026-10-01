import { useState } from "react";
import { useTraining } from "../core/useExercise";
import { labelFor } from "../core/labels";
import { t } from "../i18n";
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
        <b>{t("assessor.title", { room })}</b>
        <span>
          {t(ex.online ? "common.connected" : "common.offline")} ·{" "}
          {labelFor("phase", ex.state.phase)}
        </span>
      </header>
      {ex.state.phase === "aborted" && (
        <div className="abort-banner" role="alert">
          {t("common.aborted")}
        </div>
      )}
      <section className="panel">
        <h2>{t("assessor.timeline")}</h2>
        <ol className="timeline">
          {ex.state.log.slice(-80).map((entry, i) => (
            <li key={i}>
              <span>{clock(entry.at)}</span> {entry.message}
            </li>
          ))}
          {!ex.state.log.length && <li>{t("assessor.noEntries")}</li>}
        </ol>
      </section>
      <section className="panel">
        <h2>{t("common.note")}</h2>
        <textarea
          aria-label={t("assessor.noteLabel")}
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
          {t("common.saveNote")}
        </button>
      </section>
      <section className="panel">
        <h2>{t("assessor.notes")}</h2>
        <ul className="note-list">
          {ex.state.notes.map((note, i) => (
            <li key={i}>
              <span>{clock(note.at)}</span> {note.role}: {note.text}
            </li>
          ))}
          {!ex.state.notes.length && <li>{t("assessor.noNotes")}</li>}
        </ul>
      </section>
    </main>
  );
}
