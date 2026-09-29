import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Fingerprint, ShieldCheck } from "lucide-react";
import { SceneHeader, type SceneProps, Terrain, Wave } from "../Scenes";
import { GestureSurface } from "../../components/GestureSurface";
import { formatTime } from "../../core/runtime";
import { Changed, ProcessReadout, useProcess } from "./Process";
import { SpatialAssembly } from "./SpatialAssembly";
import { trackPoint, trackTelemetry } from "./spatial";
export function Corporate(props: SceneProps) {
  const { config, time, cue, onCue } = props;
  const [tab, setTab] = useState("Overview"),
    [query, setQuery] = useState(""),
    [record, setRecord] = useState<string | null>(null);
  const process = useProcess(props);
  const personnel = [
    "Dr. Mara Vale / Research director",
    "Elias Ward / Systems operator",
    "N. Mercer / Archive administrator",
  ];
  const archive = [
    "A-017 / Environmental survey",
    "A-028 / Material analysis",
    "A-041 / Containment review",
  ];
  const openRecord = (name: string) => {
    setRecord(name);
    process.start(
      "RECORD RETRIEVAL",
      [
        "Validate operator clearance",
        "Locate archive blocks",
        "Verify record signature",
      ],
      6,
      "Record signature verified / local copy opened",
    );
  };
  const audit = () =>
    process.start(
      "ACCESS POLICY AUDIT",
      [
        "Enumerate sector permissions",
        "Compare clearance signatures",
        "Resolve access exceptions",
      ],
      9,
      cue === "warning"
        ? "Sector 07 exception confirmed. Operator review required."
        : "All 24 sessions match sector policy.",
    );
  return (
    <div className="corporate scene-inner">
      <SceneHeader
        config={config}
        tag={
          process.job && !process.done
            ? "VERIFICATION IN PROGRESS"
            : cue === "warning"
              ? "ACCESS RESTRICTED"
              : "SECURE ENVIRONMENT"
        }
      />
      <div className="corp-layout">
        <nav className="corp-nav">
          <div className="micro">WORKSPACE / 04</div>
          {["Overview", "Personnel", "Archive", "Diagnostics"].map((s, i) => (
            <button
              key={s}
              className={tab === s ? "selected" : ""}
              onClick={() => {
                setTab(s);
                setRecord(null);
                setQuery("");
                process.clear();
              }}
            >
              <span>0{i + 1}</span>
              {s}
            </button>
          ))}
          <div className="corp-seal">
            <Fingerprint size={48} strokeWidth={0.7} />
            <div className="micro">IDENTITY VERIFIED</div>
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
              <div className="micro">FACILITY 07 / {tab.toUpperCase()}</div>
              <h2>
                <Changed
                  value={
                    {
                      Overview: "Facility overview.",
                      Personnel: "Personnel directory.",
                      Archive: "Research archive.",
                      Diagnostics: "System diagnostics.",
                    }[tab] ?? tab
                  }
                />
              </h2>
            </div>
            <ShieldCheck size={32} />
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              {tab === "Overview" || tab === "Diagnostics" ? (
                <>
                  <div className="corp-metrics">
                    {[
                      [
                        "FACILITY STATUS",
                        cue === "warning"
                          ? "Restricted"
                          : process.job && !process.done
                            ? "Verifying"
                            : "Operational",
                      ],
                      ["ACTIVE SESSIONS", "024"],
                      [
                        "SYSTEM INTEGRITY",
                        process.job && !process.done
                          ? `${Math.floor(process.progress * 100)}%`
                          : cue === "warning"
                            ? "Review"
                            : "99.98%",
                      ],
                    ].map(([a, b]) => (
                      <div key={a}>
                        <div className="micro">{a}</div>
                        <strong>
                          <Changed value={b} />
                        </strong>
                        <span className="thin-line" />
                      </div>
                    ))}
                  </div>
                  <div className="corp-panels">
                    <section>
                      <div className="micro">ENVIRONMENTAL STABILITY</div>
                      <Wave time={time} seed={config.seed} />
                      <div className="between">
                        <Changed
                          value={`${(21.4 + Math.sin(time * 0.3) * 0.2).toFixed(1)} °C / AMBIENT`}
                        />
                        <span>LIVE SENSOR</span>
                      </div>
                    </section>
                    <section>
                      <div className="micro">
                        {tab === "Diagnostics"
                          ? "SYSTEM DIAGNOSTICS"
                          : "ACCESS CONTROL"}
                      </div>
                      <h3>
                        <Changed
                          value={
                            cue === "warning"
                              ? "Review required"
                              : "All sectors secured"
                          }
                        />
                      </h3>
                      <p>
                        Verify signatures before committing a policy change.
                      </p>
                      <button
                        className="scene-button"
                        disabled={!!process.job && !process.done}
                        onClick={
                          tab === "Diagnostics"
                            ? () =>
                                process.start(
                                  "SYSTEM SELF-TEST",
                                  [
                                    "Read sensor reference",
                                    "Validate archive checksums",
                                    "Test redundant channel",
                                    "Commit diagnostic report",
                                  ],
                                  12,
                                  "All four subsystems verified. Report D-204 available.",
                                )
                            : audit
                        }
                      >
                        {tab === "Diagnostics"
                          ? "Run diagnostics"
                          : "Review access"}
                      </button>
                      {process.done && cue === "warning" && (
                        <button
                          className="scene-button"
                          onClick={() => {
                            onCue("idle");
                            process.clear();
                          }}
                        >
                          Acknowledge exception
                        </button>
                      )}
                    </section>
                  </div>
                  <ProcessReadout process={process} />
                  {!process.job && (
                    <div className="event-table">
                      <div className="micro">ACTIVITY LOG</div>
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
                          <b>
                            <Changed value={c} />
                          </b>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="directory">
                  <input
                    aria-label="Verzeichnis durchsuchen"
                    placeholder="Search records…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {(!record || !process.job) &&
                    (tab === "Personnel" ? personnel : archive)
                      .filter((x) =>
                        x.toLowerCase().includes(query.toLowerCase()),
                      )
                      .map((x, i) => (
                        <motion.button
                          key={x}
                          initial={{ opacity: 0, x: 15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          onClick={() => openRecord(x)}
                        >
                          {x}
                          <span>OPEN RECORD ↗</span>
                        </motion.button>
                      ))}
                  <ProcessReadout process={process} />
                  {record && process.done && (
                    <motion.article
                      className="corp-record"
                      initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
                      animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
                    >
                      <div className="micro">
                        VERIFIED LOCAL RECORD / {tab.toUpperCase()}
                      </div>
                      <h3>{record.split(" / ")[0]}</h3>
                      <dl>
                        <dt>Assignment</dt>
                        <dd>{record.split(" / ")[1]}</dd>
                        <dt>Clearance</dt>
                        <dd>Level 04 / Sector 07</dd>
                        <dt>Last event</dt>
                        <dd>
                          {tab === "Personnel"
                            ? "Archive access / 06:42:17"
                            : "Independent review / signature 8E4A"}
                        </dd>
                        <dt>Status</dt>
                        <dd>
                          {record.includes("041")
                            ? "Containment exception requires dual review."
                            : "Identity and record provenance verified."}
                        </dd>
                      </dl>
                      <button
                        className="scene-button"
                        onClick={() => {
                          setRecord(null);
                          process.clear();
                        }}
                      >
                        Close record
                      </button>
                    </motion.article>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <footer className="scene-footer">
        <span>{config.title} INTERNAL / AUTHORIZED PERSONNEL</span>
        <span>SESSION {formatTime(time)} · REV 4.09</span>
      </footer>
    </div>
  );
}
export function Hologram(props: SceneProps) {
  const { config, time, cue } = props;
  const [selection, setSelection] = useState("Geometry");
  const process = useProcess(props);
  return (
    <div className="hologram scene-inner">
      <SceneHeader
        config={config}
        tag={
          process.job
            ? process.done
              ? "ANALYSIS VERIFIED"
              : "VOLUMETRIC SCAN ACTIVE"
            : "LIVE SPATIAL WORKSPACE"
        }
      />
      <div className="holo-layout">
        <aside>
          <div className="micro">OBJECT / 0041</div>
          <h2>
            Structural
            <br />
            analysis.
          </h2>
          <p>
            Perspective reconstruction
            <br />
            Seven independent depth slices
          </p>
          {["Geometry", "Materials", "Integrity"].map((x, i) => (
            <button
              key={x}
              className={`holo-tab ${selection === x ? "selected" : ""}`}
              onClick={() => {
                setSelection(x);
                process.clear();
              }}
            >
              <span>0{i + 1}</span>
              {x}
            </button>
          ))}
          <button
            className="scene-button"
            disabled={!!process.job && !process.done}
            onClick={() =>
              process.start(
                `${selection.toUpperCase()} ANALYSIS`,
                [
                  "Calibrate spatial reference",
                  "Acquire seven depth slices",
                  "Correlate surface samples",
                  "Verify structural signature",
                ],
                16,
                selection === "Integrity"
                  ? "98.4% continuity / two inclusions isolated"
                  : selection === "Materials"
                    ? "Three composite layers identified"
                    : "Seven layers reconstructed / mesh verified",
              )
            }
          >
            {process.done ? "Repeat analysis" : "Run analysis"}
          </button>
          <p>Scan results are committed after all four passes.</p>
        </aside>
        <div className="holo-object">
          <GestureSurface label="Hologramm verschieben, zoomen und drehen">
            <SpatialAssembly
              time={time}
              progress={process.progress}
              mode={selection}
            />
          </GestureSurface>
          <div className="holo-hint">
            3D DEPTH / PAN / PINCH TO SCALE / TWIST VIEW
          </div>
        </div>
        <aside className="holo-readout">
          <div className="micro">{selection.toUpperCase()} / LIVE VIEW</div>
          <h3>
            <Changed
              value={
                cue === "warning"
                  ? "Reference degraded"
                  : process.job
                    ? process.done
                      ? "Verified"
                      : process.phase
                    : "Acquiring slices"
              }
            />
          </h3>
          <div className="holo-number">
            <Changed
              value={
                process.job && !process.done
                  ? String(Math.floor(process.progress * 100))
                  : selection === "Geometry"
                    ? "07"
                    : selection === "Materials"
                      ? "03"
                      : "98.4"
              }
            />
            <small>
              {process.job && !process.done
                ? "SCAN PERCENT"
                : selection === "Geometry"
                  ? "LAYERS"
                  : selection === "Materials"
                    ? "COMPOSITES"
                    : "PERCENT"}
            </small>
          </div>
          <Wave seed={config.seed} time={time} />
          <ProcessReadout process={process} />
          {!process.job && (
            <p>
              Continuous depth acquisition. Start analysis to isolate, correlate
              and verify the selected channel.
            </p>
          )}
        </aside>
      </div>
      <footer className="scene-footer">
        <span>{config.title} / PERSPECTIVE RECONSTRUCTION</span>
        <span>SESSION {formatTime(time)}</span>
      </footer>
    </div>
  );
}
export function Tracking(props: SceneProps) {
  const { config, time, onPlay } = props;
  const [target, setTarget] = useState(0),
    [hold, setHold] = useState<number | null>(null),
    [epoch, setEpoch] = useState(0);
  const t = hold ?? time,
    age = Math.max(0, time - epoch),
    phase =
      hold !== null
        ? "HOLD"
        : age < 0.6
          ? "SEARCH"
          : age < 1.6
            ? "ACQUIRING"
            : age < 2.4
              ? "CORRELATING"
              : "TRACK LOCK";
  const point = trackTelemetry(t, target),
    readout = trackTelemetry(Math.floor(t * 4) / 4, target),
    lag = phase === "SEARCH" ? 0.8 : phase === "ACQUIRING" ? 0.3 : 0.045,
    reticle = trackPoint(Math.max(0, t - lag), target);
  const confidence =
    hold !== null
      ? 0
      : Math.min(99.8, (age / 2.4) * 98.7) + Math.sin(time * 1.7) * 0.15;
  const history = Array.from({ length: 45 }, (_, i) =>
    trackPoint(Math.max(0, t - (44 - i) * 0.09), target),
  );
  return (
    <div className="tracking scene-inner">
      <SceneHeader config={config} tag={`AUTONOMOUS SENSOR / ${phase}`} />
      <div className="tracking-main">
        <GestureSurface label="Karte verschieben, zoomen und drehen">
          <svg viewBox="0 0 800 500" className="terrain">
            <Terrain />
            <path
              d={`M${(t * 155) % 800} 0V500`}
              stroke="currentColor"
              strokeOpacity=".15"
              strokeWidth="24"
            />
            <path
              className="track-history"
              d={history
                .map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`)
                .join(" ")}
            />
            {[0, 1, 2].map((id) => {
              const p = trackPoint(t, id);
              return (
                <g
                  key={id}
                  transform={`translate(${p.x} ${p.y})`}
                  opacity={id === target ? 1 : 0.35}
                >
                  <path d="M-6 0L0 -9L6 0L0 9Z" fill="currentColor" />
                  <text x="12" y="-9" fill="currentColor" fontSize="8">
                    TRK 0{id + 1}
                  </text>
                </g>
              );
            })}
            <g
              className="auto-reticle"
              data-x={reticle.x.toFixed(2)}
              data-y={reticle.y.toFixed(2)}
              transform={`translate(${reticle.x} ${reticle.y})`}
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M-30 -15V-30H-15M15 -30H30V-15M30 15V30H15M-15 30H-30V15"
                strokeWidth="1.8"
              />
              <circle
                r={phase === "TRACK LOCK" ? 21 : 34 + Math.sin(time * 8) * 6}
                opacity=".5"
              />
              <path d="M-40 0H-12M12 0H40M0 -40V-12M0 12V40" />
              <text
                y="49"
                textAnchor="middle"
                stroke="none"
                fill="currentColor"
                fontSize="8"
              >
                {phase} / {Math.max(0, confidence).toFixed(1)}%
              </text>
            </g>
          </svg>
        </GestureSurface>
        <div className="map-corner top-left">
          OPTICAL / CHANNEL 04
          <br />
          AUTONOMOUS MULTI-OBJECT TRACKER
          <br />3 CONTACTS / SECTOR 07
        </div>
        <div className="map-corner top-right">
          SENSOR / 60 Hz
          <br />
          FRAME{" "}
          {Math.floor(t * 60)
            .toString()
            .padStart(6, "0")}
        </div>
        <aside className="tracking-hud">
          <h3>TRACK 0{target + 1}</h3>
          <div className="tracking-state">
            <Changed value={phase} />
          </div>
          <dl>
            <dt>GROUND SPEED</dt>
            <dd>
              <Changed value={readout.speed.toFixed(1)} /> m/s
            </dd>
            <dt>HEADING</dt>
            <dd>
              <Changed value={readout.heading.toFixed(1)} />°
            </dd>
            <dt>CONFIDENCE</dt>
            <dd>
              <Changed value={Math.max(0, confidence).toFixed(1)} />%
            </dd>
            <dt>EASTING</dt>
            <dd>{point.x.toFixed(1)}</dd>
            <dt>NORTHING</dt>
            <dd>{point.y.toFixed(1)}</dd>
            <dt>RESIDUAL</dt>
            <dd>
              {Math.hypot(point.x - reticle.x, point.y - reticle.y).toFixed(2)}{" "}
              px
            </dd>
          </dl>
          <Wave time={t} seed={target + 17} />
        </aside>
        <div className="map-corner bottom-left">
          GROUND SAMPLE 0.42 m<br />
          PREDICT / CORRELATE / UPDATE
        </div>
        <div className="tracking-actions">
          <button
            className="scene-button"
            onClick={() => {
              setTarget((target + 1) % 3);
              setEpoch(time);
              setHold(null);
              onPlay?.();
            }}
          >
            Next contact
          </button>
          <button
            className="scene-button"
            onClick={() => {
              setHold(hold === null ? time : null);
              setEpoch(time);
              onPlay?.();
            }}
          >
            {hold === null ? "Hold sensor" : "Resume tracking"}
          </button>
          <button
            className="scene-button"
            onClick={() => {
              setEpoch(time);
              setHold(null);
              onPlay?.();
            }}
          >
            Reacquire
          </button>
        </div>
      </div>
      <footer className="scene-footer">
        <span>OPTICAL TELEMETRY / SENSOR 04</span>
        <span>MISSION TIME {formatTime(time)}</span>
      </footer>
    </div>
  );
}
