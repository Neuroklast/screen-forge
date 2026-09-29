import type { Config } from "../core/config";
export function AtomEmblem() {
  return (
    <svg viewBox="0 0 64 64" aria-label="Containment emblem">
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3.2"
      />
      <circle
        cx="32"
        cy="32"
        r="26.2"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.4"
      />
      {[-90, 30, 150].map((deg) => (
        <path
          key={deg}
          transform={`rotate(${deg} 32 32)`}
          d="M32 32L21 11Q32 5 43 11Z"
          fill="#111"
          stroke="var(--accent)"
          strokeWidth=".4"
        />
      ))}
      <g fill="none" stroke="var(--accent)" strokeWidth="1.35">
        <ellipse cx="32" cy="32" rx="13.5" ry="5.4" />
        <ellipse
          cx="32"
          cy="32"
          rx="13.5"
          ry="5.4"
          transform="rotate(60 32 32)"
        />
        <ellipse
          cx="32"
          cy="32"
          rx="13.5"
          ry="5.4"
          transform="rotate(120 32 32)"
        />
      </g>
      <circle
        cx="32"
        cy="32"
        r="3.1"
        fill="var(--accent)"
        stroke="#111"
        strokeWidth="1.1"
      />
      <circle cx="45.4" cy="32" r="1.55" fill="var(--accent)" />
      <circle cx="25.3" cy="21.2" r="1.55" fill="var(--accent)" />
      <circle cx="25.3" cy="42.8" r="1.55" fill="var(--accent)" />
    </svg>
  );
}
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
  if (config.brand?.mark === "atom") return <AtomEmblem />;
  if (config.brand?.mark === "triad")
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
        />
        <path
          d="M32 18L42 36H22Z"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.4"
        />
        {[0, 120, 240].map((deg) => (
          <circle
            key={deg}
            cx="32"
            cy="16"
            r="5.2"
            fill="var(--accent)"
            transform={`rotate(${deg} 32 32)`}
          />
        ))}
      </svg>
    );
  if (config.brand?.mark === "plate")
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect
          x="6"
          y="6"
          width="52"
          height="52"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
        />
        <path
          d="M16 18H48L40 32H24Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        />
        <path d="M20 36H44L38 48H26Z" fill="currentColor" />
      </svg>
    );
  if (config.brand?.mark === "ridge")
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path
          d="M8 48V16H24L32 28L40 16H56V48H40L32 36L24 48Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
        />
        <path d="M20 40H44" stroke="var(--accent)" strokeWidth="3" />
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
