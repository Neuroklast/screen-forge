import type { Scenario } from "../../../core/training";
import { t } from "../../../i18n";
import { presetLabel } from "../devicePresets";
import type { DeviceSelection } from "./selection";

const PROP_KIND_LABELS: Record<string, string> = {
  ordnance: "prop.kind.ordnance",
  beacon: "prop.kind.beacon",
  payload: "prop.kind.payload",
  keycard: "prop.kind.keycard",
  custom: "prop.kind.custom",
};

// Navigator pane: structure and selection only. Ownership and configuration live
// in the inspector; the navigator never repeats per-item property controls.
export function DeviceNavigator({
  devices,
  props,
  showProps,
  selection,
  onSelectDevice,
  onSelectProp,
  onAddProp,
  readOnly,
}: {
  devices: Scenario["stations"];
  props: Scenario["props"];
  showProps: boolean;
  selection: DeviceSelection;
  onSelectDevice: (id: string) => void;
  onSelectProp: (id: string) => void;
  onAddProp: () => void;
  readOnly: boolean;
}) {
  return (
    <div className="device-nav">
      <section className="device-nav-block">
        <h3>{t("prep.devices.deviceList")}</h3>
        <div className="prepare-list">
          {devices.map((station) => (
            <button
              key={station.id}
              type="button"
              className={`device-nav-item prepare-device ${
                selection?.kind === "device" && selection.id === station.id
                  ? "is-selected"
                  : ""
              }`}
              onClick={() => onSelectDevice(station.id)}
            >
              <strong>{station.name}</strong>
              <span className="eyebrow">{t(presetLabel(station.module))}</span>
            </button>
          ))}
          {!devices.length && (
            <p className="device-nav-empty">{t("prep.devices.noSelection")}</p>
          )}
        </div>
      </section>

      {showProps && (
        <section className="device-nav-block">
          <h3>{t("prep.devices.props")}</h3>
          <div className="prepare-list">
            {props.map((prop) => (
              <button
                key={prop.id}
                type="button"
                className={`device-nav-item prepare-prop ${
                  selection?.kind === "prop" && selection.id === prop.id
                    ? "is-selected"
                    : ""
                }`}
                onClick={() => onSelectProp(prop.id)}
              >
                <strong>{prop.name}</strong>
                <span className="eyebrow">
                  {t(PROP_KIND_LABELS[prop.kind] ?? prop.kind)}
                </span>
              </button>
            ))}
          </div>
          <button disabled={readOnly} onClick={onAddProp}>
            {t("prep.devices.addProp")}
          </button>
        </section>
      )}
    </div>
  );
}
