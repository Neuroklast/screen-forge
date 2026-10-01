import { useState } from "react";
import { useTraining } from "../core/useExercise";
import type { TrainingStation } from "../core/training";
import { Timer } from "../components/Timer";
import { t } from "../i18n";
export function TrainingTerminal({
  station: st,
}: {
  station: TrainingStation;
}) {
  const ex = useTraining(),
    [tab, setTab] = useState("status"),
    [code, setCode] = useState("");
  const done = ex.state.props[st.id],
    remaining = Math.max(0, st.duration - ex.state.clock),
    expired = st.module === "countdown" && remaining <= 0;
  const report = ex.diagnostic?.station === st.id ? ex.diagnostic : null;
  return (
    <section className="training-terminal">
      <header>
        <span>{t("terminal.header", { id: st.id.toUpperCase() })}</span>
        <b>
          {done
            ? t("terminal.state.isolated")
            : expired
              ? t("terminal.state.expired")
              : ex.state.frozen
                ? t("terminal.state.standby")
                : t("terminal.state.active")}
        </b>
      </header>
      <h1 data-sf-anchor="station.name">{st.name}</h1>
      {st.module === "countdown" && (
        <Timer
          remaining={remaining}
          format="mmss"
          className="terminal-countdown"
        />
      )}
      <nav className="tab-bar">
        <button onClick={() => setTab("status")}>{t("terminal.status")}</button>
        <button onClick={() => setTab("diagnostics")}>
          {t("terminal.diagnostics")}
        </button>
        <button onClick={() => setTab("isolation")}>
          {t("terminal.isolation")}
        </button>
      </nav>
      {tab === "status" && (
        <>
          <h2>{t("terminal.serviceIsolation")}</h2>
          <p>{t("terminal.instructions")}</p>
          <dl>
            <div>
              <dt>{t("terminal.controlSource")}</dt>
              <dd>{t("terminal.exerciseServer")}</dd>
            </div>
            <div>
              <dt>{t("terminal.interlock")}</dt>
              <dd>{done ? t("terminal.released") : t("terminal.engaged")}</dd>
            </div>
            <div>
              <dt>{t("terminal.diagnosticReport")}</dt>
              <dd>{report ? t("terminal.read") : t("terminal.notLoaded")}</dd>
            </div>
          </dl>
        </>
      )}
      {tab === "diagnostics" && (
        <>
          <button
            disabled={!ex.online}
            onClick={() => ex.send({ type: "diagnostic" })}
          >
            {t("terminal.readDiagnostics")}
          </button>
          {report && (
            <table>
              <caption>{t("terminal.shuntRegistry")}</caption>
              <thead>
                <tr>
                  <th>{t("terminal.channel")}</th>
                  <th>{t("terminal.stateLabel")}</th>
                  <th>{t("terminal.reference")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{t("terminal.shuntA")}</td>
                  <td>{t("terminal.archived")}</td>
                  <td>
                    {(Number(report.code) + 17)
                      .toString()
                      .padStart(report.code.length, "0")}
                  </td>
                </tr>
                <tr>
                  <td>{t("terminal.shuntB")}</td>
                  <td>{t("terminal.state.active")}</td>
                  <td>{report.code}</td>
                </tr>
                <tr>
                  <td>{t("terminal.shuntC")}</td>
                  <td>{t("terminal.offlineState")}</td>
                  <td>{t("terminal.noReadout")}</td>
                </tr>
              </tbody>
            </table>
          )}
        </>
      )}
      {tab === "isolation" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ex.send({ type: "unlock", code });
            setCode("");
          }}
        >
          <label>
            {t("terminal.activeShunt")}
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="off"
              maxLength={12}
            />
          </label>
          <button
            type="submit"
            disabled={!ex.online || ex.state.frozen || done || expired}
          >
            {t("terminal.submit")}
          </button>
          <p>{t("terminal.hint")}</p>
        </form>
      )}
      {done && (
        <p className="success" role="status">
          {t("terminal.confirmed")}
        </p>
      )}
      <footer>{t("terminal.footer")}</footer>
    </section>
  );
}
