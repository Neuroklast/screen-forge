import { motion } from "motion/react";
import { noise } from "../../core/runtime";
import type { Phase } from "./sequences";
export function FingerprintGraphic({
  progress = 0,
  time = 0,
}: {
  progress?: number;
  time?: number;
}) {
  return (
    <svg viewBox="0 0 220 260" className="os-fingerprint" aria-hidden="true">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        {Array.from({ length: 13 }, (_, i) => (
          <path
            key={i}
            opacity={0.25 + i * 0.055}
            d={`M${17 + i * 6} ${198 - i * 3} C${-8 + i * 8} ${28 + i * 7},${216 - i * 8} ${25 + i * 7},${202 - i * 6} ${174 - i * 3} C${191 - i * 5} ${229 - i * 3},${133 - i * 2} ${252 - i * 3},${111 - i * 2} ${210 - i * 2}`}
          />
        ))}
        <path d="M107 208C96 168 137 141 116 112C96 93 79 120 86 149M36 219L48 190M158 233L174 212" />
      </g>
      <path
        d={`M10 ${35 + progress * 185}H210`}
        stroke="var(--os-cyan)"
        strokeWidth="2"
      />
      <g fill="var(--os-cyan)">
        {[
          [70, 82],
          [147, 113],
          [88, 178],
          [160, 190],
          [110, 133],
        ].map(([x, y], i) => (
          <g key={i} opacity={progress > (i + 1) / 7 ? 1 : 0.12}>
            <rect
              x={x - 5}
              y={y - 5}
              width="10"
              height="10"
              fill="none"
              stroke="currentColor"
            />
            <text x={x + 8} y={y + 4} fontSize="7">
              {(i * 13 + 41).toString(16).toUpperCase()}
            </text>
          </g>
        ))}
      </g>
      <text x="10" y="252" fontSize="8" fill="currentColor">
        CONTACT FIELD /{" "}
        {Math.floor(time * 17)
          .toString(16)
          .padStart(4, "0")
          .toUpperCase()}
      </text>
    </svg>
  );
}
export function projectTesseract(a: number, b: number) {
  return Array.from({ length: 16 }, (_, i) => {
    let [x, y, z, w] = [0, 1, 2, 3].map<number>((k) => (i & (1 << k) ? 1 : -1));
    [x, w] = [
      x * Math.cos(a) - w * Math.sin(a),
      x * Math.sin(a) + w * Math.cos(a),
    ];
    [y, z] = [
      y * Math.cos(b) - z * Math.sin(b),
      y * Math.sin(b) + z * Math.cos(b),
    ];
    const d4 = 3.5 / (3.5 - w);
    x *= d4;
    y *= d4;
    z *= d4;
    const d3 = 5 / (5 - z);
    return { x: 250 + x * d3 * 77, y: 205 + y * d3 * 77, z, w };
  });
}
const edges = Array.from({ length: 16 }, (_, i) =>
  [0, 1, 2, 3].map((k) => [i, i ^ (1 << k)]),
)
  .flat()
  .filter(([a, b]) => a < b);
