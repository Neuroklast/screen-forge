import {
  sceneIds,
  sceneOptionsDefaults,
  type SceneId,
  type ScenePreset,
} from "../../../core/config";
import { deviceSurfaceIds } from "../../../core/devices";
import { effectiveScene } from "./DevicePreview";
import type { ScenarioCapabilities } from "../../../core/capabilities";
import { propKinds, type Scenario, type TrainingStation } from "../../../core/training";
import { labelFor } from "../../../core/labels";
import { ordnanceTypes } from "../../../core/ordnance";
import { t } from "../../../i18n";
import { assetView } from "../assetView";
import { presetLabel, type DevicePreset } from "../devicePresets";
import type { DeviceSelection } from "./selection";

const CODE_MODULES = ["countdown", "access", "lock", "terminal"];
const MOODS = ["clinical", "tense", "damaged"] as const;
const PROP_KIND_LABELS: Record<string, string> = {
  ordnance: "prop.kind.ordnance",
  beacon: "prop.kind.beacon",
  payload: "prop.kind.payload",
  keycard: "prop.kind.keycard",
  custom: "prop.kind.custom",
};

// Commit on blur/Enter so one edit is one undo step (docs/architecture/editor-state.md).
function TextField({
  label,
  value,
  disabled,
  onCommit,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onCommit: (value: string) => void;
}) {
  return (
    <label className="sf-device-field">
      {label}
      <input
        key={value}
        defaultValue={value}
        disabled={disabled}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        onBlur={(event) => {
          if (event.currentTarget.value !== value)
            onCommit(event.currentTarget.value);
        }}
      />
    </label>
  );
}

