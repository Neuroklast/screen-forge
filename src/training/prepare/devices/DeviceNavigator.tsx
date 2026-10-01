import type { Scenario, TrainingStation } from "../../../core/training";
import { t } from "../../../i18n";
import type { DevicePreset } from "../devicePresets";
import { presetLabel } from "../devicePresets";

// Navigator pane: one-click presets and the device list. Ownership stays a
// compact inline control because it is an assignment, not a deep property.
export function DeviceNavigator({
  presets,
  devices,
  teams,
  participants,
  hasOwnershipOptions,
  owner,
  onOwnerChange,
  onAdd,
  selectedId,
  onSelect,
  ownerOf,
  onAssignOwner,
  readOnly,
}: {
  presets: DevicePreset[];
  devices: Scenario["stations"];
  teams: Scenario["teams"];
  participants: Scenario["stations"];
  hasOwnershipOptions: boolean;
  owner: string;
  onOwnerChange: (value: string) => void;
  onAdd: (preset: DevicePreset) => void;
  selectedId: string;
  onSelect: (id: string) => void;
  ownerOf: (station: TrainingStation) => string;
  onAssignOwner: (station: TrainingStation, value: string) => void;
  readOnly: boolean;
}) {
  const ownerOptions = (
    <>
      <option value="scenario">{t("prep.devices.ownerScenario")}</option>
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
    </>
  );
  return (
    <div className="device-nav">
      <section className="device-nav-block">
        <h3>{t("prep.devices.presets")}</h3>
        <div className="device-presets">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="device-preset"
              disabled={readOnly}
              onClick={() => onAdd(preset)}
            >
              {t(preset.labelKey)}
            </button>
          ))}
        </div>
        {hasOwnershipOptions && (
          <label className="device-nav-owner">
            {t("prep.devices.owner")}
            <select
              value={owner}
              disabled={readOnly}
              aria-label={t("prep.devices.owner")}
              onChange={(event) => onOwnerChange(event.target.value)}
            >
              {ownerOptions}
            </select>
          </label>
        )}
      </section>
      <section className="device-nav-block">
        <h3>{t("prep.devices.deviceList")}</h3>
        <div className="prepare-list">
          {devices.map((station) => (
            <article
              key={station.id}
              className={`prepare-device ${
                selectedId === station.id ? "is-selected" : ""
              }`}
              onClick={() => onSelect(station.id)}
            >
              <header>
                <strong>{station.name}</strong>
                <span className="eyebrow">
                  {t(presetLabel(station.module))}
                  {station.player ? ` · ${t("prep.people.participants")}` : ""}
                </span>
              </header>
              {station.role === "element" &&
                !station.player &&
                hasOwnershipOptions && (
                  <label
                    className="device-nav-owner"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {t("prep.devices.owner")}
                    <select
                      value={ownerOf(station)}
                      disabled={readOnly}
                      aria-label={t("prep.devices.owner")}
                      onChange={(event) =>
                        onAssignOwner(station, event.target.value)
                      }
                    >
                      {ownerOptions}
                    </select>
                  </label>
                )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
