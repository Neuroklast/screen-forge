import {
  moduleEvents,
  type Action,
  type Inject,
  type Scenario,
} from "../../../core/training";
import type { ScenarioCapabilities } from "../../../core/capabilities";
import { t } from "../../../i18n";

export const EVENT_TRIGGERS = [
  "timer",
  "zone",
  "manual",
  "prop",
  "signal",
  "intervention",
] as const;

export function triggerLabel(trigger: Inject["trigger"]): string {
  return t(`flow.event.${trigger === "timer" ? "time" : trigger}`);
}

// Humanized event editor. It never exposes the internal inject naming; the raw
// list stays in the "Rohdaten" section of the inspector.
export function EventInspector({
  event,
  draft,
  caps,
  readOnly,
  onChange,
  onRemove,
}: {
  event: Inject;
  draft: Scenario;
  caps: ScenarioCapabilities;
  readOnly: boolean;
  onChange: (next: Partial<Inject>) => void;
  onRemove: () => void;
}) {
  const station = draft.stations.find((row) => row.id === event.station);
  const setAction = (index: number, action: Action) =>
    onChange({
      actions: event.actions.map((row, i) => (i === index ? action : row)),
    });
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
      <label>
        {t("flow.eventName")}
        <input
          value={event.name}
          disabled={readOnly}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </label>
      <label>
        {t("flow.eventTrigger")}
        <select
          value={event.trigger}
          disabled={readOnly}
          onChange={(e) =>
            onChange({
              trigger: e.target.value as Inject["trigger"],
              station:
                draft.stations.find((st) => st.role === "element")?.id ?? "",
              zone: draft.zones[0]?.id ?? "",
            })
          }
        >
          {EVENT_TRIGGERS.map((trigger) => (
            <option key={trigger} value={trigger}>
              {triggerLabel(trigger)}
            </option>
          ))}
        </select>
      </label>
      {event.trigger === "timer" && (
        <>
          <label>
            {t("flow.eventAt")}
            <input
              type="number"
              min={0}
              max={86400}
              value={event.at}
              disabled={readOnly}
              onChange={(e) => onChange({ at: Number(e.target.value) })}
            />
          </label>
          <label>
            {t("flow.eventJitter")}
            <input
              type="number"
              min={0}
              max={3600}
              value={event.jitter}
              disabled={readOnly}
              onChange={(e) => onChange({ jitter: Number(e.target.value) })}
            />
          </label>
        </>
      )}
      {event.trigger !== "timer" && event.trigger !== "manual" && (
        <label>
          {t("flow.eventStation")}
          <select
            value={event.station}
            disabled={readOnly}
            onChange={(e) => onChange({ station: e.target.value })}
          >
            <option value="">{t("builder.noneOption")}</option>
            {draft.stations
              .filter((st) => st.role === "element")
              .map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
          </select>
        </label>
      )}
      {event.trigger === "zone" && (
        <label>
          {t("flow.eventZone")}
          <select
            value={event.zone}
            disabled={readOnly}
            onChange={(e) => onChange({ zone: e.target.value })}
          >
            {draft.zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {event.trigger === "signal" && (
        <label>
          {t("flow.eventIntervention")}
          <select
            value={event.intervention}
            disabled={readOnly}
            onChange={(e) => onChange({ intervention: e.target.value })}
          >
            <option value="">{t("editor.chooseAction")}</option>
            {(moduleEvents[station?.module || ""] || []).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      )}
      {event.trigger === "intervention" && (
        <label>
          {t("flow.eventIntervention")}
          <select
            value={event.intervention}
            disabled={readOnly}
            onChange={(e) => onChange({ intervention: e.target.value })}
          >
            {["treated", "tourniquet", "oxygen", "evacuated"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      )}
      <label className="check">
        <input
          type="checkbox"
          checked={event.enabled}
          disabled={readOnly}
          onChange={(e) => onChange({ enabled: e.target.checked })}
        />
        {t("flow.eventActive")}
      </label>
      <label>
        {t("flow.eventUnless")}
        <select
          value={event.unless}
          disabled={readOnly}
          onChange={(e) => onChange({ unless: e.target.value })}
        >
          <option value="">{t("editor.always")}</option>
          {["treated", "tourniquet", "oxygen", "evacuated"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>

      <span className="palette-group-title">{t("flow.eventActions")}</span>
      {event.actions.map((action, index) => (
        <div key={index} className="wf-variable">
          <label>
            {t("flow.action")}
            <select
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
            disabled={readOnly || event.actions.length <= 1}
            onClick={() =>
              onChange({
                actions: event.actions.filter((_, i) => i !== index),
              })
            }
          >
            {t("flow.removeAction")}
          </button>
        </div>
      ))}
      <button
        disabled={readOnly}
        onClick={() =>
          onChange({
            actions: [
              ...event.actions,
              { type: "message", text: t("editor.newMessage") },
            ],
          })
        }
      >
        {t("flow.addAction")}
      </button>

      <button className="danger" disabled={readOnly} onClick={onRemove}>
        {t("flow.remove")}
      </button>
    </>
  );
}
