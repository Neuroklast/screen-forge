import { useEffect, useState } from "react";
import type { SceneProps } from "../Scenes";
import { CodePad } from "../../components/CodePad";
import { formatTime, noise } from "../../core/runtime";
import { playSound } from "../../core/sound";
function signal(value: string) {
  window.dispatchEvent(
    new CustomEvent("screenforge:input", { detail: { type: "signal", value } }),
  );
}
export function Lock({ config, onCue }: SceneProps) {
  return (
    <div className="block-scene scene-inner">
      <CodePad
        embedded
        title="KEYPAD"
        code={config.pin}
        mode={config.pinMode}
        fake={config.pinFake}
        onUnlock={() => {
          onCue("complete");
          signal("lock.open");
        }}
      />
    </div>
  );
}
export function Access({ config, time, onPlay, onCue }: SceneProps) {
  const [hold, setHold] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const p = open ? 1 : hold === null ? 0 : Math.min(1, (time - hold) / 2);
  useEffect(() => {
    if (p < 1 || open) return;
    setOpen(true);
    onCue("complete");
    signal("access.open");
  }, [p, open, onCue]);
  return (
    <div className="block-scene scene-inner">

      <div className="block-body">
        <p className="micro">DOOR 02 / BOLT CURRENT</p>
        <div className="block-meter">
          <i style={{ width: `${(1 - p) * 100}%` }} />
        </div>
        <button
          className="block-hold"
          disabled={p >= 1}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setHold(time);
            onPlay?.();
            playSound("prompt");
          }}
          onPointerUp={() => p < 1 && setHold(null)}
          onPointerCancel={() => setHold(null)}
        >
          {open ? "UNLATCHED" : `HOLD TO UNLATCH ${Math.floor(p * 100)}%`}
        </button>
      </div>
    </div>
  );
}
export function Medical({ config, time, onPlay, onCue }: SceneProps) {
  const [hold, setHold] = useState<number | null>(null);
  const [on, setOn] = useState(false);
  const p = on ? 1 : hold === null ? 0 : Math.min(1, (time - hold) / 2);
  const hr = (72 + noise(Math.floor(time * 2), config.seed) * 6).toFixed(0);
  useEffect(() => {
    if (p < 1 || on) return;
    setOn(true);
    onCue("complete");
    signal("medical.enable");
  }, [p, on, onCue]);
  return (
    <div className="block-scene scene-inner">

      <div className="block-body">
        <dl className="block-dl">
          <div>
            <dt>HR</dt>
            <dd>{hr}</dd>
          </div>
          <div>
            <dt>SPO2</dt>
            <dd>98</dd>
          </div>
          <div>
            <dt>CLOCK</dt>
            <dd>{formatTime(time)}</dd>
          </div>
        </dl>
        <button
          className="block-hold"
          disabled={on}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setHold(time);
            onPlay?.();
            playSound("prompt");
          }}
          onPointerUp={() => !on && setHold(null)}
          onPointerCancel={() => setHold(null)}
        >
          {on ? "PROTOCOL ACTIVE" : `HOLD MED-01 ${Math.floor(p * 100)}%`}
        </button>
      </div>
    </div>
  );
}
export function Camera({ config, time }: SceneProps) {
  const [ch, setCh] = useState(0);
  return (
    <div className="block-scene scene-inner">

      <div className="block-cams">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            className={ch === i ? "on" : ""}
            onClick={() => {
              setCh(i);
              playSound("click");
              signal("camera.select");
            }}
          >
            <span>
              CAM 0{i + 1}
              <small>{(time * (i + 3)).toFixed(1)}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
export function Comms({ config, time, onPlay }: SceneProps) {
  const [hold, setHold] = useState<number | null>(null);
  const line = Math.floor(time * 1.4) % 6;
  const logs = [
    "CH-04 idle",
    "carrier lock",
    "pkt 2048 ok",
    "relay 07 ack",
    "noise floor -92",
    "voice ready",
  ];
  return (
    <div className="block-scene scene-inner">

      <div className="block-body">
        <pre className="block-log">
          {logs.slice(0, line + 1).join("\n")}
        </pre>
        <p className="micro">{config.identifier}</p>
        <button
          className="block-hold"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setHold(time);
            onPlay?.();
            playSound("prompt");
            signal("comms.ptt");
          }}
          onPointerUp={() => setHold(null)}
          onPointerCancel={() => setHold(null)}
        >
          {hold !== null ? "TRANSMIT" : "HOLD TO TALK"}
        </button>
      </div>
    </div>
  );
}
