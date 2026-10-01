import { buildTerm } from "../../../core/terminology/build";
import type { TacticalTerm } from "../../../core/terminology/types";

// Exercise control and training. Essential for the ScreenForge EXCON surface.
export const trainingTerms: TacticalTerm[] = [
  buildTerm({
    id: "exercise_control",
    category: "training",
    en: {
      general: "Exercise Control",
      professional: "EXERCISE CONTROL",
      military: "EXCON",
      full: "Exercise Control",
      acronym: "EXCON",
    },
    de: {
      general: "Übungsleitung",
      professional: "ÜBUNGSLEITUNG",
      military: "ÜBUNGSLEITUNG",
      full: "Übungsleitung",
    },
  }),
  buildTerm({
    id: "exercise_director",
    category: "training",
    en: { general: "Exercise Director", professional: "Exercise Director" },
    de: { general: "Übungsleiter", professional: "Übungsleiter", military: "ÜBUNGSLEITER" },
  }),
  buildTerm({
    id: "controller",
    category: "training",
    en: { general: "Controller", professional: "Controller" },
    de: { general: "Leitender", professional: "Leitender", military: "LEITENDER", full: "Leitender / Controller" },
  }),
  buildTerm({
    id: "observer",
    category: "training",
    en: { general: "Observer", professional: "Observer" },
    de: { general: "Beobachter", professional: "Beobachter", military: "BEOBACHTER" },
  }),
  buildTerm({
    id: "trainer",
    category: "training",
    en: { general: "Trainer", professional: "Trainer" },
    de: { general: "Ausbilder", professional: "Ausbilder", military: "AUSBILDER" },
  }),
  buildTerm({
    id: "participant",
    category: "training",
    en: { general: "Participant", professional: "Participant" },
    de: { general: "Übungsteilnehmer", professional: "Übungsteilnehmer", military: "ÜBUNGSTEILNEHMER" },
  }),
  buildTerm({
    id: "inject",
    category: "training",
    en: { general: "Inject", professional: "Inject" },
    de: { general: "Einspielung", professional: "Einspielung", military: "EINSPIELUNG" },
  }),
  buildTerm({
    id: "master_events_list",
    category: "training",
    en: {
      general: "Master Events List",
      professional: "Master Events List",
      military: "MEL",
      full: "Master Events List",
      acronym: "MEL",
    },
    de: { general: "Hauptereignisliste", professional: "Hauptereignisliste", military: "HAUPTEREIGNISLISTE" },
  }),
  buildTerm({
    id: "master_scenario_events_list",
    category: "training",
    en: {
      general: "Master Scenario Events List",
      professional: "Master Scenario Events List",
      military: "MSEL",
      full: "Master Scenario Events List",
      acronym: "MSEL",
    },
    de: { general: "Szenarioereignisliste", professional: "Szenarioereignisliste", military: "SZENARIOEREIGNISLISTE" },
  }),
  buildTerm({
    id: "expected_action",
    category: "training",
    en: { general: "Expected Action", professional: "Expected Action" },
    de: { general: "erwartete Handlung", professional: "erwartete Handlung", military: "ERWARTETE HANDLUNG" },
  }),
  buildTerm({
    id: "observed_action",
    category: "training",
    en: { general: "Observed Action", professional: "Observed Action" },
    de: { general: "beobachtete Handlung", professional: "beobachtete Handlung", military: "BEOBACHTETE HANDLUNG" },
  }),
  buildTerm({
    id: "training_objective",
    category: "training",
    en: { general: "Training Objective", professional: "Training Objective" },
    de: { general: "Ausbildungsziel", professional: "Ausbildungsziel", military: "AUSBILDUNGSZIEL" },
  }),
  buildTerm({
    id: "evaluation",
    category: "training",
    en: { general: "Evaluation", professional: "Evaluation" },
    de: { general: "Bewertung", professional: "Bewertung", military: "BEWERTUNG" },
  }),
  buildTerm({
    id: "observation_record",
    category: "training",
    en: { general: "Observation Record", professional: "Observation Record" },
    de: { general: "Beobachtungsprotokoll", professional: "Beobachtungsprotokoll", military: "BEOBACHTUNGSPROTOKOLL" },
  }),
  buildTerm({
    id: "exercise_state",
    category: "training",
    en: { general: "Exercise State", professional: "Exercise State" },
    de: { general: "Übungszustand", professional: "Übungszustand", military: "ÜBUNGSZUSTAND" },
  }),
  buildTerm({
    id: "pause_exercise",
    category: "training",
    en: { general: "Pause Exercise", professional: "Pause Exercise", military: "PAUSE EXERCISE" },
    de: { general: "Übung pausieren", professional: "Übung pausieren", military: "ÜBUNG PAUSIEREN" },
  }),
  buildTerm({
    id: "resume_exercise",
    category: "training",
    en: { general: "Resume Exercise", professional: "Resume Exercise", military: "RESUME EXERCISE" },
    de: { general: "Übung fortsetzen", professional: "Übung fortsetzen", military: "ÜBUNG FORTSETZEN" },
  }),
  buildTerm({
    id: "terminate_exercise",
    category: "training",
    en: {
      general: "Terminate Exercise",
      professional: "Terminate Exercise",
      military: "ENDEX",
      full: "Terminate Exercise",
      acronym: "ENDEX",
    },
    de: { general: "Übungsende", professional: "Übungsende", military: "ÜBUNGSENDE" },
  }),
  buildTerm({
    id: "start_exercise",
    category: "training",
    en: {
      general: "Start Exercise",
      professional: "Start Exercise",
      military: "STARTEX",
      full: "Start Exercise",
      acronym: "STARTEX",
    },
    de: { general: "Übungsbeginn", professional: "Übungsbeginn", military: "ÜBUNGSBEGINN" },
  }),
  buildTerm({
    id: "after_action_review",
    category: "training",
    en: {
      general: "After Action Review",
      professional: "After Action Review",
      military: "AAR",
      full: "After Action Review",
      acronym: "AAR",
    },
    de: { general: "Auswertung", professional: "Auswertung", military: "AUSWERTUNG", full: "Auswertung / Nachbesprechung" },
  }),
  buildTerm({
    id: "hotwash",
    category: "training",
    en: { general: "Hotwash", professional: "Hotwash" },
    de: { general: "unmittelbare Nachbesprechung", professional: "unmittelbare Nachbesprechung", military: "UNMITTELBARE NACHBESPRECHUNG" },
  }),
];
