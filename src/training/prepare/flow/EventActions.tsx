import type { Action, Scenario } from "../../../core/training";
import type { ScenarioCapabilities } from "../../../core/capabilities";
import { t } from "../../../i18n";

// Action list of an event. The action editor lives next to it because it is
// only used here; trigger configuration stays in the EventInspector.
export function EventActions({
  actions,
  draft,
  caps,
  readOnly,
  onChange,
}: {
  actions: Action[];
  draft: Scenario;
  caps: ScenarioCapabilities;
  readOnly: boolean;
  onChange: (actions: Action[]) => void;
}) {
  const setAction = (index: number, action: Action) =>
    onChange(actions.map((row, i) => (i === index ? action : row)));
  const actionTargets = (action: Action) => {
    if (action.type === "patient") return draft.patients;
    if (action.type === "release") return draft.dossiers;
    if (action.type === "objective") return draft.objectives;
    if (action.type === "camera")
      return draft.stations.filter((st) => st.module === "camera");
    if (action.type === "prop") return draft.props;
    return [];
  };
  return (
    <>
      <span className="palette-group-title">{t("flow.eventActions")}</span>
      {actions.map((action, index) => (
        <div key={index} className="wf-variable">
          <label>
            {t("flow.action")}
            <select
              aria-label={t("flow.action")}
              value={action.type}
              disabled={readOnly}
              onChange={(e) => {
                const type = e.target.value;
                setAction(
                  index,
                  type === "patient"
                    ? {
                        type,
                        target: draft.patients[0]?.id || "",
                        kind: "desat",
                      }
                    : type === "release"
                      ? { type, target: draft.dossiers[0]?.id || "" }
                      : type === "objective"
                        ? { type, target: draft.objectives[0]?.id || "" }
                        : type === "camera"
                          ? {
                              type,
                              target:
                                draft.stations.find(
                                  (st) => st.module === "camera",
                                )?.id || "",
                              offline: true,
                            }
                          : type === "prop"
                            ? {
                                type,
                                target: draft.props[0]?.id || "",
                                state: draft.props[0]?.states[0] || "",
                              }
                            : {
                                type: "message",
                                text: t("editor.newMessage"),
                              },
                );
              }}
            >
              <option value="message">{t("flow.actionMessage")}</option>
              {caps.patients && (
                <option value="patient">{t("flow.actionPatient")}</option>
              )}
              {caps.dossiers && (
                <option value="release">{t("flow.actionRelease")}</option>
              )}
              {caps.objectives && (
                <option value="objective">{t("flow.actionObjective")}</option>
              )}
              <option value="camera">{t("flow.actionCamera")}</option>
              {caps.props && <option value="prop">{t("flow.actionProp")}</option>}
            </select>
          </label>
          {action.type === "message" ? (
            <label>
              {t("flow.actionMessage")}
              <input
                value={action.text}
                disabled={readOnly}
                onChange={(e) =>
                  setAction(index, { ...action, text: e.target.value })
                }
              />
            </label>
          ) : (
            <label>
              {t("flow.actionTarget")}
              <select
                aria-label={t("flow.actionTarget")}
                value={action.target}
                disabled={readOnly}
                onChange={(e) =>
                  setAction(index, { ...action, target: e.target.value })
                }
              >
                {actionTargets(action).map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {action.type === "patient" && (
            <label>
              {t("prep.people.patientState")}
              <select
                value={action.kind}
                disabled={readOnly}
                onChange={(e) =>
                  setAction(index, {
                    ...action,
                    kind: e.target.value as typeof action.kind,
                  })
                }
              >
                {[
                  "stable",
                  "tachy",
                  "brady",
                  "desat",
                  "trauma",
                  "arrest",
                  "recovered",
                ].map((kind) => (
                  <option key={kind}>{kind}</option>
                ))}
              </select>
            </label>
          )}
          {action.type === "prop" && (
            <label>
              {t("flow.propState")}
              <select
                aria-label={t("flow.propState")}
                value={action.state}
                disabled={readOnly}
                onChange={(e) =>
                  setAction(index, { ...action, state: e.target.value })
                }
              >
                {(draft.props.find((row) => row.id === action.target)?.states ??
                  []).map((state) => (
                  <option key={state}>{state}</option>
                ))}
              </select>
            </label>
          )}
          {action.type === "camera" && (
            <label className="check">
              <input
                type="checkbox"
                checked={action.offline}
                disabled={readOnly}
                onChange={(e) =>
                  setAction(index, { ...action, offline: e.target.checked })
                }
              />
              {t("editor.signalLost")}
            </label>
          )}
          <button
            disabled={readOnly || actions.length <= 1}
            onClick={() =>
              onChange(actions.filter((_, i) => i !== index))
            }
          >
            {t("flow.removeAction")}
          </button>
        </div>
      ))}
      <button
        disabled={readOnly}
        onClick={() =>
          onChange([
            ...actions,
            { type: "message", text: t("editor.newMessage") },
          ])
        }
      >
        {t("flow.addAction")}
      </button>
    </>
  );
}
