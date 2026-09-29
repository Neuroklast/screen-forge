import { useEffect, useRef, useState } from "react";
import type { SceneProps } from "../Scenes";
import { CodePad } from "../../components/CodePad";

import { playSound } from "../../core/sound";
import { useLatchSlider } from "./useLatchSlider";
import { useMicWaveform } from "./useMicWaveform";
import { useMedia } from "../../core/media";
import { exampleCameraFeeds } from "../../core/exampleMedia";
import { HudFrame } from "../../components/HudFrame";
import { createPatient, ecgPath, vitalsOf } from "../../core/patient";
import { useExerciseMaybe } from "../../core/useExercise";
function signal(value: string) {
  window.dispatchEvent(
    new CustomEvent("screenforge:input", { detail: { type: "signal", value } }),
  );
}
export function Lock({ config, onCue }: SceneProps) {
  return (
    <div className="block-scene scene-inner">
      <HudFrame
        label={`KEYPAD / ${config.sceneOptions.lock.attempts} VERSUCHE`}
        className="block-frame"
      >
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
      </HudFrame>
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
      <HudFrame label="INTERLOCK" className="block-frame">
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
      </HudFrame>
    </div>
  );
}
export function Medical({ config, time, onPlay, onCue }: SceneProps) {
  const ex = useExerciseMaybe();
  const station = ex?.state.scenario.stations.find(s => s.id === ex.station);
  const assigned = ex?.state.scenario.patients.find(p => p.id === station?.bindings.patient);
  const patient = assigned ?? createPatient();
  const v = { ...vitalsOf(patient, time, config.seed), ...(assigned?.overrides ?? {}) };
  const alarm = patient.kind === "arrest" || patient.kind === "desat";
  const options = config.sceneOptions.medical;
  const prev = vitalsOf(patient, Math.max(0, time - 2), config.seed);
  const arrow = (now: number, before: number) =>
    now > before + 1 ? "▲" : now < before - 1 ? "▼" : "▬";
  const glucose = (5.5 + Math.sin(time / 3 + config.seed) * 1.5).toFixed(1);
  const lactate = (1.2 + Math.abs(Math.sin(time / 5)) * 1.8).toFixed(1);
  return (
    <div className="block-scene scene-inner">
      <HudFrame label="BIO MONITOR" className="block-frame block-frame-fill">
        <div
          className={`bio-monitor ${alarm ? "alarm" : ""}`}
          data-alarm={alarm && options.alarms ? "on" : "off"}
        >
          <div className="bio-id">
            <span>{patient.name}</span>
            <b>{patient.kind.toUpperCase()}</b>
          </div>
          <svg className="bio-ecg" viewBox="0 0 320 56" aria-hidden="true">
            <path d={ecgPath(patient.kind, time, v.hr)} />
          </svg>
          <dl className="bio-grid">
            <div>
              <dt>HR</dt>
              <dd>
                {v.hr}
                {options.trends && (
                  <em className="bio-trend">{arrow(v.hr, prev.hr)}</em>
                )}
              </dd>
            </div>
            <div>
              <dt>SPO2</dt>
              <dd>
                {v.spo2}
                {options.trends && (
                  <em className="bio-trend">{arrow(v.spo2, prev.spo2)}</em>
                )}
              </dd>
            </div>
            <div>
              <dt>RR</dt>
              <dd>{v.rr}</dd>
            </div>
            <div>
              <dt>NIBP</dt>
              <dd>
                {v.sys}/{v.dia}
              </dd>
            </div>
            <div>
              <dt>ETCO2</dt>
              <dd>{v.etco2}</dd>
            </div>
            <div>
              <dt>TEMP</dt>
              <dd>{v.temp.toFixed(1)}</dd>
            </div>
            <div>
              <dt>GCS</dt>
              <dd>{v.gcs}</dd>
            </div>
            <div>
              <dt>GLU</dt>
              <dd>{glucose}</dd>
            </div>
            <div>
              <dt>LAC</dt>
              <dd>{lactate}</dd>
            </div>
          </dl>
          <button
            className="block-hold"
            disabled={!!ex && (!ex.online || ex.state.frozen)}
            onPointerDown={() => {
              if (ex) { ex.send({ type: "intervention", value: "treated" }); return; }
              onPlay?.();
              onCue("complete");
              signal("medical.enable");
              playSound("prompt");
            }}
          >
            MARK TREATED
          </button>
        </div>
      </HudFrame>
    </div>
  );
}
export function Camera({ config, time }: SceneProps) {
  const { assets } = useMedia();
  const [ch, setCh] = useState(0);
  const [live, setLive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !navigator.mediaDevices?.getUserMedia) return;
    let stream: MediaStream | undefined;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((s) => {
        stream = s;
        el.srcObject = s;
        void el.play();
        setLive(true);
      })
      .catch(() => setLive(false));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);
  const selected = (config.mediaIds ?? [])
    .map((id) => assets.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => !!a);
  const feeds = [
    ...selected.map((a) => ({ src: a.url, name: a.name })),
    ...exampleCameraFeeds.map((a) => ({ src: a.src, name: a.name })),
  ].slice(0, 4);
  return (
    <div className="block-scene scene-inner">
      <HudFrame label="OPTICS" className="block-frame block-frame-fill">
      <div className="block-cams">
        {feeds.map((feed, i) => (
          <button
            key={feed.src}
            className={ch === i ? "on" : ""}
            onClick={() => {
              setCh(i);
              playSound("click");
              signal("camera.select");
            }}
          >
            {i === 0 ? (
              <video ref={videoRef} muted playsInline autoPlay />
            ) : (
              <img src={feed.src} alt="" />
            )}
            <span>
              CAM 0{i + 1}
              <small>{i === 0 && live ? "LIVE" : (time * (i + 3)).toFixed(1)}</small>
            </span>
          </button>
        ))}
      </div>
      </HudFrame>
    </div>
  );
}
const commsChannels = [
  { id: "CH-01", name: "GATE", freq: "148.220" },
  { id: "CH-02", name: "OPS", freq: "151.940" },
  { id: "CH-04", name: "RELAY", freq: "164.075" },
  { id: "CH-07", name: "MED", freq: "155.340" },
];
export function Comms({ config, time, onPlay }: SceneProps) {
  const [hold, setHold] = useState<number | null>(null);
  const [ch, setCh] = useState(2);
  const tx = hold !== null;
  const mic = useMicWaveform(tx);
  const rx = !tx && mic.level > 0.08;
  const mode = tx ? "TX" : rx ? "RX" : "STBY";
  const channel = commsChannels[ch];
  const noiseFloor = (-98 + mic.level * 36).toFixed(0);
  const logs = [
    `${channel.id} ${mic.ready ? "mic lock" : "mic wait"}`,
    `carrier ${rx || tx ? "open" : "idle"}`,
    `mod ${(mic.level * 100).toFixed(0)}%`,
    `noise ${noiseFloor} dBm`,
    `${config.identifier} ack`,
    tx ? "ptt engaged" : rx ? "voice detect" : "squelch hold",
  ];
  const path = mic.bins
    .map((v, i) => {
      const x = (i / (mic.bins.length - 1)) * 320;
      const y = 36 + v * 28;
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <div className="block-scene scene-inner">
      <div className="comms-grid">
        <HudFrame label="CHANNELS" className="comms-channels">
          {commsChannels.map((item, i) => (
            <button
              key={item.id}
              className={ch === i ? "on" : ""}
              onClick={() => {
                setCh(i);
                playSound("click");
                signal("comms.channel");
              }}
            >
              <b>{item.id}</b>
              <span>{item.name}</span>
              <small>{item.freq}</small>
            </button>
          ))}
        </HudFrame>
        <HudFrame label="WAVEFORM" className="comms-wave">
          <div className="comms-meta">
            <span>{channel.freq} MHz</span>
            <span className={mode === "STBY" ? "" : "live"}>{mode}</span>
          </div>
          {tx ? (
            <>
              <svg viewBox="0 0 320 72" className="comms-svg" aria-hidden="true">
                <path d={path || "M0 36 L320 36"} />
              </svg>
              <div className="comms-vu" aria-hidden="true">
                {Array.from({ length: 16 }, (_, i) => (
                  <i
                    key={i}
                    className={mic.level * 16 > i ? "on" : ""}
                    style={{ height: `${12 + ((i + 3) % 5) * 6}px` }}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="comms-idle">STANDBY / HOLD TO ARM CARRIER</div>
          )}
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
            {tx ? "TRANSMIT" : "HOLD TO TALK"}
          </button>
        </HudFrame>
        <HudFrame label="LINK" className="comms-side">
          <dl className="block-dl comms-dl">
            <div>
              <dt>CARRIER</dt>
              <dd>{rx || tx ? "LOCK" : "OPEN"}</dd>
            </div>
            <div>
              <dt>NOISE</dt>
              <dd>{noiseFloor}</dd>
            </div>
            <div>
              <dt>MOD</dt>
              <dd>{Math.round(mic.level * 100)}</dd>
            </div>
          </dl>
          <pre className="block-log">
            {logs.slice(0, 3 + Math.floor(time) % 4).join("\n")}
          </pre>
          <p className="micro">
            {mic.ready ? "MIC LIVE" : "MIC STANDBY"} / {config.identifier}
          </p>
        </HudFrame>
      </div>
    </div>
  );
}
export function Slide({ config, onCue, onPlay }: SceneProps) {
  const [granted, setGranted] = useState(false);
  const latch = useLatchSlider({
    granted,
    onGranted: () => {
      setGranted(true);
      onCue("complete");
      signal("slide.open");
      onPlay?.();
    },
  });
  const t = latch.state.progress;
  return (
    <div className="block-scene scene-inner">
      <HudFrame
        label={`SLIDE / ${config.sceneOptions.slide.stages} STUFEN`}
        className="block-frame"
      >
      <div className="block-body latch-body">
        <dl className="block-dl">
          <div>
            <dt>TORQUE</dt>
            <dd>{(t * 48.6).toFixed(1)}</dd>
          </div>
          <div>
            <dt>VECTOR</dt>
            <dd>{t.toFixed(3)}</dd>
          </div>
          <div>
            <dt>LATCH</dt>
            <dd>{latch.state.latch.toUpperCase()}</dd>
          </div>
        </dl>
        <div className="latch-servos">
          <div className="latch-servo">
            <i style={{ height: `${Math.min(100, t * 110)}%` }} />
          </div>
          <div
            ref={latch.trackRef}
            className="latch-track"
            onPointerDown={latch.onPointerDownTrack}
          >
            <div className="latch-ticks" aria-hidden="true">
              {Array.from({ length: 11 }, (_, i) => (
                <span
                  key={i}
                  style={{ opacity: t * 10 >= i ? 0.9 : 0.2 }}
                />
              ))}
            </div>
            <div
              className="latch-fill"
              style={{ width: latch.pct <= 0 ? 0 : `calc(${latch.pct}% - 4px)` }}
            />
            <div className="latch-travel">
              <div
                className="latch-handle-wrap"
                style={{ transform: `translate3d(${t * 100}%, -50%, 0)` }}
              >
                <div
                  role="slider"
                  tabIndex={0}
                  aria-label="Zugang ausrichten"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={latch.pct}
                  className="latch-handle"
                  onPointerDown={latch.onPointerDownHandle}
                  onKeyDown={latch.onKeyDown}
                  onKeyUp={latch.onKeyUp}
                >
                  <span />
                </div>
              </div>
            </div>
          </div>
          <div className="latch-servo">
            <i style={{ height: `${Math.min(100, t * 92)}%` }} />
          </div>
        </div>
        <div className="latch-meter">
          <i style={{ width: `${latch.pct}%` }} />
        </div>
        <p className="micro">
          {granted || latch.state.latch === "sealed"
            ? "SEALED"
            : "SLIDE TO LATCH"}
        </p>
      </div>
      </HudFrame>
    </div>
  );
}
