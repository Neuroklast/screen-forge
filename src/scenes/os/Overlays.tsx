import type { CSSProperties } from "react";
import type { Config } from "../../core/config";
import { noise } from "../../core/runtime";
export function DisplayOverlays({
  config,
  time,
}: {
  config: Config;
  time: number;
}) {
  const fx = config.overlays,
    frame = Math.floor(time * 18);
  const burst =
    noise(Math.floor(time * 9), config.seed) >
    (config.mood === "damaged" ? 0.63 : 0.92);
  return (
    <div
      className="display-fx"
      aria-hidden="true"
      style={
        {
          "--scan": fx.scanlines * config.effects,
          "--grain": fx.grain * config.effects,
          "--grid": fx.grid * config.effects,
          "--glow": fx.glow * config.effects,
          "--vignette": fx.vignette * config.effects,
        } as CSSProperties
      }
    >
      <div
        className="fx-atmosphere"
        style={{
          opacity:
            config.mood === "clinical"
              ? 0
              : (0.32 + Math.sin(time * 2.3) * 0.13) * config.effects,
        }}
      />
      <div className="fx-grid" />
      <div
        className="fx-scan"
        style={{ backgroundPositionY: `${(time * 13) % 4}px` }}
      />
      <div
        className="fx-noise"
        style={{
          backgroundPosition: `${(frame * 37) % 151}px ${(frame * 73) % 149}px`,
        }}
      />
      <div className="fx-phosphor" />
      <div
        className="fx-sweep"
        style={{
          top: `${((time * 14) % 120) - 20}%`,
          opacity: fx.scanlines * config.effects * 0.32,
        }}
      />
      <svg
        className="fx-tech-noise"
        viewBox="0 0 1280 760"
        preserveAspectRatio="none"
        style={{ opacity: fx.grain * config.effects * 0.65 }}
      >
        {Array.from({ length: 30 }, (_, i) => {
          const x = noise(i + frame, 22) * 1280,
            y = noise(i + frame, 97) * 760;
          return (
            <path
              key={i}
              d={`M${x} ${y}h${2 + noise(i + frame, 10) * 35}`}
              stroke="var(--accent)"
              strokeWidth={i % 6 === 0 ? 2 : 0.5}
            />
          );
        })}
      </svg>
      <div className="fx-vignette" />
      <div
        className="fx-chroma"
        style={{ opacity: fx.chromatic * config.effects * (burst ? 0.8 : 0.3) }}
      />
      {burst && (
        <div
          className="fx-tear"
          style={{
            top: `${noise(frame, 4) * 90}%`,
            opacity: fx.glitch * config.effects,
            height: `${2 + noise(frame, 5) * 18}px`,
            transform: `translateX(${noise(frame, 6) * 16 - 8}px)`,
          }}
        />
      )}
    </div>
  );
}