export function Hypercube({
  time = 0,
  angle = 0,
  tilt = 0.4,
  wire = true,
}: {
  time?: number;
  angle?: number;
  tilt?: number;
  wire?: boolean;
}) {
  const points = projectTesseract(angle + time * 0.085, tilt + time * 0.049);
  return (
    <svg
      viewBox="0 0 500 410"
      className="os-hypercube"
      aria-label="Vierdimensionaler Hyperwürfel als zweidimensionale Projektion"
    >
      <defs>
        <radialGradient id="os-space-halo">
          <stop stopColor="var(--os-cyan)" stopOpacity=".1" />
          <stop offset="1" stopColor="var(--os-cyan)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="250" cy="205" r="195" fill="url(#os-space-halo)" />
      <g fill="none" stroke="var(--os-cyan)">
        <ellipse cx="250" cy="324" rx="192" ry="45" opacity=".2" />
        <path d="M20 205H480M250 15V395" opacity=".1" />
        <circle
          cx="250"
          cy="205"
          r="176"
          opacity=".16"
          strokeDasharray="2 12"
        />
        {edges.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={points[a].x}
            y1={points[a].y}
            x2={points[b].x}
            y2={points[b].y}
            stroke={a < 8 && b < 8 ? "var(--accent)" : "var(--os-cyan)"}
            strokeWidth={wire ? 1 : 2}
            opacity={0.3 + (points[a].w + 2) * 0.15}
          />
        ))}
        {points.map((p, i) => (
          <g key={i}>
            <rect
              x={p.x - 2}
              y={p.y - 2}
              width="4"
              height="4"
              fill="var(--os-cyan)"
              stroke="none"
            />
            <text
              x={p.x + 7}
              y={p.y - 7}
              fontSize="7"
              fill="var(--os-cyan)"
              stroke="none"
            >
              V{i.toString().padStart(2, "0")}
            </text>
          </g>
        ))}
      </g>
      <g fill="currentColor" fontSize="8" opacity=".5">
        <text x="20" y="25">
          XW / YZ PROJECTION
        </text>
        <text x="20" y="391">
          16 VERTICES : 32 EDGES : 8 CELLS
        </text>
      </g>
    </svg>
  );
}
export function TraceMap({
  time = 0,
  progress = 0.5,
  seed = 2048,
}: {
  time?: number;
  progress?: number;
  seed?: number;
}) {
  const nodes = Array.from({ length: 20 }, (_, i) => ({
    x: 35 + noise(i, seed) * 430,
    y: 35 + noise(i, seed + 1) * 300,
  }));
  return (
    <svg viewBox="0 0 500 370" className="os-trace" aria-hidden="true">
      <g fill="none" stroke="var(--os-cyan)" strokeWidth=".8">
        {nodes.slice(1).map((p, i) => (
          <path
            key={i}
            d={`M${nodes[Math.floor(i / 2)].x} ${nodes[Math.floor(i / 2)].y}H${p.x}V${p.y}`}
            opacity={i / 20 < progress ? 0.5 : 0.08}
          />
        ))}
        {nodes.map((p, i) => (
          <g key={i} opacity={i / 20 < progress ? 1 : 0.2}>
            <rect
              x={p.x - 4}
              y={p.y - 4}
              width="8"
              height="8"
              fill="var(--os-bg)"
            />
            <text
              x={p.x + 9}
              y={p.y + 3}
              fontSize="8"
              stroke="none"
              fill="currentColor"
            >{`R${i.toString().padStart(2, "0")}`}</text>
            {i === Math.floor(time) % 20 && (
              <circle cx={p.x} cy={p.y} r="12" stroke="var(--accent)" />
            )}
          </g>
        ))}
      </g>
      <text x="20" y="360" fontSize="8" fill="currentColor" opacity=".5">
        TOPOLOGY / {Math.floor(progress * 20)} LINKS RESOLVED
      </text>
    </svg>
  );
}
export function SequenceVisual({
  mode,
  time,
  progress,
  seed,
}: {
  mode: Phase["mode"];
  time: number;
  progress: number;
  seed: number;
}) {
  if (mode === "lattice") return <Hypercube time={time} />;
  if (mode === "fingerprint")
    return <FingerprintGraphic progress={progress} time={time} />;
  if (mode === "trace")
    return <TraceMap time={time} progress={progress} seed={seed} />;
  if (mode === "matrix")
    return (
      <svg viewBox="0 0 500 370" className="os-matrix" aria-hidden="true">
        {Array.from({ length: 192 }, (_, i) => {
          const x = 35 + (i % 16) * 27,
            y = 28 + Math.floor(i / 16) * 25;
          const active = i / 192 < progress;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width="21"
                height="17"
                fill={active ? "var(--os-cyan)" : "var(--accent)"}
                opacity={active ? 0.15 + noise(i, seed) * 0.5 : 0.05}
              />
              {i % 7 === 0 && (
                <text
                  x={x + 2}
                  y={y + 11}
                  fontSize="6"
                  fill={active ? "var(--os-cyan)" : "currentColor"}
                  opacity=".7"
                >
                  {Math.floor(noise(i, seed) * 255)
                    .toString(16)
                    .padStart(2, "0")
                    .toUpperCase()}
                </text>
              )}
            </g>
          );
        })}
        <path d={`M25 ${30 + progress * 298}H474`} stroke="var(--accent)" />
        <text x="35" y="354" fontSize="9" fill="currentColor">
          {Math.floor(progress * 192)
            .toString()
            .padStart(3, "0")}{" "}
          / 192 BLOCKS RESOLVED
        </text>
      </svg>
    );
  if (mode === "spectrum")
    return (
      <svg viewBox="0 0 500 370" className="os-spectrum" aria-hidden="true">
        <g stroke="currentColor" opacity=".1">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M30 ${40 + i * 50}H470`} />
          ))}
        </g>
        {Array.from({ length: 64 }, (_, i) => {
          const h =
            25 +
            (Math.sin(time * 0.7 + i * 0.16) * 0.5 + 0.5) *
              noise(i, seed) *
              220;
          return (
            <rect
              key={i}
              x={32 + i * 6.8}
              y={300 - h}
              width="4"
              height={h}
              fill={i > 25 && i < 39 ? "var(--accent)" : "var(--os-cyan)"}
              opacity={0.25 + progress * 0.65}
            />
          );
        })}
        <path
          d={`M30 300Q170 ${120 + Math.sin(time) * 10} 250 140T470 300`}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1"
        />
        <text x="30" y="340" fontSize="8" fill="currentColor">
          CARRIER BAND 07 / PHASE-ALIGNED SPECTRUM
        </text>
      </svg>
    );
  return (
    <svg viewBox="0 0 500 370" className="os-rings" aria-hidden="true">
      <g transform="translate(250 182)">
        <g fill="none">
          {[70, 92, 112, 139].map((r, i) => (
            <g
              key={r}
              transform={`rotate(${time * (i % 2 ? 9 : -13) + i * 25})`}
            >
              <circle
                r={r}
                stroke={i % 2 ? "var(--accent)" : "var(--os-cyan)"}
                strokeWidth={i === 1 ? 7 : 1}
                strokeDasharray={
                  i === 1 ? "2 7" : i === 3 ? "140 90 12 30" : "70 20 8 40"
                }
                opacity={0.25 + i * 0.14}
              />
            </g>
          ))}
          <circle
            r="58"
            stroke="var(--os-cyan)"
            strokeWidth="2"
            pathLength="1"
            strokeDasharray={`${progress} 1`}
            transform="rotate(-90)"
          />
        </g>
        <text textAnchor="middle" y="8" fontSize="29" fill="currentColor">
          {Math.floor(progress * 100)
            .toString()
            .padStart(2, "0")}
          <tspan fontSize="10">%</tspan>
        </text>
        <text
          textAnchor="middle"
          y="29"
          fontSize="7"
          fill="var(--os-cyan)"
          letterSpacing="2"
        >
          PHASE ALIGNMENT
        </text>
      </g>
      <path
        d="M20 60V20H60M440 20H480V60M20 310V350H60M440 350H480V310"
        stroke="currentColor"
        fill="none"
        opacity=".35"
      />
      <text x="20" y="366" fontSize="8" fill="currentColor" opacity=".5">
        REFERENCE OSCILLATOR / LOCAL CLOCK
      </text>
    </svg>
  );
}
