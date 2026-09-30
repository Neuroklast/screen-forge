import { moduleEvents, type Inject, type Scenario } from "../../../core/training";
import type { ScenarioCapabilities } from "../../../core/capabilities";
import type { Workflow } from "../../../core/workflow";
import { t } from "../../../i18n";
import { EVENT_TRIGGERS, triggerLabel } from "./triggers";
import { eventSummary } from "./eventSummary";
import { EventActions } from "./EventActions";

// Humanized event editor: a sentence summary on top, then the trigger
// configuration; the action list lives in EventActions.
export function EventInspector({
  event,
  draft,
  caps,
  readOnly,
  linkedWorkflow,
  onChange,
  onRemove,
}: {
  event: Inject;
  draft: Scenario;
  caps: ScenarioCapabilities;
  readOnly: boolean;
  linkedWorkflow?: Workflow;
  onChange: (next: Partial<Inject>) => void;
  onRemove: () => void;
}) {
  const station = draft.stations.find((row) => row.id === event.station);
  return (
    <>
      <p className="flow-summary">{eventSummary(event, draft, linkedWorkflow)}</p>
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

      <EventActions
        actions={event.actions}
        draft={draft}
        caps={caps}
        readOnly={readOnly}
        onChange={(actions) => onChange({ actions })}
      />

      <button className="danger" disabled={readOnly} onClick={onRemove}>
        {t("flow.remove")}
      </button>
    </>
  );
}
