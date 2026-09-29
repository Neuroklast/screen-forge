import { useState } from "react";
import type { SceneProps } from "../Scenes";
import { HudFrame } from "../../components/HudFrame";
import { clockParts, formatTime, noise } from "../../core/runtime";
import { playSound } from "../../core/sound";
import "./instruments.css";

function signal(value: string) {
  window.dispatchEvent(
    new CustomEvent("screenforge:input", { detail: { type: "signal", value } }),
  );
}
const ZONES = ["LOCAL", "UTC", "SECTOR 07", "RELAY"];

export function Clock({ config, time, cue, onCue }: SceneProps) {
  const options = config.sceneOptions.clock;
  const remaining = Math.max(0, config.duration - time);
  const mission = clockParts(time);
  const left = clockParts(remaining);
  const hours = (time * 1.5) % 24;
  const wall = `${String(Math.floor(hours)).padStart(2, "0")}:${String(
    Math.floor((hours % 1) * 60),
  ).padStart(2, "0")}`;
  return (
    <div className="instrument scene-inner">
      <HudFrame label="CLOCK" className="instrument-frame">
        <header className="instrument-head">
          <span>{options.label || "TIME REFERENCE"}</span>
          <b>{options.mode.toUpperCase()}</b>
        </header>
        {options.mode === "countdown" ? (
          <>
            <div className="clock-digits" aria-label={formatTime(remaining)}>
              {left.hh}:{left.mm}:{left.ss}
            </div>
            <div className="instrument-rail">
              <i style={{ width: `${(remaining / config.duration) * 100}%` }} />
            </div>
          </>
        ) : options.mode === "wall" ? (
          <div className="clock-digits">{wall}</div>
        ) : options.mode === "zones" ? (
          <ul className="clock-zones">
            {ZONES.map((zone, i) => (
              <li key={zone}>
                <span>{zone}</span>
                <b>
                  {String(Math.floor((hours + i * 0.4) % 24)).padStart(2, "0")}:00
                </b>
              </li>
            ))}
          </ul>
        ) : options.mode === "schedule" ? (
          <ul className="clock-schedule">
            {[0, 1, 2, 3].map((i) => {
              const at = config.duration * (0.15 + i * 0.2);
              return (
                <li key={i} className={time >= at ? "is-past" : time >= at - 30 ? "is-now" : ""}>
                  <span>T+{formatTime(at)}</span>
                  <b>Entry {i + 1}</b>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="clock-digits" aria-label={formatTime(time)}>
            {mission.hh}:{mission.mm}:{mission.ss}
          </div>
        )}
        <footer className="instrument-foot">
          <span>MISSION {formatTime(time)}</span>
          <span>{cue === "complete" ? "CLOSED" : "OPEN"}</span>
        </footer>
      </HudFrame>
    </div>
  );
}

export function Rotary({ config, cue, onCue }: SceneProps) {
  const options = config.sceneOptions.rotary;
  const count = Math.max(1, Math.min(4, options.dials));
  const targets = Array.from({ length: count }, (_, i) =>
    25 + Math.floor(noise(i, config.seed) * 50),
  );
  const [values, setValues] = useState(() => targets.map(() => 15));
  const aligned = values.every((v, i) => Math.abs(v - targets[i]) <= 2);
  const set = (i: number, n: number) =>
    setValues((v) => v.map((x, j) => (j === i ? Math.max(0, Math.min(100, n)) : x)));
  const confirm = () => {
    if (aligned) {
      playSound("load");
      onCue("complete");
      signal("rotary.aligned");
    } else {
      playSound("fail");
      signal("rotary.rejected");
    }
  };
  return (
    <div className="instrument scene-inner">
      <HudFrame label="ROTARY" className="instrument-frame">
        <header className="instrument-head">
          <span>FIELD CONTROL</span>
          <b>
            {values.filter((v, i) => Math.abs(v - targets[i]) <= 2).length}/{count}
          </b>
        </header>
        <div className="rotary-dials">
          {values.map((value, i) => (
            <div
              key={i}
              className={`rotary-dial ${Math.abs(value - targets[i]) <= 2 ? "is-aligned" : ""}`}
            >
              <span>DIAL {["A", "B", "C", "D"][i]}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={value}
                aria-label={`Dial ${i + 1}`}
                disabled={cue === "complete"}
                onChange={(e) => {
                  playSound("osTick");
                  set(i, Number(e.target.value));
                }}
              />
              <b>
                {value}
                <small>REF {targets[i]}</small>
              </b>
            </div>
          ))}
        </div>
        <button
          className="scene-button"
          disabled={cue === "complete"}
          onClick={confirm}
        >
          {aligned ? "CONFIRM ALIGNMENT" : "ALIGN ALL DIALS"}
        </button>
      </HudFrame>
    </div>
  );
}

export function CodeTable({ config, cue, onCue }: SceneProps) {
  const options = config.sceneOptions.codeTable;
  const message = (options.message || "RELAY").toUpperCase();
  const cipher = message
    .split("")
    .map((c) => (/[A-Z]/.test(c) ? String(c.charCodeAt(0) - 64).padStart(2, "0") : c))
    .join(" ");
  const [value, setValue] = useState("");
  const [attempts, setAttempts] = useState(0);
  const solved = cue === "complete";
  const submit = () => {
    if (solved) return;
    if (value.trim().toUpperCase() === message) {
      playSound("load");
      onCue("complete");
      signal("code.solved");
    } else {
      playSound("fail");
      setAttempts((n) => n + 1);
      setValue("");
    }
  };
  return (
    <div className="instrument scene-inner">
      <HudFrame label="CODE TABLE" className="instrument-frame">
        <header className="instrument-head">
          <span>MESSAGE HANDLING / A1Z26</span>
          <b>{solved ? "SOLVED" : `${attempts} TRIES`}</b>
        </header>
        <div className="code-cipher">{cipher}</div>
        <table className="code-table">
          <tbody>
            {Array.from({ length: 26 }, (_, i) => (
              <tr key={i}>
                <td>{String(i + 1).padStart(2, "0")}</td>
                <td>{String.fromCharCode(65 + i)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="code-input">
          <input
            aria-label="Decoded message"
            value={value}
            disabled={solved}
            placeholder="DECODED MESSAGE"
            onChange={(e) => setValue(e.target.value.toUpperCase())}
          />
          <button className="scene-button" disabled={solved} onClick={submit}>
            SUBMIT
          </button>
        </div>
        {solved && <p className="instrument-ok">Solved — relay: {message}</p>}
      </HudFrame>
    </div>
  );
}

const DEFAULT_LINES = [
  "CONTAINMENT-BAUGRUPPE / SERIES 09",
  "STATUS: SCHARF",
  "BAUTEIL A: INNENRING",
  "BAUTEIL B: AUSSENRING",
  "HINWEIS: FIKTIVES GERÄT",
];
const DEFAULT_STEPS = [
  "Gehäuse entriegeln",
  "Innenring auf Referenz ausrichten",
  "Umgehung am Wartungsport setzen",
  "Baugruppe entschärfen",
];

export function DataSheet({ config, cue, onCue }: SceneProps) {
  const options = config.sceneOptions.dataSheet;
  const lines = options.lines.length ? options.lines : DEFAULT_LINES;
  const steps = options.steps.length ? options.steps : DEFAULT_STEPS;
  const [read, setRead] = useState<boolean[]>(() => steps.map(() => false));
  const allRead = read.every(Boolean);
  const relay = () => {
    if (!allRead) return;
    playSound("load");
    onCue("complete");
    signal("data.relay");
  };
  return (
    <div className="instrument scene-inner">
      <HudFrame label="DATA SHEET" className="instrument-frame">
        <header className="instrument-head">
          <span>{options.title}</span>
          <b>{allRead ? "READY TO RELAY" : "READ"}</b>
        </header>
        <div className="sheet-layout">
          <figure className="sheet-figure">
            {options.image ? (
              <img src={options.image} alt="Schema" />
            ) : (
              <svg viewBox="0 0 200 140" aria-label="Schema (fiktiv)">
                <rect x="20" y="20" width="160" height="100" fill="none" stroke="currentColor" />
                <circle cx="100" cy="70" r="34" fill="none" stroke="currentColor" />
                <circle cx="100" cy="70" r="20" fill="none" stroke="var(--accent)" />
                <path d="M60 40H140M60 100H140" stroke="currentColor" />
                <text x="100" y="134" textAnchor="middle" fontSize="8" fill="currentColor">
                  SCHEMATIC / FIKTIV
                </text>
              </svg>
            )}
          </figure>
          <div className="sheet-body">
            <ul className="sheet-lines">
              {lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <ol className="sheet-steps">
              {steps.map((step, i) => (
                <li key={step} className={read[i] ? "is-read" : ""}>
                  <label>
                    <input
                      type="checkbox"
                      checked={read[i]}
                      onChange={(e) => {
                        playSound("click");
                        setRead((v) => v.map((x, j) => (j === i ? e.target.checked : x)));
                      }}
                    />
                    {step}
                  </label>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="sheet-relay">
          <span>{options.relayText || "Daten an Funk weitergeben."}</span>
          <button className="scene-button" disabled={!allRead || cue === "complete"} onClick={relay}>
            RELAY VIA COMMS
          </button>
        </div>
      </HudFrame>
    </div>
  );
}
