import { labelFor } from "../../../core/labels";
import { ordnanceTypes } from "../../../core/ordnance";
import { propKinds, type Scenario } from "../../../core/training";
import { t } from "../../../i18n";
import { addProp, removeProp, updateProp } from "./commands";

const PROP_KIND_LABELS: Record<string, string> = {
  ordnance: "prop.kind.ordnance",
  beacon: "prop.kind.beacon",
  payload: "prop.kind.payload",
  keycard: "prop.kind.keycard",
  custom: "prop.kind.custom",
};

// Secondary panel: props (requisites). Kept as a panel, not a page.
export function PropsPanel({
  scenario,
  readOnly,
  onChange,
}: {
  scenario: Scenario;
  readOnly: boolean;
  onChange: (next: Scenario) => void;
}) {
  return (
    <section className="prepare-block device-props">
      <h3>{t("prep.devices.props")}</h3>
      <div className="prepare-list">
        {scenario.props.map((prop) => (
          <div className="prepare-person" key={prop.id}>
            <header>
              <span>{t("prep.devices.props")}</span>
              <button
                disabled={readOnly}
                onClick={() => onChange(removeProp(scenario, prop.id))}
              >
                {t("prep.people.remove")}
              </button>
            </header>
            <div className="prepare-device-grid">
              <label>
                {t("prep.devices.propKind")}
                <select
                  value={prop.kind}
                  disabled={readOnly}
                  onChange={(event) =>
                    onChange(
                      updateProp(scenario, prop.id, {
                        kind: event.target.value as typeof prop.kind,
                      }),
                    )
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
                <label>
                  {t("prep.devices.ordnanceType")}
                  <select
                    value={prop.ordnanceId ?? ""}
                    disabled={readOnly}
                    onChange={(event) =>
                      onChange(
                        updateProp(scenario, prop.id, {
                          ordnanceId: event.target.value,
                        }),
                      )
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
              <label>
                {t("editor.name")}
                <input
                  value={prop.name}
                  disabled={readOnly}
                  onChange={(event) =>
                    onChange(
                      updateProp(scenario, prop.id, { name: event.target.value }),
                    )
                  }
                />
              </label>
              <label>
                {t("prep.devices.propStates")}
                <input
                  value={prop.states.join(", ")}
                  disabled={readOnly}
                  onChange={(event) => {
                    const states = event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean)
                      .slice(0, 20);
                    if (!states.length) return;
                    onChange(
                      updateProp(scenario, prop.id, {
                        states,
                        initial: states.includes(prop.initial)
                          ? prop.initial
                          : states[0],
                      }),
                    );
                  }}
                />
              </label>
              <label>
                {t("prep.devices.propInitial")}
                <select
                  value={prop.initial}
                  disabled={readOnly}
                  onChange={(event) =>
                    onChange(
                      updateProp(scenario, prop.id, {
                        initial: event.target.value,
                      }),
                    )
                  }
                >
                  {prop.states.map((state) => (
                    <option key={state} value={state}>
                      {labelFor("propState", state)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ))}
      </div>
      <button disabled={readOnly} onClick={() => onChange(addProp(scenario))}>
        {t("prep.devices.addProp")}
      </button>
    </section>
  );
}
