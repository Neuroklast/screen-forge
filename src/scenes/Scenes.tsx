import { BrandMark } from "../components/BrandMark";
import { Corporate, Tracking, Hologram } from "./shared/LiveScenes";
import { Warhead } from "./shared/Warhead";
import { CyberOS } from "./os/CyberOS";

import type { Config } from "../core/config";
import { noise, type Cue } from "../core/runtime";

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
  countdown: Warhead,
  tracking: Tracking,
  hologram: Hologram,
};
