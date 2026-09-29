import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SceneHeader, type SceneProps } from "../Scenes";
import { clockParts, formatTime, noise, scriptedInput } from "../../core/runtime";
import { Changed } from "./Process";
import { AtomEmblem } from "../../components/BrandMark";
import { playSound } from "../../core/sound";
import {
  armingLog,
  armingProgress,
  armingStage,
  armingStages,
  generateTelemetry,
  sci,
} from "./warheadPhysics";
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
function PhaseTrim({
  label,
  value,
  target,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  target: number;
  disabled: boolean;
  onChange: (n: number) => void;
}) {
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const setFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onChange(clamp(((e.clientX - r.left) / Math.max(1, r.width)) * 100));
  };
  const aligned = Math.abs(value - target) <= 2;
  return (
    <div className={`phase-trim ${aligned ? "is-aligned" : ""}`}>
      <div className="phase-trim-head">
        <span>{label}</span>
        <b>
          {String(value).padStart(2, "0")}
          <small>REF {String(target).padStart(2, "0")}</small>
        </b>
      </div>
      <div
        className="phase-bar"
        role="slider"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            onChange(clamp(value + 1));
          }
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            onChange(clamp(value - 1));
          }
        }}
        onPointerDown={(e) => {
          if (disabled || e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          setFromEvent(e);
        }}
        onPointerMove={(e) => {
          if (disabled || !e.currentTarget.hasPointerCapture(e.pointerId))
            return;
          setFromEvent(e);
        }}
      >
        {Array.from({ length: 20 }, (_, i) => (
          <i
            key={i}
            className={i < Math.round(value / 5) ? "lit" : ""}
          />
        ))}
        <em style={{ left: `${target}%` }} />
      </div>
    </div>
  );
}
export function Warhead(props: SceneProps) {
  const { config, time, onPlay, onCue } = props;
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
  useEffect(() => {
    if (state.safe)
      window.dispatchEvent(
        new CustomEvent("screenforge:input", {
          detail: { type: "signal", value: "device.safe" },
        }),
      );
    else if (state.expired) {
      playSound("alert");
      window.dispatchEvent(
        new CustomEvent("screenforge:input", {
          detail: { type: "signal", value: "device.expired" },
        }),
      );
    }
  }, [state.safe, state.expired]);
  const warn =
    state.safe || state.expired
      ? 0
      : state.left <= 10
        ? 3
        : state.left <= config.duration * 0.25
          ? 2
          : state.left <= config.duration * 0.5
            ? 1
            : 0;
  useEffect(() => {
    if (!warn) return;
    playSound("alert");
    onCue("warning");
  }, [warn]);
  useEffect(() => {
    if (!warn) return;
    const sec = Math.floor(state.left);
    if (warn >= 2 || sec % 2 === 0) playSound("beep");
  }, [Math.floor(state.left), warn]);
  const progress = armingProgress(time, config.duration, state.safe);
  const arm = armingStage(state.expired ? 1 : progress);
  const tel = generateTelemetry(
    state.expired ? 1 : progress,
    Math.floor(time * 2) / 2,
    config.seed,
  );
  const logs = armingLog(state.expired ? 1 : progress, time, config.seed);
  const phase = state.safe
    ? "CONTAINMENT_RESTORED"
    : state.expired
      ? "LOSS OF CONTAINMENT"
      : state.bypassed
        ? aligned
          ? "SHUNT_READY"
          : "PHASE_TRIM"
        : bypass !== null
          ? "KERNEL_HANDOVER"
          : state.diagnosed
            ? "FAILSAFE_OVERRIDE_READY"
            : diagnostic !== null
              ? "DIAGNOSTIC_SWEEP"
              : arm.title;
  const command = "A7F3";
  const stageShunt = () => {
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
  const clock = clockParts(state.left);
  const family =
    config.device === "nuclear"
      ? "FISSILE ASSEMBLY"
      : "CONTAINMENT ASSEMBLY";
  return (
    <div
      className={`countdown warhead scene-inner ${state.safe ? "device-safe" : state.expired ? "device-expired" : ""} ${warn === 1 ? "warn-half" : warn === 2 ? "warn-quarter" : warn === 3 ? "warn-ten" : ""}`}
      data-device-state={
        state.safe ? "safe" : state.expired ? "expired" : "armed"
      }
    >
      <SceneHeader config={config} tag={phase} />
      <div className="warhead-heading">
        <span>
          {family} / {config.identifier}
        </span>
        <span>MAINTENANCE CONSOLE · DIAGNOSTIC TIER 04</span>
      </div>
      <div className="warhead-layout">
        <aside className="warhead-core">
          <div className="micro">
            {config.device === "nuclear"
              ? "PAYLOAD INTEGRITY"
              : "CONTAINMENT FIELD"}
          </div>
          <div className="warhead-emblem">
            <AtomEmblem />
          </div>
          <svg
            className="warhead-trap"
            viewBox="0 0 120 56"
            aria-hidden="true"
          >
            <ellipse
              cx="60"
              cy="28"
              rx={28}
              ry={Math.max(3, 22 * (1 - progress * 0.86))}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <ellipse
              cx="60"
              cy="28"
              rx={18}
              ry={Math.max(2, 12 * (1 - progress * 0.9))}
              fill="none"
              stroke="var(--accent)"
              opacity=".7"
            />
          </svg>
          <dl>
            {[
              ["B_FIELD_AXIAL", `${tel.bField.toFixed(3)} T`],
              ["CRYO_TEMP_LHE", `${tel.cryo.toFixed(2)} K`],
              ["CHAMBER_VACUUM", `${sci(tel.vacuum)} Torr`],
              ["ANNIHILATION_BG", `${tel.annihil.toFixed(2)} cps`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
        <main className="warhead-timer">
          <div className="micro">
            {state.safe
              ? "CONTAINMENT RESTORED"
              : state.expired
                ? "LOSS OF CONTAINMENT"
                : "TIME TO MAGNETIC_COLLAPSE"}
          </div>
          <div className="countdown-digits" aria-label={formatTime(state.left)}>
            <span>{clock.hh}</span>
            <i>:</i>
            <span>{clock.mm}</span>
            <i>:</i>
            <span>{clock.ss}</span>
          </div>
          <div className="warhead-milliseconds">
            {state.safe
              ? "CRYO ONLINE / B-FIELD HOLDING"
              : state.expired
                ? "00:00:00 — LOSS OF CONTAINMENT"
                : String(Math.floor((state.left % 1) * 1000)).padStart(3, "0") +
                  " / TIMED_CIRCUIT_BREAKER"}
          </div>
          <div className="countdown-progress">
            <div
              style={{ width: `${(state.left / config.duration) * 100}%` }}
            />
          </div>
          <div className="warhead-state">
            <Changed value={phase} />
          </div>
          <pre className="warhead-tty">
            {logs.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </pre>
          <AnimatePresence>
            {state.safe && (
              <motion.div
                className="warhead-safe-banner"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                CONTAINMENT RESTORED
                <span>CRYO FLOW RESUMED / B_FIELD_AXIAL HOLDING</span>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        <aside className="warhead-controls">
          <div className="micro">SERVICE ACCESS / MAINTENANCE MODE</div>
          <section>
            <h3>01 / Channel diagnostics</h3>
            <button
              className="scene-button"
              disabled={diagnostic !== null || state.expired}
              onClick={() => {
                playSound("prompt");
                setDiagnostic(time);
                onPlay?.();
              }}
            >
              RUN_CHANNEL_DIAGNOSTICS
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
            <h3>02 / Maintenance shunt</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                stageShunt();
              }}
            >
              <input
                aria-label="Diagnostic checksum"
                disabled={!state.diagnosed || bypass !== null || state.expired}
                value={input}
                placeholder="ENTER 16-BIT DIAGNOSTIC CHECKSUM"
                onChange={(e) =>
                  setInput(command.slice(0, e.target.value.length))
                }
                onKeyDown={(e) => {
                  if (e.key.length === 1 || e.key === "Backspace") {
                    e.preventDefault();
                    if (e.key.length === 1) playSound("type");
                    setInput((v) => scriptedInput(command, v, e.key));
                  }
                }}
              />
              <button
                className="scene-button"
                disabled={!input || bypass !== null || state.expired}
              >
                INITIATE_MAINTENANCE_SHUNT
              </button>
            </form>
            <div className="process-rail">
              <i style={{ width: `${bypassProgress * 100}%` }} />
            </div>
            <small>
              {state.bypassed
                ? "LOCAL_ADMIN_PRIVILEGES_FORCED"
                : bypass === null
                  ? "DIAGNOSTIC SIGNATURE REQUIRED"
                  : `${Math.floor(bypassProgress * 100)}% / KERNEL_HANDOVER`}
            </small>
          </section>
          <section>
            <h3>03 / Align reference field</h3>
            <div className="phase-trim-row">
              {channels.map((value, i) => (
                <PhaseTrim
                  key={i}
                  label={`Phase ${["A", "B", "C"][i]}`}
                  value={value}
                  target={targets[i]}
                  disabled={
                    !state.bypassed ||
                    state.expired ||
                    state.safe ||
                    hold !== null
                  }
                  onChange={(n) =>
                    setChannels((v) => v.map((x, j) => (j === i ? n : x)))
                  }
                />
              ))}
            </div>
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
                ? "CRYO RESTORED"
                : hold !== null
                  ? `RESTORE_CONTAINMENT ${Math.floor(holdProgress * 100)}%`
                  : "HOLD TO RESTORE_CONTAINMENT / 3 SEC"}
            </span>
          </button>
        </aside>
      </div>
      <nav className="arming-rail" aria-label="Arming sequence">
        {armingStages.map((s) => {
          const on = (state.expired ? 1 : progress) >= s.at;
          const now = arm.code === s.code && !state.safe;
          return (
            <div
              key={s.code}
              className={`arming-step ${on ? "is-on" : ""} ${now ? "is-now" : ""}`}
            >
              <span>{s.code}</span>
              <strong>{s.title}</strong>
              <small>{s.sub}</small>
            </div>
          );
        })}
      </nav>
      <footer className="scene-footer">
        <span>{family} / SERIES 09</span>
        <span>
            {state.safe
              ? "CONTAINMENT RESTORED"
              : state.expired
                ? "LOSS OF CONTAINMENT"
                : arm.sub}
        </span>
      </footer>
    </div>
  );
}
