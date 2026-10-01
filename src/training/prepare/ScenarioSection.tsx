import { capabilityKeys, scenarioTypes } from "../../core/capabilities";
import { labelFor } from "../../core/labels";
import { t } from "../../i18n";
import { Term } from "../../ui/terminology/Term";
import { MissionMap } from "./MissionMap";
import type { PrepareSectionProps } from "./shared";
import { Panel } from "../../ui/primitives";
import {
  addObjective,
  addZone,
  removeObjective,
  removeZone,
  setCapability,
  setMap,
  setMissionName,
  setMode,
  setScenarioType,
  updateObjective,
  updateZone,
} from "./scenarioCommands";

// Mission: what we are doing, where, and with which objectives. The raw map
// fields and the capability matrix are expert detail behind Advanced; the
// normal surface stays at mission name / profile / location / objectives.
export function ScenarioSection({
  draft,
  change,
  readOnly,
  caps,
}: PrepareSectionProps) {
  return (
    <Panel className="prepare">
      <h2>
        <Term id="nav.mission" />
      </h2>

      <div className="form-grid">
        <label>
          {t("trainer.scenarioName")}
          <input
            value={draft.name}
            disabled={readOnly}
            onChange={(event) => change(setMissionName(draft, event.target.value))}
          />
        </label>
        <label>
          {t("prep.scenario.type")}
          <select
            value={draft.type}
            disabled={readOnly}
            onChange={(event) =>
              change(
                setScenarioType(
                  draft,
                  event.target.value as typeof draft.type,
                ),
              )
            }
          >
            {scenarioTypes.map((type) => (
              <option key={type} value={type}>
                {t(`prep.scenario.type.${type}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("trainer.dataSourceLabel")}
          <select
            value={draft.mode}
            disabled={readOnly}
            onChange={(event) =>
              change(setMode(draft, event.target.value as typeof draft.mode))
            }
          >
            <option value="LIVE">{labelFor("mode", "LIVE")}</option>
            <option value="PLAYBACK">{labelFor("mode", "PLAYBACK")}</option>
          </select>
        </label>
      </div>

      <section className="prepare-block">
        <h3>{t("prep.scenario.location")}</h3>
        <MissionMap
          lat={draft.map.lat}
          lng={draft.map.lng}
          zoom={draft.map.zoom}
          tiles={draft.map.tiles}
          attribution={draft.map.attribution}
          zones={draft.zones}
          readOnly={readOnly}
          onPick={(lat, lng) => change(setMap(draft, { lat, lng }))}
        />
        <div className="location-readout">
          <span>
            {draft.map.lat.toFixed(3)}, {draft.map.lng.toFixed(3)}
          </span>
          <span>Zoom {draft.map.zoom}</span>
        </div>
        <details className="prepare-advanced">
          <summary>{t("prep.scenario.mapAdvanced")}</summary>
          <div className="form-grid">
            {(["lat", "lng", "zoom"] as const).map((key) => (
              <label key={key}>
                {t(`wizard.${key}`)}
                <input
                  type="number"
                  step="any"
                  value={draft.map[key]}
                  disabled={readOnly}
                  onChange={(event) =>
                    change(setMap(draft, { [key]: Number(event.target.value) }))
                  }
                />
              </label>
            ))}
            <label>
              {t("prep.scenario.tiles")}
              <input
                value={draft.map.tiles}
                disabled={readOnly}
                onChange={(event) =>
                  change(setMap(draft, { tiles: event.target.value }))
                }
              />
            </label>
            <label>
              {t("prep.scenario.attribution")}
              <input
                value={draft.map.attribution}
                disabled={readOnly}
                onChange={(event) =>
                  change(setMap(draft, { attribution: event.target.value }))
                }
              />
            </label>
          </div>
        </details>
      </section>

      {caps.zones && (
        <section className="prepare-block">
          <h3>{t("prep.scenario.zones")}</h3>
          <div className="prepare-list">
            {draft.zones.map((zone) => (
              <div className="prepare-row" key={zone.id}>
                <label>
                  {t("editor.zoneName")}
                  <input
                    value={zone.name}
                    disabled={readOnly}
                    onChange={(event) =>
                      change(updateZone(draft, zone.id, { name: event.target.value }))
                    }
                  />
                </label>
                <label>
                  {t("prep.scenario.radius")}
                  <input
                    type="number"
                    step="any"
                    value={zone.radius}
                    disabled={readOnly}
                    onChange={(event) =>
                      change(
                        updateZone(draft, zone.id, {
                          radius: Number(event.target.value),
                        }),
                      )
                    }
                  />
                </label>
                <button
                  disabled={readOnly}
                  onClick={() => change(removeZone(draft, zone.id))}
                >
                  {t("prep.scenario.remove")}
                </button>
              </div>
            ))}
          </div>
          <button disabled={readOnly} onClick={() => change(addZone(draft))}>
            {t("prep.scenario.addZone")}
          </button>
        </section>
      )}

      {caps.objectives && (
        <section className="prepare-block">
          <h3>{t("prep.scenario.objectives")}</h3>
          <div className="prepare-list">
            {draft.objectives.map((objective) => (
              <div className="prepare-row is-compact" key={objective.id}>
                <label>
                  {t("editor.objective")}
                  <input
                    value={objective.name}
                    disabled={readOnly}
                    onChange={(event) =>
                      change(
                        updateObjective(draft, objective.id, {
                          name: event.target.value,
                        }),
                      )
                    }
                  />
                </label>
                <button
                  disabled={readOnly}
                  onClick={() => change(removeObjective(draft, objective.id))}
                >
                  {t("prep.scenario.remove")}
                </button>
              </div>
            ))}
          </div>
          <button disabled={readOnly} onClick={() => change(addObjective(draft))}>
            {t("prep.scenario.addObjective")}
          </button>
        </section>
      )}

      <details className="prepare-advanced">
        <summary>{t("prep.scenario.capabilities")}</summary>
        <p className="prepare-hint">{t("prep.scenario.capabilitiesHint")}</p>
        <div className="cap-grid">
          {capabilityKeys.map((key) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={caps[key]}
                disabled={readOnly}
                onChange={(event) =>
                  change(setCapability(draft, key, event.target.checked))
                }
              />
              {t(`cap.${key}`)}
            </label>
          ))}
        </div>
      </details>
    </Panel>
  );
}
