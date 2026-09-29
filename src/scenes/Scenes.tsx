import { useState } from "react";
import { CyberOS } from "./os/CyberOS";
import { motion } from "motion/react";
import {
  Activity,
  ShieldCheck,
  Fingerprint,
  Radio,
  Crosshair,
} from "lucide-react";
import type { Config } from "../core/config";
import { countdown, formatTime, noise, type Cue } from "../core/runtime";
import { GestureSurface } from "../components/GestureSurface";
export type SceneProps = {
  config: Config;
  time: number;
  cue: Cue;
  onCue: (cue: Cue) => void;
  onPlay?: () => void;
  onTimelineExtend?: (end: number) => void;
};
function Label({ children }: { children: React.ReactNode }) {
  return <div className="micro">{children}</div>;
}
function Wave({ seed = 1, time = 0 }: { seed?: number; time?: number }) {
  return (
    <svg
      className="wave"
      viewBox="0 0 500 80"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={Array.from(
          { length: 100 },
          (_, i) =>
            `${i ? "L" : "M"}${i * 5},${40 + Math.sin(i * 0.35 + time * 0.5) * noise(i, seed) * 27}`,
        ).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}
export function SceneHeader({ config, tag }: { config: Config; tag: string }) {
  return (
    <header className="scene-header">
      <div className="scene-brand">
        <div className="brand-mark">
          {config.scene === "corporate" ? (
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <rect
                x="2"
                y="2"
                width="60"
                height="60"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M2 2H32V32H2ZM32 32H62V62H32Z" fill="var(--accent)" />
              <path
                d="M13 13H23V23H13ZM41 41H51V51H41Z"
                fill="var(--scene-bg)"
              />
              <path d="M41 13H51V23H41ZM13 41H23V51H13Z" fill="currentColor" />
            </svg>
          ) : (
            "▧"
          )}
        </div>
        <div>
          <strong>{config.title}</strong>
          <Label>{config.subtitle}</Label>
        </div>
      </div>
      <div className="header-status">
        <span className="status-dot" />
        {tag}
        <small>{config.identifier}</small>
      </div>
    </header>
  );
}
export function Corporate({ config, time, cue, onCue }: SceneProps) {
  const [tab, setTab] = useState("Overview");
  const [query, setQuery] = useState("");
  return (
    <div className="corporate scene-inner">
      <SceneHeader
        config={config}
        tag={
          {
            idle: "SECURE ENVIRONMENT",
            active: "RECORD ACCESS GRANTED",
            warning: "ACCESS RESTRICTED",
            complete: "REVIEW COMPLETE",
          }[cue]
        }
      />
      <div className="corp-layout">
        <nav className="corp-nav">
          <Label>WORKSPACE / 04</Label>
          {["Overview", "Personnel", "Archive", "Diagnostics"].map((s, i) => (
            <button
              key={s}
              className={tab === s ? "selected" : ""}
              onClick={() => setTab(s)}
            >
              <span>0{i + 1}</span>
              {s}
            </button>
          ))}
          <div className="corp-seal">
            <Fingerprint size={48} strokeWidth={0.7} />
            <Label>IDENTITY VERIFIED</Label>
            <span>
              Research operator
              <br />
              Clearance level 04
            </span>
          </div>
        </nav>
        <main className="corp-main">
          <div className="section-heading">
            <div>
              <Label>FACILITY 07 / {tab.toUpperCase()}</Label>
              <h2>
                {tab === "Overview"
                  ? "Everything under control."
                  : tab === "Personnel"
                    ? "Personnel directory."
                    : tab === "Archive"
                      ? "Research archive."
                      : "System diagnostics."}
              </h2>
            </div>
            <ShieldCheck size={32} strokeWidth={1} />
          </div>
          {tab === "Overview" || tab === "Diagnostics" ? (
            <>
              <div className="corp-metrics">
                {[
                  [
                    "FACILITY STATUS",
                    cue === "warning" ? "Restricted" : "Operational",
                  ],
                  ["ACTIVE SESSIONS", "024"],
                  ["SYSTEM INTEGRITY", cue === "warning" ? "Review" : "99.98%"],
                ].map(([a, b]) => (
                  <div key={a}>
                    <Label>{a}</Label>
                    <strong>{b}</strong>
                    <span className="thin-line" />
                  </div>
                ))}
              </div>
              <div className="corp-panels">
                <section>
                  <Label>ENVIRONMENTAL STABILITY</Label>
                  <Wave seed={config.seed} time={time} />
                  <div className="between">
                    <span>21.4 °C / AMBIENT</span>
                    <span>LAST 60 SECONDS</span>
                  </div>
                </section>
                <section>
                  <Label>ACCESS CONTROL</Label>
                  <h3>
                    {cue === "warning"
                      ? "Review required"
                      : "All sectors secured"}
                  </h3>
                  <p>
                    {cue === "warning"
                      ? "Operator acknowledgement pending."
                      : "No outstanding access exceptions."}
                  </p>
                  <button
                    className="scene-button"
                    onClick={() =>
                      onCue(cue === "warning" ? "idle" : "warning")
                    }
                  >
                    {cue === "warning" ? "Acknowledge" : "Review access"}
                  </button>
                </section>
              </div>
              <div className="event-table">
                <Label>ACTIVITY LOG</Label>
                {[
                  ["00:00:00", "Session established", "VERIFIED"],
                  ["00:00:02", "Archive index mounted", "AVAILABLE"],
                  [
                    formatTime(time),
                    "Sector 07 access policy",
                    cue === "warning" ? "RESTRICTED" : "NOMINAL",
                  ],
                ].map(([a, b, c]) => (
                  <div key={b}>
                    <time>{a}</time>
                    <span>{b}</span>
                    <b>{c}</b>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="directory">
              <input
                aria-label="Verzeichnis durchsuchen"
                placeholder="Search records…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {(tab === "Personnel"
                ? [
                    "Dr. Mara Vale / Research director",
                    "Elias Ward / Systems operator",
                    "N. Mercer / Archive administrator",
                  ]
                : [
                    "A-017 / Environmental survey",
                    "A-028 / Material analysis",
                    "A-041 / Containment review",
                  ]
              )
                .filter((x) => x.toLowerCase().includes(query.toLowerCase()))
                .map((x) => (
                  <button key={x} onClick={() => onCue("active")}>
                    {x}
                    <span>OPEN RECORD ↗</span>
                  </button>
                ))}
              {cue === "active" && (
                <p>Record verified. Local archive copy available.</p>
              )}
            </div>
          )}
        </main>
      </div>
      <footer className="scene-footer">
        <span>VESPER INTERNAL / AUTHORIZED PERSONNEL</span>
        <span>SESSION {formatTime(time)} · REV 4.08</span>
      </footer>
    </div>
  );
}
export function Terminal({ config, time, cue, onCue }: SceneProps) {
  const [input, setInput] = useState(""),
    [lines, setLines] = useState<string[]>([]);
  const submit = () => {
    if (!input.trim()) return;
    setLines((p) => [
      ...p.slice(-8),
      `operator@local:~$ ${input}`,
      "[local] relay map loaded · 8 nodes verified",
      "[local] analysis complete · archive ready",
    ]);
    setInput("");
    onCue("active");
  };
  return (
    <div className="terminal scene-inner">
      <SceneHeader
        config={config}
        tag={
          {
            idle: "LOCAL RELAY ACTIVE",
            active: "ANALYSIS READY",
            warning: "SIGNAL DEGRADED",
            complete: "SESSION COMPLETE",
          }[cue]
        }
      />
      <div className="terminal-grid">
        <section className="terminal-console">
          <Label>TTY / 07 ─ SESSION ATTACHED</Label>
          <h2>
            Follow the signal<span>_</span>
          </h2>
          <div className="console-lines">
            <p className="muted">
              BLACKLINE / isolated analysis environment
              <br />
              Session initialized. Awaiting operator input.
            </p>
            <p>
              ✓ Relay index mounted
              <br />✓ Local topology verified
              <br />✓ Diagnostic channel available
            </p>
            {lines.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
            {cue === "warning" && (
              <p className="alert-text">
                ! SIGNAL INTERRUPTED / local cache retained
              </p>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <span>~/</span>
            <input
              aria-label="Terminaleingabe"
              autoComplete="off"
              spellCheck={false}
              value={input}
              onChange={(e) =>
                setInput(
                  config.actorMode
                    ? config.script.slice(0, e.target.value.length)
                    : e.target.value,
                )
              }
              placeholder={
                config.actorMode
                  ? "Type to reveal prepared command"
                  : "Enter a fictional command"
              }
            />
            <button aria-label="Befehl ausführen">↵</button>
          </form>
        </section>
        <aside className="terminal-analysis">
          <Label>RELAY TOPOLOGY</Label>
          <svg viewBox="0 0 320 260" className="network-map">
            <path
              d="M40 60L160 35L275 90L245 215L90 220L40 60L245 215M160 35L155 140L275 90M90 220L155 140"
              fill="none"
              stroke="currentColor"
              opacity=".35"
            />
            {[
              [40, 60],
              [160, 35],
              [275, 90],
              [245, 215],
              [90, 220],
              [155, 140],
            ].map(([x, y], i) => (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={i === 5 ? 12 : 5}
                  fill="var(--scene-bg)"
                  stroke="currentColor"
                />
                <text x={x + 12} y={y + 18} fontSize="9" fill="currentColor">
                  R0{i + 1}
                </text>
              </g>
            ))}
          </svg>
          <div className="between">
            <span>6 NODES</span>
            <span>{cue === "warning" ? "LINK LOST" : "LINK VERIFIED"}</span>
          </div>
          <Wave time={time} seed={config.seed} />
          <Label>SESSION TRAFFIC / SYNTHETIC</Label>
          <div className="terminal-stat">
            {(noise(Math.floor(time / 2), config.seed) * 4 + 12).toFixed(2)}{" "}
            <small>Mb/s</small>
          </div>
          <button
            className="scene-button"
            onClick={() => onCue(cue === "warning" ? "idle" : "warning")}
          >
            Inspect relay
          </button>
        </aside>
      </div>
      <footer className="scene-footer">
        <span>OPERATOR / 07</span>
        <span>UPTIME {formatTime(time)}</span>
      </footer>
    </div>
  );
}
export function Countdown({ config, time, cue, onCue }: SceneProps) {
  const left = countdown(config.duration, time),
    done = left === 0 || cue === "complete",
    warning = cue === "warning" || left <= 30;
  return (
    <div className={`countdown scene-inner ${warning ? "critical" : ""}`}>
      <SceneHeader
        config={config}
        tag={
          done
            ? "SEQUENCE COMPLETE"
            : warning
              ? "OPERATOR ATTENTION"
              : "SEQUENCE MONITOR"
        }
      />
      <div className="countdown-main">
        <div className="device-index">
          <span>09</span>
          <Label>
            CONTROL MODULE
            <br />
            REMOTE DISPLAY
          </Label>
        </div>
        <Label>
          {done ? "END OF SEQUENCE" : "TIME REMAINING / SYNCHRONIZED"}
        </Label>
        <div className="countdown-digits">{formatTime(done ? 0 : left)}</div>
        <div className="countdown-progress">
          <div
            style={{ width: `${done ? 0 : (left / config.duration) * 100}%` }}
          />
        </div>
        <div className="between countdown-caption">
          <span>
            {done
              ? "SEQUENCE ENDED"
              : warning
                ? "ATTENTION REQUIRED"
                : "TIMING REFERENCE STABLE"}
          </span>
          <span>T−{Math.ceil(left).toString().padStart(5, "0")}</span>
        </div>
        <div className="device-status">
          {[
            ["POWER", "EXTERNAL / STABLE"],
            ["ENCLOSURE", warning ? "REVIEW PENDING" : "SEALED"],
            ["TELEMETRY", warning ? "INTERRUPTED" : "CONNECTED"],
            ["DISPLAY", "SELF-TEST PASSED"],
          ].map(([a, b]) => (
            <div key={a}>
              <Label>{a}</Label>
              <b>{b}</b>
            </div>
          ))}
        </div>
        {config.density === "detailed" && (
          <div className="device-bottom">
            <div>
              <Label>DEVICE EVENT REGISTER</Label>
              <p>
                00:00:00 / Timing reference acquired
                <br />
                {formatTime(time)} /{" "}
                {done
                  ? "Sequence ended"
                  : warning
                    ? "Status exception recorded"
                    : "Display synchronisation nominal"}
              </p>
            </div>
            <button
              className="scene-button"
              onClick={() => onCue(warning ? "idle" : "warning")}
            >
              DIAGNOSTICS
            </button>
          </div>
        )}
      </div>
      <footer className="scene-footer">
        <span>SC-09 / INDEPENDENT DISPLAY MODULE</span>
        <span>CHECKSUM 84F2 · REV 03</span>
      </footer>
    </div>
  );
}
function Terrain() {
  return (
    <>
      <rect width="800" height="500" fill="#15201f" />
      {Array.from({ length: 22 }, (_, i) => (
        <path
          key={i}
          d={`M-50 ${i * 28} Q160 ${i * 28 - 110} 350 ${i * 28 + 5} T850 ${i * 28 - 80}`}
          fill="none"
          stroke="#466058"
          strokeWidth={i % 4 === 0 ? 2 : 1}
          opacity=".55"
        />
      ))}
      <path
        d="M520 -20 Q320 140 510 260T430 520"
        fill="none"
        stroke="#223b39"
        strokeWidth="70"
      />
      <path
        d="M520 -20 Q320 140 510 260T430 520"
        fill="none"
        stroke="#66867b"
        strokeWidth="1"
      />
      {Array.from({ length: 30 }, (_, i) => (
        <rect
          key={i}
          x={70 + noise(i, 3) * 580}
          y={30 + noise(i, 6) * 400}
          width={10 + noise(i, 5) * 35}
          height={7 + noise(i, 9) * 20}
          fill="#829082"
          opacity=".28"
          transform={`rotate(-12 ${70 + noise(i, 3) * 580} ${30 + noise(i, 6) * 400})`}
        />
      ))}
    </>
  );
}
export function Tracking({ config, time, cue, onCue }: SceneProps) {
  return (
    <div className="tracking scene-inner">
      <SceneHeader
        config={config}
        tag={
          {
            idle: "PASSIVE OBSERVATION",
            active: "TRACK CONFIRMED",
            warning: "SIGNAL DEGRADED",
            complete: "OBSERVATION COMPLETE",
          }[cue]
        }
      />
      <div className="tracking-main">
        <GestureSurface label="Karte verschieben, zoomen und drehen">
          <svg viewBox="0 0 800 500" className="terrain">
            <Terrain />
          </svg>
        </GestureSurface>
        <div className="reticle">
          <span />
          <Crosshair size={90} strokeWidth={0.7} />
          <Label>
            {cue === "active" ? "TRACK 07 / CONFIRMED" : "ACQUISITION WINDOW"}
          </Label>
        </div>
        <div className="map-corner top-left">
          OPTICAL / CHANNEL 04
          <br />
          37° 24′ 18.2″ N<br />
          116° 51′ 09.4″ W
        </div>
        <div className="map-corner top-right">
          SENSOR GAIN 1.4
          <br />
          FRAME{" "}
          {Math.floor(time * 24)
            .toString()
            .padStart(6, "0")}
          <br />
          {cue === "warning" ? "SIGNAL DEGRADED" : "LINK NOMINAL"}
        </div>
        <div className="map-corner bottom-left">
          GROUND SAMPLE 0.42 m<br />N ↑ / SECTOR 07
        </div>
        <button
          className="scene-button acquire"
          onClick={() => onCue(cue === "active" ? "idle" : "active")}
        >
          {cue === "active" ? "Release track" : "Acquire track"}
        </button>
      </div>
      <footer className="scene-footer">
        <span>OBSERVATION ONLY / SENSOR 04</span>
        <span>MISSION TIME {formatTime(time)}</span>
      </footer>
    </div>
  );
}
export function Hologram({ config, time, cue, onCue }: SceneProps) {
  const [selection, setSelection] = useState("Geometry");
  return (
    <div className="hologram scene-inner">
      <SceneHeader
        config={config}
        tag={
          {
            idle: "WORKSPACE READY",
            active: "ANALYSIS COMPLETE",
            warning: "DATASET INTERRUPTED",
            complete: "ANALYSIS ARCHIVED",
          }[cue]
        }
      />
      <div className="holo-layout">
        <aside>
          <Label>OBJECT / 0041</Label>
          <h2>
            Structural
            <br />
            analysis.
          </h2>
          <p>
            Composite assembly
            <br />
            Revision 04 / Local dataset
          </p>
          {["Geometry", "Materials", "Integrity"].map((x, i) => (
            <button
              className={`holo-tab ${selection === x ? "selected" : ""}`}
              key={x}
              onClick={() => setSelection(x)}
            >
              <span>0{i + 1}</span>
              {x}
            </button>
          ))}
          <button
            className="scene-button"
            onClick={() => onCue(cue === "active" ? "idle" : "active")}
          >
            {cue === "active" ? "Clear analysis" : "Run analysis"}
          </button>
        </aside>
        <div className="holo-object">
          <GestureSurface label="Hologramm verschieben, zoomen und drehen">
            <svg viewBox="0 0 560 500" className="holo-svg">
              <defs>
                <radialGradient id="holoGlow">
                  <stop stopColor="currentColor" stopOpacity=".12" />
                  <stop offset="1" stopColor="currentColor" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="280" cy="250" r="235" fill="url(#holoGlow)" />
              <g fill="none" stroke="currentColor">
                <ellipse cx="280" cy="360" rx="205" ry="64" opacity=".25" />
                <ellipse
                  cx="280"
                  cy="360"
                  rx="170"
                  ry="48"
                  opacity=".3"
                  strokeDasharray="3 8"
                />
                {Array.from({ length: 7 }, (_, i) => (
                  <path
                    key={i}
                    d={`M${160 + i * 5} ${175 + i * 20} L280 ${110 + i * 20} L${400 - i * 5} ${175 + i * 20} L280 ${240 + i * 20} Z`}
                    opacity={0.25 + i * 0.08}
                  />
                ))}
                <path d="M160 175V295L280 360L400 295V175M280 240V360M280 110V230" />
                <circle
                  cx="280"
                  cy="250"
                  r="205"
                  opacity=".2"
                  strokeDasharray="2 12"
                />
                <path
                  d="M180 185L95 115H35M385 287L457 307H525"
                  strokeWidth=".7"
                />
                <circle cx="180" cy="185" r="4" />
                <circle cx="385" cy="287" r="4" />
              </g>
              <g fill="currentColor" fontSize="10" fontFamily="monospace">
                <text x="35" y="102">
                  ASSEMBLY / 01
                </text>
                <text x="450" y="326">
                  LAYER / 07
                </text>
              </g>
              {cue === "active" && (
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1 }}
                  d="M160 175L280 110L400 175L400 295L280 360L160 295Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              )}
            </svg>
          </GestureSurface>
          <div className="holo-hint">
            DRAG TO POSITION / PINCH TO SCALE / TWIST TO ROTATE
          </div>
        </div>
        <aside className="holo-readout">
          <Activity size={25} strokeWidth={1} />
          <Label>{selection.toUpperCase()} / LIVE VIEW</Label>
          <h3>{cue === "active" ? "Verified" : "Standby"}</h3>
          <div className="holo-number">
            {selection === "Geometry"
              ? "07"
              : selection === "Materials"
                ? "03"
                : "98.4"}
            <small>
              {selection === "Geometry"
                ? "LAYERS"
                : selection === "Materials"
                  ? "COMPOSITES"
                  : "PERCENT"}
            </small>
          </div>
          <Wave seed={config.seed} time={time} />
          <Label>REFERENCE SIGNAL</Label>
          <p>
            {cue === "warning"
              ? "Dataset interrupted. Review required."
              : cue === "active"
                ? "Assembly consistent with reference geometry."
                : "Select a layer or begin a structural analysis."}
          </p>
          <Radio size={22} strokeWidth={1} />
        </aside>
      </div>
      <footer className="scene-footer">
        <span>AEON / INTERACTIVE WORKSPACE</span>
        <span>SESSION {formatTime(time)}</span>
      </footer>
    </div>
  );
}
export const sceneComponents = {
  corporate: Corporate,
  terminal: CyberOS,
  countdown: Countdown,
  tracking: Tracking,
  hologram: Hologram,
};
