import { useState } from "react";
import { useTraining } from "../core/useExercise";
import { t } from "../i18n";
import "../training/roles.css";

export function SafetyView({ room }: { room: string }) {
  const ex = useTraining();
  const [text, setText] = useState("");
  const aborted = ex.state.phase === "aborted";
  return (
    <main className="training-app">
      <header className="field-header">
        <b>{t("safety.title", { room })}</b>
        <span>
          {t(ex.online ? "common.connected" : "common.offline")} ·{" "}
          {ex.state.phase}
        </span>
      </header>
      {aborted && (
        <div className="abort-banner" role="alert">
          {t("common.aborted")}
        </div>
      )}
      <section className="panel">
        <h2>{t("safety.abortTitle")}</h2>
        <p>{t("safety.abortText")}</p>
        <div className="button-row">
          <button
            className="danger"
            disabled={!ex.online || aborted}
            onClick={() => ex.send({ type: "abort" })}
          >
            {t("safety.abort")}
          </button>
          <button
            disabled={!ex.online || ex.state.frozen || aborted}
            onClick={() => ex.send({ type: "transport", command: "pause" })}
          >
            {t("safety.pause")}
          </button>
        </div>
      </section>
      <section className="panel">
        <h2>{t("common.note")}</h2>
        <textarea
          aria-label={t("safety.noteLabel")}
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
        <h2>{t("safety.status")}</h2>
        <p>
          {t("safety.statusLine", {
            stations: ex.state.scenario.stations.length,
            patients: ex.state.scenario.patients.length,
            phase: ex.state.phase,
          })}
        </p>
        <ul className="presence-list">
          {Object.entries(ex.state.presence).map(([id, p]) => (
            <li key={id}>
              {id}: {t(p.online ? "common.connected" : "common.offline")}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
