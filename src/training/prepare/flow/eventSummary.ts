import type { Action, Inject, Scenario } from "../../../core/training";
import type { Workflow } from "../../../core/workflow";
import { t } from "../../../i18n";
import { formatClock } from "./format";

function actionSummary(action: Action, draft: Scenario): string {
  switch (action.type) {
    case "message":
      return t("flow.summary.actionMessage", { text: action.text });
    case "patient": {
      const patient = draft.patients.find((row) => row.id === action.target);
      return t("flow.summary.actionPatient", {
        name: patient?.name ?? action.target,
        kind: action.kind,
      });
    }
    case "release": {
      const dossier = draft.dossiers.find((row) => row.id === action.target);
      return t("flow.summary.actionRelease", {
        name: dossier?.name ?? action.target,
      });
    }
    case "objective": {
      const objective = draft.objectives.find((row) => row.id === action.target);
      return t("flow.summary.actionObjective", {
        name: objective?.name ?? action.target,
      });
    }
    case "camera": {
      const station = draft.stations.find((row) => row.id === action.target);
      return action.offline
        ? t("flow.summary.actionCameraOff", {
            name: station?.name ?? action.target,
          })
        : t("flow.summary.actionCameraOn", {
            name: station?.name ?? action.target,
          });
    }
    case "prop": {
      const prop = draft.props.find((row) => row.id === action.target);
      return t("flow.summary.actionProp", {
        name: prop?.name ?? action.target,
        state: action.state,
      });
    }
  }
}

// One human sentence per event: "Wenn … → sende … → startet …". It mirrors the
// schema but is readable without knowing triggers, actions or workflow links.
export function eventSummary(
  event: Inject,
  draft: Scenario,
  linkedWorkflow?: Workflow,
): string {
  const station = draft.stations.find((row) => row.id === event.station);
  const zone = draft.zones.find((row) => row.id === event.zone);
  let when: string;
  switch (event.trigger) {
    case "timer":
      when = t("flow.summary.whenTimer", { time: formatClock(event.at) });
      break;
    case "zone":
      when = t("flow.summary.whenZone", { zone: zone?.name ?? "?" });
      break;
    case "manual":
      when = t("flow.summary.whenManual");
      break;
    case "prop":
      when = t("flow.summary.whenProp", {
        station: station?.name ?? "?",
      });
      break;
    case "signal":
      when = t("flow.summary.whenSignal", {
        station: station?.name ?? "?",
        action: event.intervention,
      });
      break;
    case "intervention":
      when = t("flow.summary.whenIntervention", {
        station: station?.name ?? "?",
        action: event.intervention,
      });
      break;
  }
  const parts = [when, ...event.actions.map((a) => actionSummary(a, draft))];
  if (linkedWorkflow)
    parts.push(t("flow.summary.starts", { name: linkedWorkflow.name }));
  return parts.join(" → ");
}
