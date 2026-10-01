import { useState, type ReactNode } from "react";
import { t } from "../i18n";
import "./workspace.css";

// The shared editor shell (docs/architecture/workspace.md): a toolbar, a
// navigator, a canvas, a contextual inspector and a status bar. Panes are
// collapsible; on constrained widths they become overlay drawers so the canvas
// stays visible instead of collapsing into a vertical form stack.
function wideViewport(): boolean {
  try {
    return window.matchMedia("(min-width: 1100px)").matches;
  } catch {
    return true;
  }
}

export function WorkspaceShell({
  label,
  toolbar,
  navigator,
  canvas,
  inspector,
  status,
  focus = false,
}: {
  label: string;
  toolbar?: ReactNode;
  navigator: ReactNode;
  canvas: ReactNode;
  inspector: ReactNode;
  status?: ReactNode;
  focus?: boolean;
}) {
  const [navOpen, setNavOpen] = useState(wideViewport);
  const [inspectorOpen, setInspectorOpen] = useState(wideViewport);
  return (
    <section
      className="workspace-shell"
      aria-label={label}
      data-nav-open={!focus && navOpen}
      data-inspector-open={!focus && inspectorOpen}
      data-focus={focus}
    >
      <div className="workspace-shell-toolbar">
        <div className="workspace-shell-tools">{toolbar}</div>
        <div className="workspace-shell-panes">
          <button
            type="button"
            aria-pressed={navOpen}
            onClick={() => setNavOpen((value) => !value)}
          >
            {t("workspace.navigator")}
          </button>
          <button
            type="button"
            aria-pressed={inspectorOpen}
            onClick={() => setInspectorOpen((value) => !value)}
          >
            {t("workspace.inspector")}
          </button>
        </div>
      </div>
      <aside className="workspace-shell-nav">{navigator}</aside>
      <div className="workspace-shell-canvas">{canvas}</div>
      <aside className="workspace-shell-inspector">{inspector}</aside>
      {status && <div className="workspace-shell-status">{status}</div>}
    </section>
  );
}
