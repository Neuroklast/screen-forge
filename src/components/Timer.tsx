import { clockParts, formatTime } from "../core/runtime";

// One implementation of the countdown capability (SSOT: never two). Renders
// the remaining time as digit spans so every host keeps its own type styling;
// the host owns the progress rail and layout.
export function Timer({
  remaining,
  format = "hhmmss",
  className = "",
}: {
  remaining: number;
  format?: "mmss" | "hhmmss";
  className?: string;
}) {
  const p = clockParts(remaining);
  return (
    <div
      className={`timer-digits ${className}`.trim()}
      aria-label={formatTime(remaining)}
    >
      {format === "hhmmss" && (
        <>
          <span>{p.hh}</span>
          <i>:</i>
        </>
      )}
      <span>{p.mm}</span>
      <i>:</i>
      <span>{p.ss}</span>
    </div>
  );
}
