import type { Config } from "../core/config";
export function BrandMark({ config }: { config: Config }) {
  if (config.brand?.logo)
    return (
      <img
        className="custom-brand-logo"
        src={config.brand.logo}
        alt={`${config.title} logo`}
      />
    );
  if (config.brand?.mark === "umbrella")
    return (
      <svg viewBox="0 0 64 64" aria-label="Umbrella emblem">
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4,
            b = ((i + 1) * Math.PI) / 4;
          return (
            <path
              key={i}
              d={`M32 32L${32 + 29 * Math.cos(a)} ${32 + 29 * Math.sin(a)}L${32 + 29 * Math.cos(b)} ${32 + 29 * Math.sin(b)}Z`}
              fill={i % 2 === 0 ? "var(--accent)" : "#f2f2ed"}
              stroke="var(--theme-bg)"
              strokeWidth=".7"
            />
          );
        })}
      </svg>
    );
  if (config.brand?.mark === "hex")
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path
          d="M32 3L58 18V46L32 61L6 46V18Z M32 13L49 23V41L32 51L15 41V23Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M19 32H45M32 19V45" stroke="var(--accent)" strokeWidth="4" />
      </svg>
    );
  if (config.brand?.mark === "orbital")
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="15" fill="none" stroke="currentColor" />
        <ellipse
          cx="32"
          cy="32"
          rx="29"
          ry="10"
          transform="rotate(-35 32 32)"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <circle cx="49" cy="13" r="3" fill="currentColor" />
      </svg>
    );
  if (config.scene === "corporate")
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M2 2H32V32H2ZM32 32H62V62H32Z" fill="var(--accent)" />
        <path d="M13 13H23V23H13ZM41 41H51V51H41Z" fill="var(--scene-bg)" />
        <path d="M41 13H51V23H41ZM13 41H23V51H13Z" fill="currentColor" />
      </svg>
    );
  return (
    <span className="brand-monogram">
      {config.title
        .replace(/[^a-z0-9]/gi, "")
        .slice(0, 2)
        .toUpperCase()}
      <small>SYS / 09</small>
    </span>
  );
}
