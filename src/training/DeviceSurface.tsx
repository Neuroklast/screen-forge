import { presentationConfig } from "../core/config";
import type { Cue } from "../core/runtime";
import { useTraining } from "../core/useExercise";
import { t } from "../i18n";
import { WorkflowSurface } from "../scenes/workflow/Surfaces";
import { StageFrame } from "../views/StageFrame";
import { BeaconControl } from "./BeaconControl";
import { CameraFeed } from "./CameraFeed";
import { OrdnanceConsole } from "./OrdnanceConsole";
import { OrdnanceDatasheet } from "./OrdnanceDatasheet";
import { TacticalMap } from "./TacticalMap";
import { TrainingTerminal } from "./TrainingTerminal";

// One decision point for how a device renders, shared by the operator field
// shell (ElementView) and the editor preview (Device Builder). The field host
// uses the live consoles; the preview host skips the side-effectful leaves
// (Leaflet map, WebRTC camera feed) and renders their scene surface instead, and
// drives the cue from the editor preview state (docs/architecture/previews.md).
// Scene blocks can still run user-initiated local effects (e.g. a camera
// permission prompt); that is a recorded exception, not a silent one.

const INSTRUMENT_SCENES = {
  rotary: "rotary",
  "code-table": "code-table",
  "data-sheet": "data-sheet",
  clock: "clock",
} as const;

function isInstrument(
  module: string,
): module is keyof typeof INSTRUMENT_SCENES {
  return module in INSTRUMENT_SCENES;
}

export function DeviceSurface({
  station,
  host = "field",
  previewCue,
}: {
  station: string;
  host?: "field" | "preview";
  previewCue?: Cue;
}) {
  const ex = useTraining();
  const row = ex.state.scenario.stations.find((s) => s.id === station);
  if (!row) return null;
  const present = row.presentation;
  const instance =
    Object.values(ex.state.workflows).find((i) => i.status === "running") ??
    Object.values(ex.state.workflows)[0];
  const pending = (ex.state.workflowTriggers ?? []).find(
    (t) =>
      t.trigger.type === "prop" &&
      t.trigger.prop === row.bindings.prop &&
      ex.state.propStates[t.trigger.prop] !== t.trigger.to,
  );
  const connectState =
    pending?.trigger.type === "prop" ? pending.trigger.to : "";
  const preview = host === "preview";

  if (instance)
    return (
      <WorkflowSurface
        config={presentationConfig(present?.scene ?? "terminal", present)}
        stationName={row.name}
        boundProp={row.bindings.prop}
        instance={instance}
        disabled={!ex.online || ex.state.frozen}
        time={ex.state.clock}
        onInput={(value) => ex.send({ type: "interaction", value })}
        onProp={(state) => ex.send({ type: "prop", state })}
      />
    );

  if (connectState)
    return (
      <section className="field-connect">
        <h2>{t("field.deviceLink")}</h2>
        <p>{t("field.attachCable")}</p>
        <button
          disabled={!ex.online || ex.state.frozen}
          onClick={() => ex.send({ type: "prop", state: connectState })}
        >
          {t("field.connectDevice")}
        </button>
      </section>
    );

  if (row.module === "tracking" && !preview)
    return (
      <div className="field-map">
        <TacticalMap />
        <div className="field-overlay-panel">
          <h2>{t("field.tasking")}</h2>
          {ex.state.scenario.objectives.map((o) => (
            <p key={o.id}>
              {ex.state.completed.includes(o.id)
                ? t("field.complete")
                : t("field.open")}
              : {o.name}
            </p>
          ))}
        </div>
      </div>
    );

  if (row.module === "camera" && !preview) return <CameraFeed station={row.id} publish />;

  if (["countdown", "access", "lock"].includes(row.module))
    return <TrainingTerminal station={row} />;

  if (row.module === "ordnance") return <OrdnanceConsole station={row} />;

  if (row.module === "beacon") return <BeaconControl station={row} />;

  if (row.module === "data-sheet" && row.bindings.prop)
    return (
      <OrdnanceDatasheet
        ordnanceId={
          ex.state.scenario.props.find((p) => p.id === row.bindings.prop)
            ?.ordnanceId || ""
        }
        custom={ex.state.scenario.ordnanceTypes}
      />
    );

  const scene = present?.scene ?? (isInstrument(row.module) ? INSTRUMENT_SCENES[row.module] : row.module);
  return (
    <StageFrame
      key={`${scene}:${row.id}:${present?.revision ?? 0}`}
      scene={scene}
      presentation={present}
      station={row.id}
      mark
      native={isInstrument(row.module) && !preview}
      preview={preview}
      cue={previewCue}
    />
  );
}
