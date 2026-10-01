import type { Scenario, TrainingStation } from "../../../core/training";
import type { ScenarioCapabilities } from "../../../core/capabilities";
import { t } from "../../../i18n";
import { PresentationFields } from "../../PresentationFields";
import type { DevicePreset } from "../devicePresets";
import { presetLabel } from "../devicePresets";

const CODE_MODULES = ["countdown", "access", "lock", "terminal"];

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
    <label className="device-field">
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

// Contextual inspector: derives entirely from the selection. It shows the
// selected element's property, or the selected device's properties. It holds no
// state of its own (docs/architecture/editor-state.md).
export function DeviceInspector({
  station,
  anchor,
  scenario,
  caps,
  readOnly,
  presets,
  onUpdate,
  onSetBinding,
  onRemove,
  onSelectDevice,
  onUpdateName,
  onUpdatePresentation,
}: {
  station: TrainingStation | undefined;
  anchor: string;
  scenario: Scenario;
  caps: ScenarioCapabilities;
  readOnly: boolean;
  presets: DevicePreset[];
  onUpdate: (patch: Partial<TrainingStation>) => void;
  onSetBinding: (binding: Partial<TrainingStation["bindings"]>) => void;
  onRemove: () => void;
  onSelectDevice: () => void;
  onUpdateName: (name: string) => void;
  onUpdatePresentation: (patch: {
    title?: string;
    subtitle?: string;
    identifier?: string;
  }) => void;
}) {
  if (!station)
    return (
      <div className="device-inspector">
        <p className="device-inspector-empty">{t("prep.devices.noSelection")}</p>
      </div>
    );

  const element = anchor.startsWith("presentation.") || anchor === "station.name";
  return (
    <div className="device-inspector">
      <header className="device-inspector-head">
        <span className="eyebrow">
          {element ? t("prep.devices.selected") : t("prep.devices.inspector")}
        </span>
        <h3>{station.name}</h3>
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
          value={station.presentation?.config?.title ?? ""}
          disabled={readOnly}
          onCommit={(value) => onUpdatePresentation({ title: value })}
        />
      )}
      {anchor === "presentation.subtitle" && (
        <TextField
          label={t("presentation.subtitle")}
          value={station.presentation?.config?.subtitle ?? ""}
          disabled={readOnly}
          onCommit={(value) => onUpdatePresentation({ subtitle: value })}
        />
      )}
      {anchor === "presentation.identifier" && (
        <TextField
          label={t("presentation.identifier")}
          value={station.presentation?.config?.identifier ?? ""}
          disabled={readOnly}
          onCommit={(value) => onUpdatePresentation({ identifier: value })}
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
          <label className="device-field">
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
          <label className="device-field">
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

          {caps.patients && station.module === "medical" && (
            <label className="device-field">
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

          {caps.props && station.module === "ordnance" && (
            <label className="device-field">
              {t("cap.props")}
              <select
                value={station.bindings.prop}
                disabled={readOnly}
                onChange={(event) => onSetBinding({ prop: event.target.value })}
              >
                <option value="">{t("prep.devices.bindingNone")}</option>
                {scenario.props
                  .filter((prop) => prop.kind === "ordnance")
                  .map((prop) => (
                    <option key={prop.id} value={prop.id}>
                      {prop.name}
                    </option>
                  ))}
              </select>
            </label>
          )}

          {caps.props && station.module === "beacon" && (
            <label className="device-field">
              {t("cap.props")}
              <select
                value={station.bindings.prop}
                disabled={readOnly}
                onChange={(event) => onSetBinding({ prop: event.target.value })}
              >
                <option value="">{t("prep.devices.bindingNone")}</option>
                {scenario.props
                  .filter((prop) => prop.kind === "beacon")
                  .map((prop) => (
                    <option key={prop.id} value={prop.id}>
                      {prop.name}
                    </option>
                  ))}
              </select>
            </label>
          )}

          {CODE_MODULES.includes(station.module) && (
            <>
              <label className="device-field">
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
              <label className="device-field">
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

          <details className="prepare-advanced">
            <summary>{t("presentation.heading")}</summary>
            <PresentationFields
              station={station}
              readOnly={readOnly}
              hideLegend
              onChange={(presentation) => onUpdate({ presentation })}
            />
          </details>

          <button
            type="button"
            className="device-inspector-remove"
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
