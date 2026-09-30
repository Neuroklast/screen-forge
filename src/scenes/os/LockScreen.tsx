import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { FingerprintGraphic } from "./Visuals";
import { formatTime } from "../../core/runtime";
export function LockScreen({
  time,
  onPlay,
  onUnlock,
  title,
}: {
  time: number;
  onPlay: () => void;
  onUnlock: () => void;
  title: string;
}) {
  const [gate, setGate] = useState(0),
    [position, setPosition] = useState(0),
    [hold, setHold] = useState<number | null>(null);
  const released = useRef(false);
  const progress =
    hold === null ? 0 : Math.max(0, Math.min(1, (time - hold) / 3.5));
  useEffect(() => {
    if (progress >= 1 && !released.current) {
      released.current = true;
      onUnlock();
    }
  }, [progress, onUnlock]);
  const confirm = () => {
    const target = (gate + 1) * 33.333;
    if (position >= target - 3) {
      const next = Math.min(3, gate + 1);
      setGate(next);
      setPosition(next * 33.333);
    } else setPosition(gate * 33.333);
  };
  const start = () => {
    if (hold === null) {
      setHold(time);
      onPlay();
    }
  };
  const cancel = () => {
    setHold(null);
  };
  return (
    <motion.div
      className="os-lock-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(3px)" }}
      transition={{ duration: 0.25 }}
    >
      <div className="os-lock-top">
        <span>{title} / ACCESS GATEWAY</span>
        <span>LOCAL IDENTITY PROVIDER</span>
      </div>
      <div className="os-lock-main">
        <div className="os-lock-emblem">
          <LockKeyhole size={54} strokeWidth={0.8} />
          <span>09</span>
        </div>
        <span className="os-kicker">OPERATOR ACCESS / 3-POINT ALIGNMENT</span>
        <h2>Establish identity.</h2>
        <p>Align the three access gates, then hold the contact sensor.</p>
        <dl className="os-lock-tele">
          {[
            ["AUTH_CHAIN", `${gate}/3`],
            ["SLIDE_POS", `${position.toFixed(1)}`],
            ["GATE", gate < 3 ? `CHK-${gate + 1}` : "SENSOR"],
            ["CLOCK", formatTime(time)],
          ].map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="os-lock-stages">
          {["CARRIER", "SESSION", "IDENTITY"].map((x, i) => (
            <div
              key={x}
              className={gate > i ? "done" : gate === i ? "current" : ""}
            >
              <span>0{i + 1}</span>
              {x}
              <i />
            </div>
          ))}
        </div>
        {gate < 3 ? (
          <div className="os-unlock-control">
            <div className="os-between">
              <span>SLIDE TO GATE {gate + 1}</span>
              <span>{Math.round(position)} / 100</span>
            </div>
            <div className="os-unlock-rail">
              <div style={{ width: `${position}%` }} />
              <b className="os-unlock-handle" style={{ left: `${position}%` }} />
              <input
                aria-label="Align access"
                type="range"
                min="0"
                max="100"
                step="1"
                value={position}
                onChange={(e) =>
                  setPosition(
                    Math.max(
                      gate * 33.333,
                      Math.min((gate + 1) * 33.333, +e.target.value),
                    ),
                  )
                }
                onPointerUp={confirm}
                onKeyUp={(e) => {
                  if (["ArrowRight", "End", "Enter", " "].includes(e.key))
                    confirm();
                }}
              />
              {[1, 2, 3].map((i) => (
                <span key={i} style={{ left: `${i * 33.333 - 1}%` }}>
                  <ChevronRight size={15} />
                </span>
              ))}
            </div>
            <small>MOVE · RELEASE AT CHECKPOINT · CONTINUE</small>
          </div>
        ) : (
          <div className="os-contact">
            <button
              aria-label="Scan fingerprint"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                start();
              }}
              onPointerUp={cancel}
              onPointerCancel={cancel}
              onLostPointerCapture={cancel}
              onKeyDown={(e) => {
                if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                  e.preventDefault();
                  start();
                }
              }}
              onKeyUp={(e) => {
                if (e.key === " " || e.key === "Enter") cancel();
              }}
              onBlur={cancel}
            >
              <FingerprintGraphic progress={progress} time={time} />
              <span>
                {hold === null
                  ? "HOLD CONTACT SENSOR"
                  : `MATCHING RIDGES / ${Math.floor(progress * 100)}%`}
              </span>
            </button>
            <div>
              <ShieldCheck size={21} />
              <span>IDENTITY MATCH</span>
              <strong>{(progress * 99.8).toFixed(1)}%</strong>
              <div className="os-progress">
                <div style={{ width: `${progress * 100}%` }} />
              </div>
              <p>
                Keep contact for 3.5 seconds.
                <br />
                No biometric data is captured.
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="os-lock-bottom">
        <span>ACCESS CHAIN / BL-09 / OFFLINE</span>
        <span>SESSION ENVELOPE READY</span>
      </div>
    </motion.div>
  );
}
