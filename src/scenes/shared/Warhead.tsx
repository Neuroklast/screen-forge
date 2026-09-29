import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SceneHeader, Wave, type SceneProps } from "../Scenes";
import { formatTime, noise } from "../../core/runtime";
import { Changed } from "./Process";
export function warheadState(
  time: number,
  duration: number,
  diagnostic: number | null,
  bypass: number | null,
  hold: number | null,
) {
  const diagnosed = diagnostic !== null && time >= diagnostic + 8;
  const bypassed = bypass !== null && time >= bypass + 7 && diagnosed;
  const safeAt = hold === null ? Infinity : hold + 3;
  const safe = bypassed && safeAt <= time && safeAt < duration;
  return {
    diagnosed,
    bypassed,
    safe,
    expired: time >= duration && !safe,
    left: Math.max(0, duration - (safe ? safeAt : time)),
  };
}
export function Warhead(props: SceneProps) {
  const { config, time, onPlay } = props;
  const [diagnostic, setDiagnostic] = useState<number | null>(null),
    [bypass, setBypass] = useState<number | null>(null),
    [hold, setHold] = useState<number | null>(null),
    [channels, setChannels] = useState([15, 15, 15]),
    [input, setInput] = useState("");
  const targets = [0, 1, 2].map(
    (i) => 25 + Math.floor(noise(i, config.seed) * 50),
  );
  const aligned = channels.every((v, i) => Math.abs(v - targets[i]) <= 2);
  const state = warheadState(time, config.duration, diagnostic, bypass, hold);
  const diagnosticProgress =
    diagnostic === null ? 0 : Math.max(0, Math.min(1, (time - diagnostic) / 8));
  const bypassProgress =
    bypass === null ? 0 : Math.max(0, Math.min(1, (time - bypass) / 7));
  const holdProgress =
    hold === null ? 0 : Math.max(0, Math.min(1, (time - hold) / 3));
  const phase = state.safe
    ? "DISARMED"
    : state.expired
      ? "SIGNAL LOST"
      : state.bypassed
        ? aligned
          ? "READY TO NEUTRALIZE"
          : "FIELD ALIGNMENT"
        : bypass !== null
          ? "CONTROL HANDOVER"
          : state.diagnosed
            ? "BYPASS AVAILABLE"
            : diagnostic !== null
              ? "DIAGNOSTIC SCAN"
              : "ARMED / TIMER ACTIVE";
  const command = "mirror.attach --channel echo --handover local";
  const hack = () => {
    if (!state.diagnosed || state.expired || bypass !== null || !input) return;
    setBypass(time);
    setInput("");
    onPlay?.();
  };
  const beginHold = () => {
    if (!aligned || !state.bypassed || state.expired || state.safe) return;
    setHold(time);
    onPlay?.();
  };
  const cancelHold = () => {
    if (!state.safe) setHold(null);
  };
  const family =
    config.device === "nuclear" ? "NUCLEAR WARHEAD" : "ANTIMATTER WARHEAD";
  return (
    <div
      className={`countdown warhead scene-inner ${state.safe ? "device-safe" : state.expired ? "device-expired" : state.left < 30 ? "critical" : ""}`}
      data-device-state={
        state.safe ? "safe" : state.expired ? "expired" : "armed"
      }
    >
      <SceneHeader config={config} tag={phase} />
      <div className="warhead-heading">
        <span>
          {family} / {config.identifier}
        </span>
        <span>PAYLOAD CONTROL · AUTHORIZATION TIER 04</span>
      </div>
      <div className="warhead-layout">
        <aside className="warhead-core">
          <div className="micro">
            {config.device === "nuclear"
              ? "PAYLOAD INTEGRITY"
              : "CONTAINMENT FIELD"}
          </div>
          <svg
            viewBox="0 0 240 240"
            aria-label="Fictional containment telemetry"
          >
            <g fill="none" stroke="currentColor">
              {[96, 83, 66, 48].map((r, i) => (
                <circle
                  key={r}
                  cx="120"
                  cy="120"
                  r={r}
                  strokeDasharray={i % 2 ? "5 7" : "90 30"}
                  strokeWidth={i === 1 ? 2 : 1}
                  opacity={0.25 + i * 0.18}
                  transform={`rotate(${time * (i % 2 ? -30 : 18) + i * 40} 120 120)`}
                />
              ))}
              {Array.from({ length: 24 }, (_, i) => {
                const angle = (i * Math.PI) / 12;
                return (
                  <line
                    key={i}
                    x1={120 + Math.cos(angle) * 103}
                    y1={120 + Math.sin(angle) * 103}
                    x2={120 + Math.cos(angle) * 111}
                    y2={120 + Math.sin(angle) * 111}
                    opacity={
                      i / 24 <
                      (state.safe ? 1 : 1 - state.left / config.duration)
                        ? 0.9
                        : 0.2
                    }
                  />
                );
              })}
              <path d="M120 85L151 138H89Z" strokeWidth="2" />
              <path d="M120 101V119M120 126V129" strokeWidth="3" />
            </g>
            <text
              x="120"
              y="179"
              textAnchor="middle"
              fill="currentColor"
              fontSize="8"
            >
              {state.safe
                ? "FIELD STABLE"
                : state.expired
                  ? "CARRIER LOST"
                  : "FIELD / ACTIVE"}
            </text>
          </svg>
          <dl>
            {[
              [
                "FIELD COHERENCE",
                state.safe
                  ? "100.0%"
                  : `${(97 + Math.sin(time * 1.2) * 1.4).toFixed(1)}%`,
              ],
              ["CONTROL PATH", state.bypassed ? "LOCAL MIRROR" : "SEALED"],
              ["SERVICE LINK", state.diagnosed ? "VERIFIED" : "UNKNOWN"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>
                  <Changed value={v} />
                </dd>
              </div>
            ))}
          </dl>
          <Wave time={time} seed={config.seed} />
        </aside>
        <main className="warhead-timer">
          <div className="micro">
            {state.safe
              ? "NEUTRALIZATION CONFIRMED"
              : state.expired
                ? "TERMINAL EVENT"
                : "TIME TO TERMINAL EVENT"}
          </div>
          <div className="countdown-digits">{formatTime(state.left)}</div>
          <div className="warhead-milliseconds">
            {state.safe
              ? "TIMER ISOLATED"
              : state.expired
                ? "NO CARRIER"
                : String(Math.floor((state.left % 1) * 1000)).padStart(3, "0") +
                  " / MILLISECOND REFERENCE"}
          </div>
          <div className="countdown-progress">
            <div
              style={{ width: `${(state.left / config.duration) * 100}%` }}
            />
          </div>
          <div className="warhead-state">
            <Changed value={phase} />
          </div>
          <div className="warhead-journal">
            <div className="micro">CONTROL EVENT REGISTER</div>
            {[
              "Arm-state mirror synchronized",
              diagnostic === null
                ? "Service channel awaiting interrogation"
                : !state.diagnosed
                  ? "Reading three isolated control channels…"
                  : "Diagnostic signature verified / bypass route available",
              bypass === null
                ? "Remote authority remains attached"
                : !state.bypassed
                  ? "Negotiating mirror / verifying local handover…"
                  : "Local control acquired / field trims enabled",
              state.safe
                ? "Neutralization complete / timer isolated"
                : state.expired
                  ? "Terminal event reached / telemetry connection lost"
                  : aligned
                    ? "Reference phases aligned"
                    : "Phase field outside neutralization window",
            ].map((line, i) => (
              <motion.div
                key={line}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <span>0{i + 1}</span>
                {line}
              </motion.div>
            ))}
          </div>
          <AnimatePresence>
            {state.safe && (
              <motion.div
                className="warhead-safe-banner"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                DEVICE SAFE
                <span>LOCAL AUTHORITY / NEUTRALIZATION VERIFIED</span>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        <aside className="warhead-controls">
          <div className="micro">SERVICE ACCESS / OVERRIDE</div>
          <section>
            <h3>01 / Interrogate</h3>
            <button
              className="scene-button"
              disabled={diagnostic !== null || state.expired}
              onClick={() => {
                setDiagnostic(time);
                onPlay?.();
              }}
            >
              Run diagnostics
            </button>
            <div className="process-rail">
              <i style={{ width: `${diagnosticProgress * 100}%` }} />
            </div>
            <small>
              {state.diagnosed
                ? "SIGNATURE VERIFIED"
                : diagnostic === null
                  ? "CONTROL CHANNEL SEALED"
                  : `${Math.floor(diagnosticProgress * 100)}% / CHANNEL SCAN`}
            </small>
          </section>
          <section>
            <h3>02 / Mirror bypass</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                hack();
              }}
            >
              <input
                aria-label="Bypass terminal"
                disabled={!state.diagnosed || bypass !== null || state.expired}
                value={input}
                placeholder="Type to stage mirror handover"
                onChange={(e) =>
                  setInput(command.slice(0, e.target.value.length))
                }
                onKeyDown={(e) => {
                  if (e.key.length === 1) {
                    e.preventDefault();
                    setInput((v) => command.slice(0, v.length + 4));
                  }
                }}
              />
              <button
                className="scene-button"
                disabled={!input || bypass !== null || state.expired}
              >
                Execute bypass
              </button>
            </form>
            <div className="process-rail">
              <i style={{ width: `${bypassProgress * 100}%` }} />
            </div>
            <small>
              {state.bypassed
                ? "LOCAL AUTHORITY ACQUIRED"
                : bypass === null
                  ? "DIAGNOSTIC SIGNATURE REQUIRED"
                  : `${Math.floor(bypassProgress * 100)}% / HANDOVER`}
            </small>
          </section>
          <section>
            <h3>03 / Align reference field</h3>
            {channels.map((value, i) => (
              <label key={i}>
                PHASE {["A", "B", "C"][i]}
                <span>
                  REF {targets[i]} / <Changed value={value} />
                </span>
                <input
                  aria-label={`Phase ${["A", "B", "C"][i]}`}
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  disabled={
                    !state.bypassed ||
                    state.expired ||
                    state.safe ||
                    hold !== null
                  }
                  onChange={(e) =>
                    setChannels((v) =>
                      v.map((n, j) => (j === i ? +e.target.value : n)),
                    )
                  }
                />
              </label>
            ))}
          </section>
          <button
            className="neutralize-button"
            disabled={
              !aligned || !state.bypassed || state.expired || state.safe
            }
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              beginHold();
            }}
            onPointerUp={cancelHold}
            onPointerCancel={cancelHold}
            onLostPointerCapture={cancelHold}
            onKeyDown={(e) => {
              if ((e.code === "Space" || e.code === "Enter") && !e.repeat) {
                e.preventDefault();
                beginHold();
              }
            }}
            onKeyUp={(e) => {
              if (e.code === "Space" || e.code === "Enter") {
                e.preventDefault();
                cancelHold();
              }
            }}
            onBlur={cancelHold}
          >
            <i style={{ width: `${holdProgress * 100}%` }} />
            <span>
              {state.safe
                ? "NEUTRALIZED"
                : hold !== null
                  ? `NEUTRALIZING ${Math.floor(holdProgress * 100)}%`
                  : "HOLD TO NEUTRALIZE / 3 SEC"}
            </span>
          </button>
        </aside>
      </div>
      <footer className="scene-footer">
        <span>{family} / SERIES 09</span>
        <span>
          {state.safe
            ? "SAFE STATE LATCHED"
            : "EXTERNAL CLOCK / OPERATOR CONTROL"}
        </span>
      </footer>
    </div>
  );
}
