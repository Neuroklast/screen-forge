import { useEffect, useState, type ReactNode } from "react";
import { t } from "../i18n";
import "./workspace.css";

// The shared editor shell (docs/architecture/workspace.md): a toolbar, a
// navigator, a canvas, a contextual inspector and a status bar. On wide desktop
// the side panes are open by default and collapse via small edge handles; under
// 1100px they become overlay drawers and only one drawer is open at a time, so
// the canvas never collapses into a vertical form stack.
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

  // When the viewport narrows with both drawers open, keep only the navigator.
  useEffect(() => {
    let media: MediaQueryList;
    try {
      media = window.matchMedia("(min-width: 1100px)");
    } catch {
      return;
    }
    const onChange = () => {
      if (!media.matches) setInspectorOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggleNav = () =>
    setNavOpen((open) => {
      const next = !open;
      if (next && !wideViewport()) setInspectorOpen(false);
      return next;
    });
  const toggleInspector = () =>
    setInspectorOpen((open) => {
      const next = !open;
      if (next && !wideViewport()) setNavOpen(false);
      return next;
    });

  return (
    <section
      className="workspace-shell"
      aria-label={label}
      data-nav-open={!focus && navOpen}
      data-inspector-open={!focus && inspectorOpen}
      data-focus={focus}
    >
      <div className="workspace-shell-toolbar">{toolbar}</div>
      <aside className="workspace-shell-nav">{navigator}</aside>
      <div className="workspace-shell-canvas">
        {!focus && (
          <>
            <button
              type="button"
              className="workspace-shell-handle is-nav"
              aria-label={t("workspace.navigator")}
              aria-pressed={navOpen}
              onClick={toggleNav}
            >
              ‹
            </button>
            <button
              type="button"
              className="workspace-shell-handle is-inspector"
              aria-label={t("workspace.inspector")}
              aria-pressed={inspectorOpen}
              onClick={toggleInspector}
            >
              ›
            </button>
          </>
        )}
        {canvas}
      </div>
      <aside className="workspace-shell-inspector">{inspector}</aside>
      {status && <div className="workspace-shell-status">{status}</div>}
    </section>
  );
}
