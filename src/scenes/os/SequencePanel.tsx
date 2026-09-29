import { useEffect, useRef } from "react";
import { Changed } from "../shared/Process";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronRight, Square } from "lucide-react";
import { formatTime, noise } from "../../core/runtime";
import { sequenceState, type Sequence } from "./sequences";
import { SequenceVisual } from "./Visuals";
export function SequencePanel({
  sequence,
  elapsed,
  multiplier,
  seed,
  onClose,
}: {
  sequence: Sequence;
  elapsed: number;
  multiplier: number;
  seed: number;
  onClose: () => void;
}) {
  const state = sequenceState(sequence, elapsed, multiplier);
  const list = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = list.current,
      row = el?.children[state.index] as HTMLElement | undefined;
    if (el && row)
      el.scrollTop = Math.max(0, row.offsetTop - el.offsetTop - 70);
  }, [state.index]);
  const logs = sequence.phases
    .flatMap((p, i) =>
      i < state.index
        ? p.logs.map((line, j) => ({
            line,
            channel: p.channel,
            index: i * 4 + j,
          }))
        : i === state.index
          ? p.logs
              .slice(0, Math.min(4, Math.floor(state.phaseProgress * 4) + 1))
              .map((line, j) => ({
                line,
                channel: p.channel,
                index: i * 4 + j,
              }))
          : [],
    )
    .slice(-7);
  return (
    <div className={`os-sequence ${state.done ? "is-complete" : ""}`}>
      <div className="os-objective">
        <span>OBJECTIVE</span>
        <strong>{sequence.phases[sequence.phases.length - 1].name}</strong>
        <small>
          {state.done
            ? "COMPLETE"
            : `${state.phase.name} · ${state.index + 1}/${sequence.phases.length}`}
        </small>
      </div>
      <div className="os-section-head">
        <div>
          <span className="os-kicker">{sequence.code} / SEQUENCE ENGINE</span>
          <h2>{sequence.name}</h2>
          <p>{sequence.subtitle}</p>
        </div>
        <button className="os-button" onClick={onClose}>
          {state.done ? <Check size={13} /> : <Square size={11} />}{" "}
          {state.done ? "Return to workspace" : "Abort sequence"}
        </button>
      </div>
      <div className="os-sequence-grid">
        <aside className="os-phase-list" ref={list}>
          {sequence.phases.map((p, i) => (
            <div
              key={p.name}
              className={`${state.index === i && !state.done ? "current" : ""} ${i < state.index || state.done ? "done" : ""}`}
            >
              <span className="os-phase-index">
                {i < state.index || state.done ? (
                  <Check size={13} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <div>
                <strong>{p.name}</strong>
                <small>
                  {p.channel} / {Math.round(p.duration * multiplier)} SEC
                </small>
              </div>
              {state.index === i && !state.done && <ChevronRight size={12} />}
            </div>
          ))}
          <div className="os-phase-timing">
            <span>ELAPSED / TOTAL</span>
            <strong>
              {formatTime(state.elapsed)}{" "}
              <small>/ {formatTime(state.duration)}</small>
            </strong>
          </div>
        </aside>
        <div className="os-sequence-display">
          <div className="os-between">
            <span>{state.phase.channel}</span>
            <span>
              {state.done ? "COMPLETE" : "PROCESSING"} /{" "}
              {(state.progress * 100).toFixed(1)}%
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              className="os-phase-visual"
              key={state.phase.mode}
              initial={{ opacity: 0, clipPath: "inset(50% 0)" }}
              animate={{ opacity: 1, clipPath: "inset(0% 0)" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24 }}
            >
              <SequenceVisual
                mode={state.phase.mode}
                time={state.elapsed}
                progress={state.phaseProgress}
                seed={seed}
              />
            </motion.div>
          </AnimatePresence>
          <h3>
            {state.done
              ? sequence.id === "operation"
                ? "Containment exception."
                : "Sequence verified."
              : state.phase.name}
          </h3>
          <p>
            {state.done
              ? "Local result committed to the workspace."
              : state.phase.detail}
          </p>
          <div className="os-progress">
            <div style={{ width: `${state.progress * 100}%` }} />
          </div>
          <div className="os-segment-progress">
            {Array.from({ length: 48 }, (_, i) => (
              <i
                key={i}
                className={i / 48 < state.phaseProgress ? "lit" : ""}
              />
            ))}
          </div>
        </div>
        <aside className="os-sequence-detail">
          <span className="os-kicker">PROCESS TELEMETRY</span>
          {["REFERENCE LOCK", "COHERENCE", "BUFFER WINDOW"].map((label, i) => (
            <div className="os-small-meter" key={label}>
              <span>{label}</span>
              <strong>
                <Changed
                  value={(state.done
                    ? 100
                    : Math.min(
                        99.9,
                        72 +
                          state.progress * 25 +
                          noise(i + Math.floor(state.elapsed / 3), seed) * 2,
                      )
                  ).toFixed(1)}
                />
                <small>%</small>
              </strong>
              <div>
                <i
                  style={{
                    width: `${state.done ? 100 : 72 + state.progress * 25}%`,
                  }}
                />
              </div>
            </div>
          ))}
          <div className="os-checksum">
            <span className="os-kicker">FRAME SIGNATURE</span>
            <p>
              {Array.from({ length: 8 }, (_, i) =>
                Math.floor(noise(i + Math.floor(state.elapsed), seed) * 65535)
                  .toString(16)
                  .padStart(4, "0")
                  .toUpperCase(),
              ).join(" ")}
            </p>
          </div>
          <div className="os-log">
            <span className="os-kicker">PROCESS JOURNAL</span>
            {logs.map((l) => (
              <div key={l.index}>
                <span>{l.channel}</span>
                {l.line}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
