import type { ReactNode } from "react";
import "./hud-frame.css";
export function HudFrame({
  children,
  label,
  className = "",
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`hud-frame ${className}`.trim()}>
      <i className="hud-c hud-tl" />
      <i className="hud-c hud-tr" />
      <i className="hud-c hud-bl" />
      <i className="hud-c hud-br" />
      {label ? <span className="hud-frame-label">{label}</span> : null}
      {children}
    </div>
  );
}
