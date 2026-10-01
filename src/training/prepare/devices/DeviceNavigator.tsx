import type { Scenario, TrainingStation } from "../../../core/training";
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

// The device identity is the asset, not the person. A player station is a GPS
// unit assigned to a participant, so the participant identity is never shown as
// the device name.
function assetLabel(station: TrainingStation): string {
  return station.player ? t(presetLabel(station.module)) : station.name;
}

function assetDetail(station: TrainingStation): string {
  return station.player
    ? t("prep.devices.assignedTo", { name: station.name })
    : t(presetLabel(station.module));
}

// Navigator pane: structure and selection only. A prop and its bound interface
// are grouped as one logical thing; the prop's own facet and its console are
// children, not two unrelated siblings.
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
  const propIds = new Set(props.map((prop) => prop.id));
  const boundToProp = (station: TrainingStation) =>
    !!station.bindings.prop && propIds.has(station.bindings.prop);
  const ungrouped = devices.filter((station) => !boundToProp(station));

  const deviceRow = (station: TrainingStation, child: boolean) => (
    <button
      key={station.id}
      type="button"
      className={`sf-device-nav-item prepare-device ${
        child ? "sf-device-nav-child" : ""
      } ${selection?.kind === "device" && selection.id === station.id ? "is-selected" : ""}`}
      onClick={() => onSelectDevice(station.id)}
    >
      <strong>{assetLabel(station)}</strong>
      <span className="eyebrow">{assetDetail(station)}</span>
    </button>
  );

  return (
    <div className="sf-device-nav">
      <section className="sf-device-nav-block">
        <h3>{t("prep.devices.deviceList")}</h3>
        <div className="prepare-list">
          {ungrouped.map((station) => deviceRow(station, false))}
          {!ungrouped.length && (
            <p className="sf-device-nav-empty">{t("prep.devices.noSelection")}</p>
          )}
        </div>
      </section>

      {showProps && (
        <section className="sf-device-nav-block">
          <h3>{t("prep.devices.props")}</h3>
          <div className="prepare-list">
            {props.map((prop) => {
              const bound = devices.find(
                (station) => station.bindings.prop === prop.id,
              );
              return (
                <div key={prop.id} className="sf-device-nav-group">
                  <button
                    type="button"
                    className={`sf-device-nav-item ${
                      selection?.kind === "prop" && selection.id === prop.id
                        ? "is-selected"
                        : ""
                    }`}
                    onClick={() => onSelectProp(prop.id)}
                  >
                    <strong>{prop.name}</strong>
                    <span className="eyebrow">
                      {t("prep.devices.physicalProp")} ·{" "}
                      {t(PROP_KIND_LABELS[prop.kind] ?? prop.kind)}
                    </span>
                  </button>
                  <div className="sf-device-nav-children">
                    {bound ? (
                      deviceRow(bound, true)
                    ) : (
                      <span className="sf-device-nav-child is-empty">
                        {t("prep.devices.unboundTitle")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <button disabled={readOnly} onClick={onAddProp}>
            {t("prep.devices.addProp")}
          </button>
        </section>
      )}
    </div>
  );
}
