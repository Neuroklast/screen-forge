import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SequenceVisual } from "./Visuals";
import { Changed } from "../shared/Process";
import type { Phase } from "./sequences";
const chain: {
  command: string;
  title: string;
  mode: Phase["mode"];
  lines: string[];
}[] = [
  {
    command: "inspect relay --sector 07 --verify",
    title: "Interface discovery",
    mode: "trace",
    lines: [
      "Loading cached relay inventory…",
      "192.0.2.17   relay-07   UP   mtu 1500",
      "6 interfaces mapped / route signatures consistent",
      "Local analysis complete / relay inventory committed",
    ],
  },
  {
    command: "ip -br address show dev relay0",
    title: "Interface enumeration",
    mode: "matrix",
    lines: [
      "relay0    UP    192.0.2.42/24",
      "link/ether 02:00:00:07:20:48",
      "Carrier detected / reference clock aligned",
      "Interface snapshot saved: /workspace/relay0.state",
    ],
  },
  {
    command: "ip route get 192.0.2.17",
    title: "Route reconstruction",
    mode: "trace",
    lines: [
      "192.0.2.17 via 192.0.2.1 dev relay0 src 192.0.2.42",
      "Resolving cached hop signatures…",
      "hop 01  gateway-07  1.23 ms",
      "hop 02  archive-07  3.48 ms / path verified",
    ],
  },
  {
    command: "ss -tn state established",
    title: "Session correlation",
    mode: "spectrum",
    lines: [
      "Recv-Q Send-Q Local Address:Port Peer Address:Port",
      "0      0      192.0.2.42:41208   192.0.2.17:22",
      "0      0      192.0.2.42:41210   192.0.2.28:443",
      "2 sessions correlated / timestamp delta 0.014 s",
    ],
  },
  {
    command: "ssh -v analyst@relay-07.local",
    title: "Identity handshake",
    mode: "rings",
    lines: [
      "Reading local session fixture / relay-07.local",
      "Remote protocol version 2.0 / cached banner",
      "Host fingerprint SHA256:8e4a17c92048 verified",
      "Public key accepted / local archive shell attached",
    ],
  },
  {
    command: 'find /srv/archive -name "*.manifest"',
    title: "Archive enumeration",
    mode: "matrix",
    lines: [
      "/srv/archive/sector-07.manifest",
      "/srv/archive/incident-041.manifest",
      "Reading cached block index…",
      "2 manifests / 2048 indexed records / 1 missing interval",
    ],
  },
  {
    command: "sha256sum -c /srv/archive/sector-07.manifest",
    title: "Integrity analysis",
    mode: "fingerprint",
    lines: [
      "personnel.idx: OK",
      "event-064217.log: OK",
      "sector-07.fragment: INCOMPLETE",
      "Integrity mismatch isolated / recovery map prepared",
    ],
  },
  {
    command: "archive-replay --recover sector-07.fragment",
    title: "Fragment reconstruction",
    mode: "lattice",
    lines: [
      "Aligning 128 cached fragments…",
      "Parity reconstruction: 128/128 blocks",
      "Recovered interval 06:42:17.014 → 06:42:18.908",
      "Recovery report saved /workspace/recovery.report",
    ],
  },
  {
    command: "cat /workspace/recovery.report",
    title: "Evidence correlation",
    mode: "trace",
    lines: [
      "CASE 041 / SECTOR 07",
      "Identity: E. Ward / relay timestamp 06:42:17",
      "Archive interval reconstructed / signature verified",
      "Case snapshot committed. Cycling to next relay.",
    ],
  },
];
export function useActorPlayback(
  time: number,
  onPlay: (() => void) | undefined,
  firstCommand: string,
) {
  const [index, setIndex] = useState(0),
    [running, setRunning] = useState<{
      start: number;
      index: number;
      command: string;
    } | null>(null),
    [history, setHistory] = useState<string[]>([
      "BLACKLINE / session fixture mounted",
      "Cached network environment ready. Awaiting operator.",
    ]);
  const stage = chain[index % chain.length];
  const target = index === 0 ? firstCommand : stage.command;
  const elapsed = running ? Math.max(0, time - running.start) : 0,
    progress = running ? Math.min(1, elapsed / 4) : 0;
  const visible = running
    ? stage.lines.slice(
        0,
        Math.min(stage.lines.length, Math.floor(elapsed / 0.8)),
      )
    : [];
  useEffect(() => {
    if (running && progress === 1) {
      setHistory((h) =>
        [
          ...h,
          `operator@relay07:~$ ${running.command}`,
          ...chain[running.index % chain.length].lines,
        ].slice(-60),
      );
      setRunning(null);
      setIndex((i) => i + 1);
    }
  }, [running, progress]);
  const submit = (command: string) => {
    if (running || !command.trim()) return;
    setRunning({ start: time, index, command: target });
    onPlay?.();
  };
  return {
    index,
    stage,
    target,
    busy: !!running,
    progress,
    submit,
    lines: running
      ? [...history, `operator@relay07:~$ ${running.command}`, ...visible]
      : history,
  };
}
export function TerminalVisual({
  time,
  index,
  progress,
  mode,
  title,
  seed,
}: {
  time: number;
  index: number;
  progress: number;
  mode: Phase["mode"];
  title: string;
  seed: number;
}) {
  const [images, setImages] = useState<{ name: string; url: string }[]>([]),
    [message, setMessage] = useState(""),
    [auto, setAuto] = useState(true),
    [selected, setSelected] = useState(0);
  const resources = useRef<string[]>([]);
  useEffect(
    () => () => {
      resources.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );
  const slot = images.length
    ? auto
      ? Math.floor(time / 5) % images.length
      : selected % images.length
    : 0;
  return (
    <div className="terminal-visual">
      <div className="os-between">
        <span className="os-kicker">
          <Changed value={title.toUpperCase()} />
        </span>
        <span>CH {String((index % 9) + 1).padStart(2, "0")}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={images.length ? images[slot].url : mode}
          className="terminal-visual-frame"
          initial={{ opacity: 0, clipPath: "inset(50% 0)" }}
          animate={{ opacity: 1, clipPath: "inset(0% 0)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {images.length ? (
            <img src={images[slot].url} alt={images[slot].name} />
          ) : (
            <SequenceVisual
              mode={mode}
              time={time}
              progress={progress || 0.8}
              seed={seed + index}
            />
          )}
        </motion.div>
      </AnimatePresence>
      <div className="process-rail">
        <i style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="os-between">
        <span>
          {images.length ? images[slot].name : "LIVE CHANNEL / SCENE CLOCK"}
        </span>
        <span>
          {images.length
            ? `${slot + 1}/${images.length}`
            : `${Math.round(progress * 100)}%`}
        </span>
      </div>
      <details className="terminal-media">
        <summary>Visual source / image sequence</summary>
        <label>
          Load local images
          <input
            aria-label="Terminalbilder laden"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (
                files.length > 8 ||
                files.some(
                  (f) =>
                    f.size > 4_000_000 ||
                    !/^image\/(png|jpeg|webp|gif)$/.test(f.type),
                )
              ) {
                setMessage(
                  "Maximum 8 images, 4 MB each. PNG, JPEG, WebP or GIF.",
                );
                return;
              }
              resources.current.forEach((url) => URL.revokeObjectURL(url));
              const next = files.map((f) => ({
                name: f.name,
                url: URL.createObjectURL(f),
              }));
              resources.current = next.map((f) => f.url);
              setImages(next);
              setSelected(0);
              setMessage(
                "Images remain in this session; reload after reopening.",
              );
            }}
          />
        </label>
        {!!images.length && (
          <>
            <button className="os-button" onClick={() => setAuto(!auto)}>
              {auto ? "Pause slideshow" : "Auto slideshow / 5 s"}
            </button>
            <button
              className="os-button"
              onClick={() => {
                setAuto(false);
                setSelected((slot + 1) % images.length);
              }}
            >
              Next image
            </button>
            <button
              className="os-button"
              onClick={() => {
                resources.current.forEach((url) => URL.revokeObjectURL(url));
                resources.current = [];
                setImages([]);
              }}
            >
              Live visualization
            </button>
          </>
        )}
        <p>{message}</p>
      </details>
    </div>
  );
}