// Contextual inspector: derives entirely from the selection. It shows only the
// selected object's properties — a device (identity first, advanced collapsed),
// a preview element, or a prop. No state of its own.
export function DeviceInspector({
  selection,
  station,
  prop,
  anchor,
  scenario,
  caps,
  readOnly,
  presets,
  teams,
  participants,
  hasOwnershipOptions,
  ownerOf,
  onUpdate,
  onSetBinding,
  onSetOwner,
  onPresentation,
  onRemove,
  onSelectDevice,
  onUpdateName,
  onUpdateProp,
  onRemoveProp,
}: {
  selection: DeviceSelection;
  station: TrainingStation | undefined;
  prop: Scenario["props"][number] | undefined;
  anchor: string;
  scenario: Scenario;
  caps: ScenarioCapabilities;
  readOnly: boolean;
  presets: DevicePreset[];
  teams: Scenario["teams"];
  participants: Scenario["stations"];
  hasOwnershipOptions: boolean;
  ownerOf: (station: TrainingStation) => string;
  onUpdate: (patch: Partial<TrainingStation>) => void;
  onSetBinding: (binding: Partial<TrainingStation["bindings"]>) => void;
  onSetOwner: (value: string) => void;
  onPresentation: (patch: {
    scene?: SceneId | null;
    config?: Partial<ScenePreset> | null;
  }) => void;
  onRemove: () => void;
  onSelectDevice: () => void;
  onUpdateName: (name: string) => void;
  onUpdateProp: (patch: Partial<Scenario["props"][number]>) => void;
  onRemoveProp: () => void;
}) {
  if (selection?.kind === "prop") {
    if (!prop) return <div className="sf-device-inspector" />;
    return (
      <div className="sf-device-inspector">
        <header className="sf-device-inspector-head">
          <span className="eyebrow">{t("prep.devices.props")}</span>
          <h3>{prop.name}</h3>
        </header>
        <label className="sf-device-field">
          {t("prep.devices.propKind")}
          <select
            value={prop.kind}
            disabled={readOnly}
            onChange={(event) =>
              onUpdateProp({ kind: event.target.value as typeof prop.kind })
            }
          >
            {propKinds.map((kind) => (
              <option key={kind} value={kind}>
                {t(PROP_KIND_LABELS[kind] ?? kind)}
              </option>
            ))}
          </select>
        </label>
        {prop.kind === "ordnance" && (
          <label className="sf-device-field">
            {t("prep.devices.ordnanceType")}
            <select
              value={prop.ordnanceId ?? ""}
              disabled={readOnly}
              onChange={(event) =>
                onUpdateProp({ ordnanceId: event.target.value })
              }
            >
              <option value="">{t("prep.devices.bindingNone")}</option>
              {[...ordnanceTypes(), ...scenario.ordnanceTypes].map((o) => (
                <option key={o.id} value={o.id}>
                  {o.designation}
                </option>
              ))}
            </select>
          </label>
        )}
        <TextField
          label={t("editor.name")}
          value={prop.name}
          disabled={readOnly}
          onCommit={(value) => onUpdateProp({ name: value })}
        />
        <label className="sf-device-field">
          {t("prep.devices.propStates")}
          <input
            key={prop.states.join(",")}
            defaultValue={prop.states.join(", ")}
            disabled={readOnly}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            onBlur={(event) => {
              const states = event.currentTarget.value
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean)
                .slice(0, 20);
              if (!states.length) return;
              onUpdateProp({
                states,
                initial: states.includes(prop.initial)
                  ? prop.initial
                  : states[0],
              });
            }}
          />
        </label>
        <label className="sf-device-field">
          {t("prep.devices.propInitial")}
          <select
            value={prop.initial}
            disabled={readOnly}
            onChange={(event) => onUpdateProp({ initial: event.target.value })}
          >
            {prop.states.map((state) => (
              <option key={state} value={state}>
                {labelFor("propState", state)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="sf-device-inspector-remove"
          disabled={readOnly}
          onClick={onRemoveProp}
        >
          {t("prep.people.remove")}
        </button>
      </div>
    );
  }

  if (!station)
    return (
      <div className="sf-device-inspector">
        <p className="sf-device-inspector-empty">{t("prep.devices.noSelection")}</p>
      </div>
    );

  const element = anchor.startsWith("presentation.") || anchor === "station.name";
  const config = station.presentation?.config;

  return (
    <div className="sf-device-inspector">
      <header className="sf-device-inspector-head">
        <span className="eyebrow">
          {element ? t("prep.devices.selected") : t("prep.devices.inspector")}
        </span>
        <h3>{assetView(station).name}</h3>
        {element && (
          <button type="button" onClick={onSelectDevice}>
            {t("prep.devices.inspector")}
          </button>
        )}
      </header>

      {anchor === "station.name" && (
        <TextField
          label={t("editor.name")}
          value={station.name}
          disabled={readOnly}
          onCommit={onUpdateName}
        />
      )}
      {anchor === "presentation.title" && (
        <TextField
          label={t("presentation.title")}
          value={config?.title ?? ""}
          disabled={readOnly}
          onCommit={(value) => onPresentation({ config: { title: value } })}
        />
      )}
      {anchor === "presentation.subtitle" && (
        <TextField
          label={t("presentation.subtitle")}
          value={config?.subtitle ?? ""}
          disabled={readOnly}
          onCommit={(value) => onPresentation({ config: { subtitle: value } })}
        />
      )}
      {anchor === "presentation.identifier" && (
        <TextField
          label={t("presentation.identifier")}
          value={config?.identifier ?? ""}
          disabled={readOnly}
          onCommit={(value) =>
            onPresentation({ config: { identifier: value } })
          }
        />
      )}

      {!element && (
        <>
          <TextField
            label={t("editor.name")}
            value={station.name}
            disabled={readOnly}
            onCommit={(value) => onUpdate({ name: value })}
          />
          <label className="sf-device-field">
            {t("prep.devices.preset")}
            <select
              value={station.module}
              disabled={readOnly}
              onChange={(event) =>
                onUpdate({
                  module: event.target.value as TrainingStation["module"],
                })
              }
            >
              {!presets.some((preset) => preset.module === station.module) && (
                <option value={station.module}>
                  {t(presetLabel(station.module))}
                </option>
              )}
              {presets.map((preset) => (
                <option key={preset.id} value={preset.module}>
                  {t(preset.labelKey)}
                </option>
              ))}
            </select>
          </label>
          {hasOwnershipOptions && (
            <label className="sf-device-field">
              {t("prep.devices.owner")}
              <select
                value={ownerOf(station)}
                disabled={readOnly}
                onChange={(event) => onSetOwner(event.target.value)}
              >
                <option value="scenario">
                  {t("prep.devices.ownerScenario")}
                </option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
                {participants
                  .filter((row) => row.team !== "")
                  .map((row) => (
                    <option key={row.id} value={`participant:${row.id}`}>
                      {row.name}
                    </option>
                  ))}
              </select>
            </label>
          )}

          <details className="prepare-advanced">
            <summary>{t("prep.devices.advanced")}</summary>
            <label className="sf-device-field">
              {t("prep.devices.role")}
              <select
                value={station.role}
                disabled={readOnly}
                onChange={(event) => {
                  const role = event.target.value as "hq" | "element";
                  onUpdate({
                    role,
                    module: role === "hq" ? "tracking" : station.module,
                    player: role === "hq" ? false : station.player,
                  });
                }}
              >
                <option value="element">{t("prep.devices.roleField")}</option>
                <option value="hq">{t("prep.devices.roleHq")}</option>
              </select>
            </label>

            <label className="sf-device-field">
              {t("prep.devices.surface")}
              <select
                aria-label={t("prep.devices.surface")}
                value={station.surface ?? ""}
                disabled={readOnly}
                onChange={(event) =>
                  onUpdate({
                    surface: (event.target.value ||
                      undefined) as TrainingStation["surface"],
                  })
                }
              >
                <option value="">{t("prep.devices.surfaceAuto")}</option>
                {deviceSurfaceIds.map((id) => (
                  <option key={id} value={id}>
                    {t(`surface.${id}`)}
                  </option>
                ))}
              </select>
            </label>

            {caps.patients && station.module === "medical" && (
              <label className="sf-device-field">
                {t("cap.patients")}
                <select
                  value={station.bindings.patient}
                  disabled={readOnly}
                  onChange={(event) =>
                    onSetBinding({ patient: event.target.value })
                  }
                >
                  <option value="">{t("prep.devices.bindingNone")}</option>
                  {scenario.patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {caps.props &&
              (station.module === "ordnance" || station.module === "beacon") && (
                <label className="sf-device-field">
                  {t("cap.props")}
                  <select
                    value={station.bindings.prop}
                    disabled={readOnly}
                    onChange={(event) =>
                      onSetBinding({ prop: event.target.value })
                    }
                  >
                    <option value="">{t("prep.devices.bindingNone")}</option>
                    {scenario.props
                      .filter((row) => row.kind === station.module)
                      .map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}

            {CODE_MODULES.includes(station.module) && (
              <>
                <label className="sf-device-field">
                  {t("prep.devices.duration")}
                  <input
                    type="number"
                    value={station.duration}
                    disabled={readOnly}
                    onChange={(event) =>
                      onUpdate({ duration: Number(event.target.value) })
                    }
                  />
                </label>
                <label className="sf-device-field">
                  {t("prep.devices.code")}
                  <input
                    inputMode="numeric"
                    value={station.code}
                    disabled={readOnly}
                    onChange={(event) => {
                      if (/^\d{0,12}$/.test(event.target.value))
                        onUpdate({ code: event.target.value });
                    }}
                  />
                </label>
              </>
            )}

            <h4 className="sf-device-group">{t("presentation.heading")}</h4>
            <TextField
              label={t("presentation.title")}
              value={config?.title ?? ""}
              disabled={readOnly}
              onCommit={(value) => onPresentation({ config: { title: value } })}
            />
            <TextField
              label={t("presentation.subtitle")}
              value={config?.subtitle ?? ""}
              disabled={readOnly}
              onCommit={(value) =>
                onPresentation({ config: { subtitle: value } })
              }
            />
            <TextField
              label={t("presentation.identifier")}
              value={config?.identifier ?? ""}
              disabled={readOnly}
              onCommit={(value) =>
                onPresentation({ config: { identifier: value } })
              }
            />
            <label className="sf-device-field">
              {t("presentation.scene")}
              <select
                aria-label={t("presentation.scene")}
                value={station.presentation?.scene ?? ""}
                disabled={readOnly}
                onChange={(event) =>
                  onPresentation({
                    scene: (event.target.value || null) as SceneId | null,
                  })
                }
              >
                <option value="">{t("presentation.auto")}</option>
                {sceneIds.map((id) => (
                  <option key={id} value={id}>
                    {labelFor("scene", id)}
                  </option>
                ))}
              </select>
            </label>
            {effectiveScene(station) === "countdown" &&
              (() => {
                const countdown = {
                  ...sceneOptionsDefaults().countdown,
                  ...(station.presentation?.config?.sceneOptions?.countdown ??
                    {}),
                };
                const setCountdown = (
                  patch: Partial<typeof countdown>,
                ) =>
                  onPresentation({
                    config: {
                      sceneOptions: {
                        ...(station.presentation?.config?.sceneOptions ?? {}),
                        countdown: { ...countdown, ...patch },
                      },
                    },
                  });
                return (
                  <>
                    <h4 className="sf-device-group">
                      {t("studio.countdown.display")}
                    </h4>
                    <label className="sf-device-field">
                      {t("studio.countdown.display")}
                      <select
                        aria-label={t("studio.countdown.display")}
                        value={countdown.display}
                        disabled={readOnly}
                        onChange={(event) =>
                          setCountdown({
                            display: event.target.value as
                              | "countdown"
                              | "battery",
                          })
                        }
                      >
                        <option value="countdown">
                          {t("studio.countdown.displayCountdown")}
                        </option>
                        <option value="battery">
                          {t("studio.countdown.displayBattery")}
                        </option>
                      </select>
                    </label>
                    {countdown.display === "battery" && (
                      <>
                        <label className="sf-device-field">
                          {t("studio.countdown.unit")}
                          <input
                            value={countdown.unit}
                            maxLength={8}
                            disabled={readOnly}
                            onChange={(event) =>
                              setCountdown({ unit: event.target.value })
                            }
                          />
                        </label>
                        <label className="sf-device-field">
                          {t("studio.countdown.warnAt")}
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={countdown.warnAt}
                            disabled={readOnly}
                            onChange={(event) =>
                              setCountdown({ warnAt: Number(event.target.value) })
                            }
                          />
                        </label>
                        <label className="sf-device-field">
                          {t("studio.countdown.criticalAt")}
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={countdown.criticalAt}
                            disabled={readOnly}
                            onChange={(event) =>
                              setCountdown({
                                criticalAt: Number(event.target.value),
                              })
                            }
                          />
                        </label>
                      </>
                    )}
                  </>
                );
              })()}
            <label className="sf-device-field">
              {t("presentation.accent")}
              <input
                type="color"
                value={config?.accent ?? "#80dce5"}
                disabled={readOnly}
                onChange={(event) =>
                  onPresentation({ config: { accent: event.target.value } })
                }
              />
            </label>
            <label className="sf-device-field">
              {t("studio.mood")}
              <select
                value={config?.mood ?? "clinical"}
                disabled={readOnly}
                onChange={(event) =>
                  onPresentation({
                    config: { mood: event.target.value as (typeof MOODS)[number] },
                  })
                }
              >
                {MOODS.map((mood) => (
                  <option key={mood} value={mood}>
                    {t(`studio.mood.${mood}`)}
                  </option>
                ))}
              </select>
            </label>
          </details>

          <button
            type="button"
            className="sf-device-inspector-remove"
            disabled={readOnly}
            onClick={onRemove}
          >
            {t("prep.devices.remove")}
          </button>
        </>
      )}
    </div>
  );
}
