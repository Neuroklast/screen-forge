import { lazy, Suspense, useState } from "react";
import {
  actorSchema,
  patientSchema,
  scenarioSchema,
  stationSchema,
  teamSchema,
  type Scenario,
} from "../core/training";
import {
  scenarioTypes,
  scenarioCapabilities,
  type ScenarioType,
} from "../core/capabilities";
import { createNodeOfKind, createWorkflow, workflowUid } from "../core/workflowEdit";
import { findingCounts, lintMission } from "../core/missionLint";
import { missionTemplates } from "../core/templates";
import { devicePresets, devicePresetsFor } from "./prepare/devicePresets";
import { buildDevice, uid } from "./prepare/shared";
import { t } from "../i18n";

// React Flow loads only when the guided Ablauf step renders.
const WorkflowCanvas = lazy(() =>
  import("../builder/WorkflowCanvas").then((module) => ({
    default: module.WorkflowCanvas,
  })),
);

const map = { lat: 51.23, lng: 6.78, zoom: 15, tiles: "", attribution: "" };

function blankScenario(type: ScenarioType): Scenario {
  return scenarioSchema.parse({
    version: 2,
    type,
    name: t(`prep.scenario.type.${type}`),
    mode: type === "film" ? "PLAYBACK" : "LIVE",
    seed: 2048,
    map,
    stations: [],
    patients: [],
    props: [],
    dossiers: [],
    teams: [],
    actors: [],
    zones: [],
    injects: [],
    objectives: [],
    workflows: [],
  });
}

