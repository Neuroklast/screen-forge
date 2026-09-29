import { z } from "zod";
import {
  actionSchema,
  patientSchema,
  scenarioSchema,
  act,
  logEvent,
  setProp,
  type TrainingState,
} from "./training.ts";

// Authoritative, replayable changes. Telemetry and media are deliberately absent.
export const domainEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("scenario.saved"), scenario: scenarioSchema }),
  z.object({
    type: z.literal("exercise.transport"),
    command: z.enum(["play", "pause"]),
  }),
  z.object({ type: z.literal("exercise.reset") }),
  z.object({ type: z.literal("exercise.aborted"), by: z.string().max(20) }),
  z.object({ type: z.literal("inject.fired"), inject: z.string().max(40) }),
  z.object({ type: z.literal("action.applied"), action: actionSchema }),
  z.object({ type: z.literal("patient.changed"), patient: patientSchema }),
  z.object({
    type: z.literal("message.posted"),
    from: z.string().max(40),
    to: z.string().max(40),
    text: z.string().max(280),
  }),
  z.object({
    type: z.literal("note.added"),
    role: z.string().max(20),
    text: z.string().max(500),
  }),
  z.object({
    type: z.literal("module.event"),
    station: z.string().max(40),
    value: z.string().max(80),
  }),
  z.object({
    type: z.literal("intervention.reported"),
    station: z.string().max(40),
    value: z.string().max(80),
  }),
  z.object({ type: z.literal("access.granted"), station: z.string().max(40) }),
  z.object({
    type: z.literal("prop.changed"),
    prop: z.string().max(40),
    state: z.string().max(40),
  }),
  z.object({
    type: z.literal("msel.rescheduled"),
    inject: z.string().max(40),
    from: z.number().min(0).max(86400),
    to: z.number().min(0).max(86400),
    reason: z.string().max(120).default(""),
  }),
]);
export type DomainEvent = z.infer<typeof domainEventSchema>;

export type JournalRecord = {
  serverSeq: number;
  wallAt: number;
  actor: string;
  event: DomainEvent;
};

// `exercise.reset` is applied by the server (it needs the baseline scenario).
export function applyEvent(state: TrainingState, event: DomainEvent): void {
  switch (event.type) {
    case "scenario.saved":
      state.scenario = event.scenario;
      state.propStates = Object.fromEntries(
        event.scenario.props.map((p) => [p.id, p.initial]),
      );
      state.revision++;
      logEvent(state, "Scenario saved");
      return;
    case "exercise.transport":
      state.frozen = event.command === "pause";
      state.phase = event.command === "pause" ? "paused" : "running";
      return;
    case "exercise.reset":
      return;
    case "exercise.aborted":
      state.frozen = true;
      state.phase = "aborted";
      logEvent(state, `Exercise aborted (${event.by})`);
      return;
    case "inject.fired": {
      const inject = state.scenario.injects.find((r) => r.id === event.inject);
      if (!inject || state.fired.includes(inject.id)) return;
      state.fired.push(inject.id);
      if (
        inject.unless &&
        state.interventions[inject.station]?.includes(inject.unless)
      ) {
        logEvent(state, `Skipped: ${inject.name}`);
        return;
      }
      logEvent(state, `Event: ${inject.name}`);
      inject.actions.forEach((a) => act(state, a));
      return;
    }
    case "action.applied":
      act(state, event.action);
      return;
    case "patient.changed": {
      const i = state.scenario.patients.findIndex(
        (p) => p.id === event.patient.id,
      );
      if (i < 0) return;
      state.scenario.patients[i] = { ...event.patient, since: state.clock };
      logEvent(state, `Patient adjusted: ${event.patient.name}`);
      return;
    }
    case "message.posted":
      state.messages = [
        ...state.messages,
        { at: state.clock, from: event.from, to: event.to, text: event.text },
      ].slice(-200);
      logEvent(state, `Message → ${event.to}: ${event.text}`);
      return;
    case "note.added":
      state.notes = [
        ...state.notes,
        { at: state.clock, role: event.role, text: event.text },
      ].slice(-200);
      return;
    case "module.event": {
      const st = state.scenario.stations.find((s) => s.id === event.station);
      logEvent(state, `${st?.name ?? event.station}: ${event.value}`);
      return;
    }
    case "intervention.reported": {
      const values = (state.interventions[event.station] ||= []);
      if (!values.includes(event.value)) {
        const st = state.scenario.stations.find((s) => s.id === event.station);
        values.push(event.value);
        logEvent(state, `${st?.name ?? event.station}: ${event.value}`);
      }
      return;
    }
    case "access.granted": {
      if (!state.props[event.station]) {
        const st = state.scenario.stations.find((s) => s.id === event.station);
        state.props[event.station] = true;
        logEvent(state, `${st?.name ?? event.station}: completed`);
      }
      return;
    }
    case "prop.changed":
      setProp(state, event.prop, event.state);
      return;
    case "msel.rescheduled": {
      const inject = state.scenario.injects.find((r) => r.id === event.inject);
      if (!inject) return;
      if (inject.plannedAtOriginal == null)
        inject.plannedAtOriginal = inject.at;
      inject.scheduledAt = event.to;
      inject.revision++;
      logEvent(state, `MEL rescheduled: ${inject.name} → ${event.to}s`);
      return;
    }
  }
}
