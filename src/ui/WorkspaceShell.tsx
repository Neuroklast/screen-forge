import type { ReactNode } from "react";
import "./workspace.css";

// The shared editor shell (docs/architecture/workspace.md): navigator left,
// canvas/preview centre, contextual inspector right, optional status bar below.
// Deliberately minimal — build only what the current editor needs; abstract
// further only when a second editor proves the same pattern repeats.
export function WorkspaceShell({
  navigator,
  canvas,
  inspector,
  status,
  label,
}: {
  navigator: ReactNode;
  canvas: ReactNode;
  inspector: ReactNode;
  status?: ReactNode;
  label: string;
}) {
  return (
    <section className="workspace-shell" aria-label={label}>
      <aside className="workspace-shell-nav">{navigator}</aside>
      <div className="workspace-shell-canvas">{canvas}</div>
      <aside className="workspace-shell-inspector">{inspector}</aside>
      {status && <div className="workspace-shell-status">{status}</div>}
    </section>
  );
}