// Guided setup: five steps, capability-driven. It creates a valid draft
// without asking for modules, roles, bindings, ids or inject structures.
export function ScenarioWizard({
  onSave,
  onClose,
}: {
  onSave: (s: Scenario) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0),
    [draft, setDraft] = useState(() => blankScenario("field")),
    [presetId, setPresetId] = useState(devicePresets[0].id),
    [selectedNode, setSelectedNode] = useState(""),
    [error, setError] = useState("");
  const caps = scenarioCapabilities(draft);
  const presets = devicePresetsFor(caps);
  const update = (patch: Partial<Scenario>) =>
    setDraft((s) => ({ ...s, ...patch }));
  const steps = [
    "wizard.step.type",
    "wizard.step.people",
    "wizard.step.devices",
    "wizard.step.flow",
    "wizard.step.start",
  ];
  const next = () => {
    setError("");
    if (step === 2 && draft.stations.length === 0) {
      setError(t("lint.stationsMin"));
      return;
    }
    if (step === 4) {
      const result = scenarioSchema.safeParse(draft);
      if (!result.success) {
        setError(result.error.issues.map((i) => i.message).join(" · "));
        return;
      }
      onSave(result.data);
      return;
    }
    setStep(step + 1);
  };
  const addDevice = () => {
    const preset = presets.find((p) => p.id === presetId) ?? presets[0];
    if (!preset) return;
    const { station, props, patients } = buildDevice(draft, preset);
    update({ stations: [...draft.stations, station], props, patients });
  };
  const addStarterFlow = () => {
    const workflow = createWorkflow(workflowUid("wf"));
    const message = createNodeOfKind(workflow, "message", {
      position: { x: 260, y: 80 },
    });
    update({
      workflows: [
        ...draft.workflows,
        {
          ...message.workflow,
          edges: [
            { id: "e1", source: "start", output: "out", target: message.nodeId },
            { id: "e2", source: message.nodeId, output: "success", target: "end" },
          ],
        },
      ],
    });
  };
  const findings = lintMission(draft);
  const counts = findingCounts(findings);
  return (
    <section className="wizard panel" aria-label={t("wizard.aria")}>
      <div className="section-heading">
        <span className="eyebrow">{t("wizard.eyebrow", { step: step + 1 })}</span>
        <button onClick={onClose}>{t("common.close")}</button>
      </div>
      <h2>{t(steps[step])}</h2>
      <ol className="wizard-steps">
        {steps.map((key, i) => (
          <li key={key} className={i === step ? "active" : ""}>
            {i + 1}. {t(key)}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <>
          <p className="eyebrow">{t("wizard.type")}</p>
          <div className="template-grid">
            {scenarioTypes.map((type) => (
              <button
                key={type}
                className={draft.type === type ? "active" : ""}
                onClick={() =>
                  setDraft({
                    ...blankScenario(type),
                    name:
                      draft.name ||
                      missionTemplates.find((tpl) => tpl.scenario.type === type)
                        ?.name ||
                      t(`prep.scenario.type.${type}`),
                  })
                }
              >
                <strong>{t(`prep.scenario.type.${type}`)}</strong>
              </button>
            ))}
          </div>
          <p className="eyebrow">{t("wizard.library")}</p>
          <div className="template-grid">
            {missionTemplates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => {
                  setDraft(structuredClone(tpl.scenario));
                  setError("");
                }}
              >
                <strong>{tpl.name}</strong>
                <span>{tpl.category}</span>
              </button>
            ))}
          </div>
          <div className="form-grid">
            <label>
              {t("wizard.name")}
              <input
                value={draft.name}
                onChange={(e) => update({ name: e.target.value })}
              />
            </label>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <p>{t("wizard.peopleNote")}</p>
          <div className="button-row">
            {caps.participants && (
              <button
                onClick={() =>
                  update({
                    stations: [
                      ...draft.stations,
                      stationSchema.parse({
                        id: uid("participant"),
                        name: t("prep.people.participantName", {
                          n: draft.stations.filter((s) => s.player).length + 1,
                        }),
                        role: "element",
                        module: "tracking",
                        player: true,
                        team: draft.teams[0]?.id ?? "",
                      }),
                    ],
                  })
                }
              >
                {t("prep.people.addParticipant")}
              </button>
            )}
            {caps.teams && (
              <button
                onClick={() =>
                  update({
                    teams: [
                      ...draft.teams,
                      teamSchema.parse({
                        id: uid("team").toUpperCase().replace("-", ""),
                        name: t("prep.people.teamName", {
                          n: draft.teams.length + 1,
                        }),
                      }),
                    ],
                  })
                }
              >
                {t("prep.people.addTeam")}
              </button>
            )}
            {caps.actors && (
              <button
                onClick={() =>
                  update({
                    actors: [
                      ...draft.actors,
                      actorSchema.parse({
                        id: uid("actor"),
                        name: t("prep.people.actorName", {
                          n: draft.actors.length + 1,
                        }),
                      }),
                    ],
                  })
                }
              >
                {t("prep.people.addActor")}
              </button>
            )}
            {caps.patients && (
              <button
                onClick={() =>
                  update({
                    patients: [
                      ...draft.patients,
                      patientSchema.parse({
                        id: uid("patient"),
                        name: t("prep.people.patientName", {
                          n: draft.patients.length + 1,
                        }),
                        kind: "stable",
                        since: 0,
                      }),
                    ],
                  })
                }
              >
                {t("prep.people.addPatient")}
              </button>
            )}
          </div>
          <ul>
            {draft.stations
              .filter((s) => s.player)
              .map((s) => (
                <li key={s.id}>{s.name}</li>
              ))}
            {draft.teams.map((team) => (
              <li key={team.id}>{team.name}</li>
            ))}
            {draft.actors.map((a) => (
              <li key={a.id}>{a.name}</li>
            ))}
            {draft.patients.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </>
      )}

      {step === 2 && (
        <>
          <p>{t("wizard.devicesNote")}</p>
          <div className="form-grid">
            <label>
              {t("wizard.devicePreset")}
              <select
                value={presetId}
                onChange={(e) => setPresetId(e.target.value)}
              >
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {t(preset.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={addDevice}>{t("prep.devices.add")}</button>
          </div>
          <div className="prepare-list">
            {draft.stations.map((st) => (
              <label key={st.id}>
                {st.name}
                <input
                  value={st.name}
                  onChange={(e) =>
                    update({
                      stations: draft.stations.map((row) =>
                        row.id === st.id
                          ? { ...row, name: e.target.value }
                          : row,
                      ),
                    })
                  }
                />
              </label>
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <p>{t("wizard.flowNote")}</p>
          <p>{t("wizard.flowSimple")}</p>
          <button
            disabled={draft.workflows.length > 0}
            onClick={addStarterFlow}
          >
            {t("builder.newWorkflow")}
          </button>
          {draft.workflows.length > 0 && (
            <div className="wizard-graph">
              <Suspense
                fallback={<p className="builder-hint">{t("builder.loading")}</p>}
              >
                <WorkflowCanvas
                  workflow={draft.workflows[0]}
                  findings={findings}
                  readOnly={false}
                  selectedNodeId={selectedNode}
                  onSelectNode={setSelectedNode}
                  onPatch={(next) =>
                    update({
                      workflows: draft.workflows.map((row) =>
                        row.id === next.id ? next : row,
                      ),
                    })
                  }
                  variant="human"
                />
              </Suspense>
            </div>
          )}
        </>
      )}

      {step === 4 && (
        <>
          <div className="summary-grid">
            <div>
              <b>{draft.name}</b>
              <span>{t(`prep.scenario.type.${draft.type}`)}</span>
            </div>
            <div>
              <b>{draft.stations.length}</b>
              <span>{t("prep.tab.devices")}</span>
            </div>
            <div>
              <b>
                {draft.stations.filter((s) => s.player).length +
                  draft.actors.length +
                  draft.patients.length}
              </b>
              <span>{t("prep.tab.participants")}</span>
            </div>
            <div>
              <b>{counts.error}</b>
              <span>
                {counts.error
                  ? t("prep.review.blocked", { count: counts.error })
                  : t("prep.review.ready")}
              </span>
            </div>
          </div>
          <p>{t("wizard.summaryNote")}</p>
        </>
      )}

      {error && <p role="alert">{error}</p>}
      <div className="button-row">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)}>{t("common.back")}</button>
        )}
        <button className="primary" onClick={next}>
          {step === 4 ? t("wizard.create") : t("common.next")}
        </button>
      </div>
    </section>
  );
}
