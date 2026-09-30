import { useState } from "react";
import { useTraining } from "../core/useExercise";
import type { TrainingStation } from "../core/training";
import { Timer } from "../components/Timer";
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
        <span>MAINTENANCE / {st.id.toUpperCase()}</span>
        <b>
          {done
            ? "ISOLATED"
            : expired
              ? "TIME EXPIRED"
              : ex.state.frozen
                ? "STANDBY"
                : "ACTIVE"}
        </b>
      </header>
      <h1>{st.name}</h1>
      {st.module === "countdown" && (
        <Timer
          remaining={remaining}
          format="mmss"
          className="terminal-countdown"
        />
      )}
      <nav className="tab-bar">
        <button onClick={() => setTab("status")}>STATUS</button>
        <button onClick={() => setTab("diagnostics")}>DIAGNOSTICS</button>
        <button onClick={() => setTab("isolation")}>ISOLATION</button>
      </nav>
      {tab === "status" && (
        <>
          <h2>Service isolation required</h2>
          <p>
            Read the active shunt identifier in the current diagnostics report.
            Enter that identifier in the isolation panel. Archived references
            are invalid.
          </p>
          <dl>
            <div>
              <dt>Control source</dt>
              <dd>EXERCISE SERVER</dd>
            </div>
            <div>
              <dt>Interlock</dt>
              <dd>{done ? "RELEASED" : "ENGAGED"}</dd>
            </div>
            <div>
              <dt>Diagnostic report</dt>
              <dd>{report ? "READ" : "NOT LOADED"}</dd>
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
            Read current diagnostics
          </button>
          {report && (
            <table>
              <caption>Shunt registry / current device</caption>
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>State</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>SHUNT A</td>
                  <td>ARCHIVED</td>
                  <td>
                    {(Number(report.code) + 17)
                      .toString()
                      .padStart(report.code.length, "0")}
                  </td>
                </tr>
                <tr>
                  <td>SHUNT B</td>
                  <td>ACTIVE</td>
                  <td>{report.code}</td>
                </tr>
                <tr>
                  <td>SHUNT C</td>
                  <td>OFFLINE</td>
                  <td>NO READOUT</td>
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
            Active shunt identifier
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
            Submit isolation request
          </button>
          <p>
            Incorrect entries cause a brief input lock. Opening a report does
            not stop the timer.
          </p>
        </form>
      )}
      {done && (
        <p className="success" role="status">
          Isolation confirmed. Task completed.
        </p>
      )}
      <footer>SIMULATED DEVICE / EXERCISE ONLY</footer>
    </section>
  );
}
