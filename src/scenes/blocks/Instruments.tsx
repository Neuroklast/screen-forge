import { useState } from "react";
import type { SceneProps } from "../Scenes";
import { HudFrame } from "../../components/HudFrame";
import { Timer } from "../../components/Timer";
import {
  CodeTableControl,
  DataSheetControl,
  RotaryControl,
} from "./controls";
import { clockParts, formatTime, noise } from "../../core/runtime";
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
            <Timer remaining={remaining} className="clock-digits" />
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
                <li
                  key={i}
                  className={
                    time >= at ? "is-past" : time >= at - 30 ? "is-now" : ""
                  }
                >
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
  return (
    <div className="instrument scene-inner">
      <HudFrame label="ROTARY" className="instrument-frame">
        <header className="instrument-head">
          <span>FIELD CONTROL</span>
          <b>{count} DIALS</b>
        </header>
        <RotaryControl
          targets={targets}
          disabled={cue === "complete"}
          onComplete={() => {
            onCue("complete");
            signal("rotary.aligned");
          }}
        />
      </HudFrame>
    </div>
  );
}

export function CodeTable({ config, cue, onCue }: SceneProps) {
  const options = config.sceneOptions.codeTable;
  const message = (options.message || "RELAY").toUpperCase();
  const [attempts, setAttempts] = useState(0);
  const solved = cue === "complete";
  return (
    <div className="instrument scene-inner">
      <HudFrame label="CODE TABLE" className="instrument-frame">
        <header className="instrument-head">
          <span>MESSAGE HANDLING / A1Z26</span>
          <b>{solved ? "SOLVED" : `${attempts} TRIES`}</b>
        </header>
        <CodeTableControl
          message={message}
          disabled={solved}
          onComplete={() => {
            onCue("complete");
            signal("code.solved");
          }}
          onAttempt={setAttempts}
        />
        {solved && <p className="instrument-ok">Solved — relay: {message}</p>}
      </HudFrame>
    </div>
  );
}

export function DataSheet({ config, cue, onCue }: SceneProps) {
  return (
    <div className="instrument scene-inner">
      <HudFrame label="DATA SHEET" className="instrument-frame">
        <DataSheetControl
          {...config.sceneOptions.dataSheet}
          disabled={cue === "complete"}
          onComplete={() => {
            onCue("complete");
            signal("data.relay");
          }}
        />
      </HudFrame>
    </div>
  );
}
