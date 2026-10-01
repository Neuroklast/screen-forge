import { useCallback, useEffect, useState, type RefObject } from "react";
import { t } from "../../../i18n";
import { anchorSpec } from "./anchors";

// Editor-only overlay (docs/architecture/previews.md): measures the selectable
// regions the shared renderer declares with `data-sf-anchor` and turns them into
// hitboxes. It never re-implements the renderer; a device-level selection is the
// fallback when a surface declares no anchor.

type Rect = {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

export function AnchorOverlay({
  stageRef,
  revisionKey,
  selectedAnchor,
  readOnly,
  onSelect,
  valueOf,
  onCommit,
}: {
  stageRef: RefObject<HTMLElement | null>;
  revisionKey: string;
  selectedAnchor: string;
  readOnly: boolean;
  onSelect: (anchor: string) => void;
  valueOf: (anchor: string) => string;
  onCommit: (anchor: string, value: string) => void;
}) {
  const [rects, setRects] = useState<Rect[]>([]);
  const [editing, setEditing] = useState<string | null>(null);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const base = stage.getBoundingClientRect();
    const next: Rect[] = [];
    stage.querySelectorAll<HTMLElement>("[data-sf-anchor]").forEach((node) => {
      const id = node.dataset.sfAnchor;
      if (!id || !anchorSpec(id)) return;
      const rect = node.getBoundingClientRect();
      next.push({
        id,
        left: rect.left - base.left,
        top: rect.top - base.top,
        width: rect.width,
        height: rect.height,
      });
    });
    setRects(next);
  }, [stageRef]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    measure();
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    // The scene renderer corrects its scale asynchronously (ResizeObserver →
    // inline transform) and the surface can change without a size change; watch
    // the rendered surface (not the overlay, or setRects would re-trigger this).
    const surface = stage.firstElementChild;
    const mutations = new MutationObserver(measure);
    if (surface)
      mutations.observe(surface, {
        attributes: true,
        attributeFilter: ["style", "class"],
        subtree: true,
        childList: true,
      });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, revisionKey]);

  return (
    <div className="device-preview-anchors">
      {rects.map((rect) => {
        const spec = anchorSpec(rect.id);
        if (!spec) return null;
        const style = {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        };
        const label = t("prep.devices.anchorLabel", {
          name: t(spec.labelKey),
        });
        if (editing === rect.id)
          return (
            <input
              key={rect.id}
              className="device-preview-inline"
              style={style}
              autoFocus
              defaultValue={valueOf(rect.id)}
              aria-label={label}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onCommit(rect.id, event.currentTarget.value);
                  setEditing(null);
                } else if (event.key === "Escape") setEditing(null);
              }}
              onBlur={(event) => {
                onCommit(rect.id, event.currentTarget.value);
                setEditing(null);
              }}
            />
          );
        return (
          <button
            key={rect.id}
            type="button"
            className={`device-preview-anchor ${
              selectedAnchor === rect.id ? "is-selected" : ""
            }`}
            style={style}
            disabled={readOnly}
            aria-label={label}
            title={label}
            onClick={() => onSelect(rect.id)}
            onDoubleClick={() => spec.inline && setEditing(rect.id)}
          />
        );
      })}
    </div>
  );
}
