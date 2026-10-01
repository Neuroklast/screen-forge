import { capabilityKeys, withCapability } from "../../core/capabilities";
import { labelFor } from "../../core/labels";
import { scenarioTypes } from "../../core/capabilities";
import type { Scenario } from "../../core/training";
import { MissionBuilder } from "../../builder/MissionBuilder";
import { t } from "../../i18n";
import { uid, type PrepareSectionProps } from "./shared";

// Scenario: identity, type, capability switches, terrain, zones and objectives.
// The raw canvas lives behind the collapsed expert mode.
export function ScenarioSection({
  draft,
  change,
  readOnly,
  caps,
}: PrepareSectionProps) {
  const patch = (s: Partial<Scenario>) => change({ ...draft, ...s });
  return (
    <section className="panel prepare">
      <h2>{t("prep.tab.scenario")}</h2>
      <div className="form-grid">
        <label>
          {t("trainer.scenarioName")}
          <input
            value={draft.name}
            disabled={readOnly}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </label>
        <label>
          {t("trainer.dataSourceLabel")}
          <select
            value={draft.mode}
            disabled={readOnly}
            onChange={(e) =>
              patch({ mode: e.target.value as Scenario["mode"] })
            }
          >
            <option value="LIVE">{labelFor("mode", "LIVE")}</option>
            <option value="PLAYBACK">{labelFor("mode", "PLAYBACK")}</option>
          </select>
        </label>
        <label>
          {t("prep.scenario.type")}
          <select
            value={draft.type}
            disabled={readOnly}
            onChange={(e) =>
              patch({
                type: e.target.value as Scenario["type"],
                capabilities: {},
              })
            }
          >
            {scenarioTypes.map((type) => (
              <option key={type} value={type}>
                {t(`prep.scenario.type.${type}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

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
                onChange={(e) =>
                  patch({
                    capabilities: withCapability(
                      draft.type,
                      draft.capabilities,
                      key,
                      e.target.checked,
                    ),
                  })
                }
              />
              {t(`cap.${key}`)}
            </label>
          ))}
        </div>
      </details>

      <details className="prepare-advanced" open>
        <summary>{t("prep.scenario.map")}</summary>
        <div className="form-grid">
          {(["lat", "lng", "zoom"] as const).map((k) => (
            <label key={k}>
              {t(`wizard.${k}`)}
              <input
                type="number"
                step="any"
                value={draft.map[k]}
                disabled={readOnly}
                onChange={(e) =>
                  patch({ map: { ...draft.map, [k]: Number(e.target.value) } })
                }
              />
            </label>
          ))}
          <label>
            {t("prep.scenario.tiles")}
            <input
              value={draft.map.tiles}
              disabled={readOnly}
              onChange={(e) =>
                patch({ map: { ...draft.map, tiles: e.target.value } })
              }
            />
          </label>
          <label>
            {t("prep.scenario.attribution")}
            <input
              value={draft.map.attribution}
              disabled={readOnly}
              onChange={(e) =>
                patch({ map: { ...draft.map, attribution: e.target.value } })
              }
            />
          </label>
        </div>
      </details>

      {caps.zones && (
        <section className="prepare-block">
          <h3>{t("prep.scenario.zones")}</h3>
          <div className="prepare-list">
            {draft.zones.map((z) => (
              <div className="prepare-row" key={z.id}>
                <label>
                  {t("editor.zoneName")}
                  <input
                    value={z.name}
                    disabled={readOnly}
                    onChange={(e) =>
                      patch({
                        zones: draft.zones.map((v) =>
                          v.id === z.id ? { ...v, name: e.target.value } : v,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  Radius (m)
                  <input
                    type="number"
                    step="any"
                    value={z.radius}
                    disabled={readOnly}
                    onChange={(e) =>
                      patch({
                        zones: draft.zones.map((v) =>
                          v.id === z.id
                            ? { ...v, radius: Number(e.target.value) }
                            : v,
                        ),
                      })
                    }
                  />
                </label>
                <button
                  disabled={readOnly}
                  onClick={() =>
                    patch({ zones: draft.zones.filter((v) => v.id !== z.id) })
                  }
                >
                  {t("prep.scenario.remove")}
                </button>
              </div>
            ))}
          </div>
          <button
            disabled={readOnly}
            onClick={() =>
              patch({
                zones: [
                  ...draft.zones,
                  {
                    id: uid("zone"),
                    name: t("editor.newZone"),
                    lat: draft.map.lat,
                    lng: draft.map.lng,
                    radius: 100,
                  },
                ],
              })
            }
          >
            {t("prep.scenario.addZone")}
          </button>
        </section>
      )}

      {caps.objectives && (
        <section className="prepare-block">
          <h3>{t("prep.scenario.objectives")}</h3>
          <div className="prepare-list">
            {draft.objectives.map((o) => (
              <div className="prepare-row is-compact" key={o.id}>
                <label>
                  {t("editor.objective")}
                  <input
                    value={o.name}
                    disabled={readOnly}
                    onChange={(e) =>
                      patch({
                        objectives: draft.objectives.map((v) =>
                          v.id === o.id ? { ...v, name: e.target.value } : v,
                        ),
                      })
                    }
                  />
                </label>
                <button
                  disabled={readOnly}
                  onClick={() =>
                    patch({
                      objectives: draft.objectives.filter(
                        (v) => v.id !== o.id,
                      ),
                    })
                  }
                >
                  {t("prep.scenario.remove")}
                </button>
              </div>
            ))}
          </div>
          <button
            disabled={readOnly}
            onClick={() =>
              patch({
                objectives: [
                  ...draft.objectives,
                  { id: uid("objective"), name: t("editor.newObjective") },
                ],
              })
            }
          >
            {t("prep.scenario.addObjective")}
          </button>
        </section>
      )}

      <details className="prepare-advanced">
        <summary>{t("prep.scenario.advanced")}</summary>
        <p className="prepare-hint">{t("prep.scenario.advancedHint")}</p>
        <MissionBuilder draft={draft} change={change} readOnly={readOnly} showFlow={false} />
      </details>
    </section>
  );
}
