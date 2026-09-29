import { BrandMark } from "../components/BrandMark";
import { Corporate, Tracking, Hologram } from "./shared/LiveScenes";
import { Changed, ProcessReadout, useProcess } from "./shared/Process";
import { CyberOS } from "./os/CyberOS";

import type { Config } from "../core/config";
import { countdown, formatTime, noise, type Cue } from "../core/runtime";

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
export function Wave({ seed = 1, time = 0 }: { seed?: number; time?: number }) {
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
          <BrandMark config={config} />
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
export function Countdown(props: SceneProps) {
  const { config, time, cue } = props;
  const process = useProcess(props);
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
              <b>
                <Changed
                  value={process.job && !process.done ? "VERIFYING" : b}
                />
              </b>
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
              disabled={done || (!!process.job && !process.done)}
              onClick={() =>
                process.start(
                  "DISPLAY DIAGNOSTICS",
                  [
                    "Check timing reference",
                    "Verify power channel",
                    "Read enclosure sensors",
                  ],
                  Math.max(0.5, Math.min(9, left)),
                  "Display channels verified / report saved",
                )
              }
            >
              DIAGNOSTICS
            </button>
          </div>
        )}
        <ProcessReadout process={process} />
      </div>
      <footer className="scene-footer">
        <span>SC-09 / INDEPENDENT DISPLAY MODULE</span>
        <span>CHECKSUM 84F2 · REV 03</span>
      </footer>
    </div>
  );
}
export function Terrain() {
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
export const sceneComponents = {
  corporate: Corporate,
  terminal: CyberOS,
  countdown: Countdown,
  tracking: Tracking,
  hologram: Hologram,
};
