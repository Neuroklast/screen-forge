import type { CSSProperties } from "react";
import type { Config } from "../../core/config";
export function DisplayOverlays({
  config,
  time,
}: {
  config: Config;
  time: number;
}) {
  const fx = config.overlays;
  const burst = fx.glitch > 0 && Math.floor(time * 8) % 67 === 5;
  return (
    <div
      className="os-display-overlays"
      aria-hidden="true"
      style={
        {
          "--overlay-glow": fx.glow * config.effects,
          "--overlay-scan": fx.scanlines * config.effects,
          "--overlay-grid": fx.grid * config.effects,
          "--overlay-grain": fx.grain * config.effects,
          "--overlay-vignette": fx.vignette * config.effects,
        } as CSSProperties
      }
    >
      <div className="os-overlay-grid" />
      <div
        className="os-overlay-scan"
        style={{ backgroundPositionY: `${Math.floor(time * 8) % 4}px` }}
      />
      <div className="os-overlay-grain" />
      <div className="os-overlay-glow" />
      <div className="os-overlay-vignette" />
      {burst && (
        <>
          <div
            className="os-overlay-tear"
            style={{
              top: `${18 + (Math.floor(time) % 53)}%`,
              opacity: fx.glitch * config.effects * 0.6,
            }}
          />
          <div
            className="os-overlay-chroma"
            style={{ opacity: fx.chromatic * config.effects * 0.6 }}
          />
        </>
      )}
    </div>
  );
}
