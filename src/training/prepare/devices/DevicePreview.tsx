import { useMemo, useRef } from "react";
import {
  presentationConfig,
  sceneIds,
  type SceneId,
} from "../../../core/config";
import type { Scenario, TrainingStation } from "../../../core/training";
import { ExerciseValueProvider } from "../../../core/useExercise";
import { t } from "../../../i18n";
import { DeviceSurface } from "../../DeviceSurface";
import { AnchorOverlay } from "./AnchorOverlay";
import {
  previewCue,
  previewExercise,
  previewStates,
  previewTrainingState,
  type PreviewState,
} from "./preview";

function effectiveScene(station: TrainingStation): SceneId {
  if (station.presentation?.scene) return station.presentation.scene;
  return (sceneIds as readonly string[]).includes(station.module)
    ? (station.module as SceneId)
    : "terminal";
}

// Canvas pane: the live preview. It renders the shared runtime surface with a
// synthetic, inert exercise value derived from the draft, and adds editor-only
// chrome (preview states, selection overlay). No second renderer, no preview
// model (docs/architecture/previews.md).
export function DevicePreview({
  station,
  scenario,
  preview,
  onPreviewState,
  selectedAnchor,
  onSelectAnchor,
  readOnly,
  onUpdateName,
  onUpdatePresentation,
}: {
  station: TrainingStation;
  scenario: Scenario;
  preview: PreviewState;
  onPreviewState: (preview: PreviewState) => void;
  selectedAnchor: string;
  onSelectAnchor: (anchor: string) => void;
  readOnly: boolean;
  onUpdateName: (name: string) => void;
  onUpdatePresentation: (patch: {
    title?: string;
    subtitle?: string;
    identifier?: string;
  }) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const value = useMemo(
    () =>
      previewExercise(
        previewTrainingState(scenario, station.id, preview),
        station.id,
      ),
    [scenario, station.id, preview],
  );
  const config = presentationConfig(
    effectiveScene(station),
    station.presentation,
  );
  const valueOf = (anchor: string): string => {
    switch (anchor) {
      case "station.name":
        return station.name;
      case "presentation.title":
        return config.title;
      case "presentation.subtitle":
        return config.subtitle;
      case "presentation.identifier":
        return config.identifier;
      default:
        return "";
    }
  };
  // Remount (and re-measure) on a device type/scene change, not on every name
  // keystroke; the overlay observes the surface for the rest.
  const stageKey = `${station.id}:${station.module}:${
    station.presentation?.scene ?? ""
  }:${station.presentation?.revision ?? 0}:${preview}`;
  const onCommit = (anchor: string, next: string) => {
    const trimmed = next.trim();
    if (!trimmed) return;
    if (anchor === "station.name") onUpdateName(trimmed);
    else if (anchor === "presentation.title") onUpdatePresentation({ title: trimmed });
    else if (anchor === "presentation.subtitle")
      onUpdatePresentation({ subtitle: trimmed });
    else if (anchor === "presentation.identifier")
      onUpdatePresentation({ identifier: trimmed });
  };

  return (
    <ExerciseValueProvider value={value}>
      <div className="device-preview" data-preview-state={preview}>
        <div className="device-preview-toolbar" role="group" aria-label={t("prep.devices.previewState")}>
          {previewStates.map((state) => (
            <button
              key={state}
              type="button"
              className={preview === state ? "active" : ""}
              onClick={() => onPreviewState(state)}
            >
              {t(`prep.devices.state.${state}`)}
            </button>
          ))}
        </div>
        <div className="device-preview-stage" ref={stageRef} key={stageKey}>
          <DeviceSurface
            station={station.id}
            host="preview"
            previewCue={previewCue(preview)}
          />
          <AnchorOverlay
            stageRef={stageRef}
            revisionKey={stageKey}
            selectedAnchor={selectedAnchor}
            readOnly={readOnly}
            onSelect={onSelectAnchor}
            valueOf={valueOf}
            onCommit={onCommit}
          />
          {preview === "offline" && (
            <div className="device-preview-scrim" role="status">
              {t("prep.devices.signalLost")}
            </div>
          )}
          {preview === "critical" && (
            <span className="device-preview-badge is-critical">
              {t("prep.devices.criticalBadge")}
            </span>
          )}
          {preview === "safe" && (
            <span className="device-preview-badge is-safe">
              {t("prep.devices.safeBadge")}
            </span>
          )}
        </div>
      </div>
    </ExerciseValueProvider>
  );
}
