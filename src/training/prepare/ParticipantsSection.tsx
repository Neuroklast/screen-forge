import { useState } from "react";
import { kinds, type Scenario } from "../../core/training";
import { equipmentReadiness } from "../../core/equipment";
import { labelFor } from "../../core/labels";
import { teamRoleLabel } from "../../core/roles";
import {
  recommendedStaffing,
  splitTeamTemplates,
  teamTemplate,
  teamTemplateLabel,
} from "../../core/teamTemplates";
import { t } from "../../i18n";
import { Term } from "../../ui/terminology/Term";
import { WorkspaceShell } from "../../ui/WorkspaceShell";
import { DossierEditor } from "../Dossiers";
import type { PrepareSectionProps } from "./shared";
import {
  addActor,
  addParticipant,
  addPatient,
  addTeam,
  addTeamFromTemplate,
  removeActor,
  removeParticipant,
  removePatient,
  removeTeam,
  updateActor,
  updateEquipment,
  updateParticipant,
  updatePatient,
  updateTeam,
} from "./forceCommands";
import "./forces.css";

// Forces: people concepts only — teams, participants (operators), actors and
// patients. A persistent workspace (navigator / roster / contextual inspector)
// instead of five stacked editor blocks.
type ForceSelection =
  | { kind: "team"; id: string }
  | { kind: "participant"; id: string }
  | { kind: "actor"; id: string }
  | { kind: "patient"; id: string }
  | null;

function Field({
  label,
  value,
  disabled,
  onCommit,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onCommit: (value: string) => void;
}) {
  return (
    <label className="sf-force-field">
      {label}
      <input
        key={value}
        defaultValue={value}
        disabled={disabled}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        onBlur={(event) => {
          if (event.currentTarget.value !== value)
            onCommit(event.currentTarget.value);
        }}
      />
    </label>
  );
}

export function ParticipantsSection({
  draft,
  change,
  readOnly,
  caps,
}: PrepareSectionProps) {
  const [selection, setSelection] = useState<ForceSelection>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [templatesMore, setTemplatesMore] = useState(false);
  const { recommended: recommendedTemplates, more: moreTemplates } =
    splitTeamTemplates(draft.type);
  const addFromTemplate = (templateId: string) => {
    const result = addTeamFromTemplate(draft, templateId);
    change(result.scenario);
    if (result.teamId) setSelection({ kind: "team", id: result.teamId });
    setTemplatesOpen(false);
  };
  const teams = draft.teams;
  const participants = draft.stations.filter((station) => station.player);
  // Scenario-wide readiness: one roll-up across every team's equipment.
  const scenarioReadiness = equipmentReadiness(draft.equipment);
  const teamMembers = (teamId: string) =>
    draft.stations.filter((station) => station.player && station.team === teamId);
  const teamDevices = (team: string) =>
    teams.some((row) => row.id === team)
      ? draft.stations.filter((station) => !station.player && station.team === team)
      : [];

  const selectedTeam =
    selection?.kind === "team"
      ? teams.find((team) => team.id === selection.id)
      : undefined;
  const selectedParticipant =
    selection?.kind === "participant"
      ? participants.find((station) => station.id === selection.id)
      : undefined;
  const selectedActor =
    selection?.kind === "actor"
      ? draft.actors.find((actor) => actor.id === selection.id)
      : undefined;
  const selectedPatient =
    selection?.kind === "patient"
      ? draft.patients.find((patient) => patient.id === selection.id)
      : undefined;

  const item = (
    kind: "team" | "participant" | "actor" | "patient",
    id: string,
    label: string,
    name: string,
    onRemove: () => void,
    detail?: string,
  ) => (
    <article
      key={id}
      className={`prepare-person sf-force-item ${
        selection?.kind === kind && selection.id === id ? "is-selected" : ""
      }`}
      onClick={() => setSelection({ kind, id } as ForceSelection)}
    >
      <header>
        <span>{label}</span>
        <button
          disabled={readOnly}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          {t("prep.people.remove")}
        </button>
      </header>
      <strong>{name}</strong>
      {detail && <small>{detail}</small>}
    </article>
  );

  const deviceDetail = (team: string) => {
    const assigned = teamDevices(team);
    return `${t("prep.people.devices")}: ${
      assigned.length
        ? assigned.map((row) => row.name).join(", ")
        : t("prep.people.noDevices")
    }`;
  };

  return (
    <section className="sf-force-workspace">
      <WorkspaceShell
        label={t("prep.people.workspace")}
        toolbar={
          <div className="sf-force-toolbar">
            <h2>
              <Term id="nav.forces" />
            </h2>
            <div className="sf-force-add">
              {caps.teams && (
                <button disabled={readOnly} onClick={() => change(addTeam(draft))}>
                  {t("prep.people.addTeam")}
                </button>
              )}
              {caps.teams && (
                <div className="sf-force-template">
                  <button
                    disabled={readOnly}
                    aria-expanded={templatesOpen}
                    onClick={() => setTemplatesOpen((value) => !value)}
                  >
                    {t("prep.people.addTeamTemplate")}
                  </button>
                  {templatesOpen && (
                    <div className="sf-force-template-menu">
                      <span className="sf-force-template-group">
                        {t("prep.people.recommended")}
                      </span>
                      {recommendedTemplates.map((template) => (
                        <button
                          key={template.id}
                          disabled={readOnly}
                          aria-label={teamTemplateLabel(template.id)}
                          onClick={() => addFromTemplate(template.id)}
                        >
                          <strong>{teamTemplateLabel(template.id)}</strong>
                          <small>
                            {recommendedStaffing(template)} ·{" "}
                            {template.roles
                              .map((role) => teamRoleLabel(role.roleId))
                              .join(" · ")}
                          </small>
                        </button>
                      ))}
                      {moreTemplates.length > 0 && (
                        <button
                          type="button"
                          className="sf-force-template-group is-toggle"
                          aria-expanded={templatesMore}
                          onClick={() => setTemplatesMore((value) => !value)}
                        >
                          {t("prep.people.more")}
                        </button>
                      )}
                      {templatesMore &&
                        moreTemplates.map((template) => (
                          <button
                            key={template.id}
                            disabled={readOnly}
                            aria-label={teamTemplateLabel(template.id)}
                            onClick={() => addFromTemplate(template.id)}
                          >
                            <strong>{teamTemplateLabel(template.id)}</strong>
                            <small>
                              {recommendedStaffing(template)} ·{" "}
                              {template.roles
                                .map((role) => teamRoleLabel(role.roleId))
                                .join(" · ")}
                            </small>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
              {caps.participants && (
                <button
                  disabled={readOnly}
                  onClick={() => change(addParticipant(draft))}
                >
                  {t("prep.people.addParticipant")}
                </button>
              )}
              {caps.actors && (
                <button disabled={readOnly} onClick={() => change(addActor(draft))}>
                  {t("prep.people.addActor")}
                </button>
              )}
              {caps.patients && (
                <button
                  disabled={readOnly}
                  onClick={() => change(addPatient(draft))}
                >
                  {t("prep.people.addPatient")}
                </button>
              )}
            </div>
            {scenarioReadiness.total > 0 && (
              <p className="sf-force-readiness">
                <span>{t("prep.people.equipmentScenario")}</span>
                <b>
                  {t("prep.people.equipmentScenarioReady", {
                    ready: scenarioReadiness.ready,
                    total: scenarioReadiness.total,
                  })}
                </b>
                {scenarioReadiness.missing > 0 && (
                  <em className="is-warning">
                    {t("prep.people.equipmentMissing", {
                      n: scenarioReadiness.missing,
                    })}
                  </em>
                )}
              </p>
            )}
          </div>
        }
        navigator={
          <div className="sf-force-nav">
            {caps.teams && (
              <section className="sf-force-nav-block">
                <h3>{t("prep.people.teams")}</h3>
                <div className="prepare-list">
                  {teams.map((team) =>
                    item(
                      "team",
                      team.id,
                      t("prep.people.teams"),
                      team.name,
                      () => change(removeTeam(draft, team.id)),
                    ),
                  )}
                </div>
              </section>
            )}
            {caps.participants && (
              <section className="sf-force-nav-block">
                <h3>{t("prep.people.participants")}</h3>
                <div className="prepare-list">
                  {participants.map((station) =>
                    item(
                      "participant",
                      station.id,
                      t("prep.devices.roleField"),
                      station.name,
                      () => change(removeParticipant(draft, station.id)),
                      deviceDetail(station.team),
                    ),
                  )}
                </div>
              </section>
            )}
            {caps.actors && (
              <section className="sf-force-nav-block">
                <h3>{t("prep.people.actors")}</h3>
                <div className="prepare-list">
                  {draft.actors.map((actor) =>
                    item(
                      "actor",
                      actor.id,
                      t("prep.people.actors"),
                      actor.name,
                      () => change(removeActor(draft, actor.id)),
                    ),
                  )}
                </div>
              </section>
            )}
            {caps.patients && (
              <section className="sf-force-nav-block">
                <h3>{t("prep.people.patients")}</h3>
                <div className="prepare-list">
                  {draft.patients.map((patient) =>
                    item(
                      "patient",
                      patient.id,
                      t("prep.people.patients"),
                      patient.name,
                      () => change(removePatient(draft, patient.id)),
                    ),
                  )}
                </div>
              </section>
            )}
          </div>
        }
        canvas={
          <div className="sf-force-roster">
            <section className="prepare-block">
              <h3>{t("prep.people.roster")}</h3>
              <ul className="sf-force-counts">
                <li>
                  {t("prep.people.teams")}: {teams.length}
                </li>
                <li>
                  {t("prep.people.participants")}: {participants.length}
                </li>
                <li>
                  {t("prep.people.actors")}: {draft.actors.length}
                </li>
                <li>
                  {t("prep.people.patients")}: {draft.patients.length}
                </li>
              </ul>
            </section>
            {caps.dossiers && (
              <section className="prepare-block">
                <h3>{t("prep.people.dossiers")}</h3>
                <DossierEditor
                  dossiers={draft.dossiers}
                  onChange={(dossiers) => change({ ...draft, dossiers })}
                />
              </section>
            )}
          </div>
        }
        inspector={
          <div className="sf-force-inspector">
            {selectedTeam && (
              <>
                <h3>{selectedTeam.name}</h3>
                <Field
                  label={t("editor.name")}
                  value={selectedTeam.name}
                  disabled={readOnly}
                  onCommit={(value) =>
                    change(updateTeam(draft, selectedTeam.id, { name: value }))
                  }
                />
                <label className="sf-force-field">
                  {t("prep.people.teamColor")}
                  <input
                    type="color"
                    value={selectedTeam.color}
                    disabled={readOnly}
                    onChange={(event) =>
                      change(
                        updateTeam(draft, selectedTeam.id, {
                          color: event.target.value,
                        }),
                      )
                    }
                  />
                </label>
                {(() => {
                  const template = selectedTeam.templateId
                    ? teamTemplate(selectedTeam.templateId)
                    : undefined;
                  if (!template) return null;
                  const staff = participants.filter(
                    (row) => row.team === selectedTeam.id,
                  );
                  return (
                    <div className="sf-force-staffing">
                      <strong>{teamTemplateLabel(template.id)}</strong>
                      <span>
                        {staff.length} / {recommendedStaffing(template)}{" "}
                        {t("prep.people.staffed")}
                      </span>
                      <ul>
                        {template.roles.map((roleSlot) => (
                          <li key={roleSlot.roleId}>
                            <span>{teamRoleLabel(roleSlot.roleId)}</span>
                            <b>
                              {
                                staff.filter(
                                  (row) => row.roleId === roleSlot.roleId,
                                ).length
                              }{" "}
                              / {roleSlot.recommended}
                            </b>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
                {(() => {
                  const equipment = draft.equipment.filter(
                    (item) => item.assignedTo.teamId === selectedTeam.id,
                  );
                  if (!equipment.length) return null;
                  const { missing } = equipmentReadiness(equipment);
                  const members = teamMembers(selectedTeam.id);
                  return (
                    <div className="sf-force-equipment">
                      <strong>{t("prep.people.equipment")}</strong>
                      <span className={missing ? "is-warning" : "is-ok"}>
                        {missing
                          ? t("prep.people.equipmentMissing", { n: missing })
                          : t("prep.people.equipmentReady")}
                      </span>
                      <ul>
                        {equipment.map((item) => (
                          <li key={item.id}>
                            <span>{item.name}</span>
                            <select
                              aria-label={`${item.name} ${t("prep.people.equipmentStatus")}`}
                              value={item.status}
                              disabled={readOnly}
                              onChange={(event) =>
                                change(
                                  updateEquipment(draft, item.id, {
                                    status: event.target
                                      .value as typeof item.status,
                                  }),
                                )
                              }
                            >
                              <option value="ready">
                                {t("equipment.status.ready")}
                              </option>
                              <option value="limited">
                                {t("equipment.status.limited")}
                              </option>
                              <option value="unavailable">
                                {t("equipment.status.unavailable")}
                              </option>
                            </select>
                            <select
                              aria-label={`${item.name} ${t("prep.people.equipmentPerson")}`}
                              value={item.assignedTo.personId}
                              disabled={readOnly}
                              onChange={(event) =>
                                change(
                                  updateEquipment(draft, item.id, {
                                    assignedTo: {
                                      ...item.assignedTo,
                                      personId: event.target.value,
                                    },
                                  }),
                                )
                              }
                            >
                              <option value="">
                                {t("prep.people.equipmentUnassigned")}
                              </option>
                              {members.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.name}
                                </option>
                              ))}
                            </select>
                            <select
                              aria-label={`${item.name} ${t("prep.people.equipmentDevice")}`}
                              value={item.linkedDeviceId}
                              disabled={readOnly}
                              onChange={(event) =>
                                change(
                                  updateEquipment(draft, item.id, {
                                    linkedDeviceId: event.target.value,
                                  }),
                                )
                              }
                            >
                              <option value="">
                                {t("prep.people.equipmentNoDevice")}
                              </option>
                              {draft.stations.map((station) => (
                                <option key={station.id} value={station.id}>
                                  {station.name}
                                </option>
                              ))}
                            </select>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
              </>
            )}
            {selectedParticipant && (
              <>
                <h3>{selectedParticipant.name}</h3>
                <Field
                  label={t("editor.name")}
                  value={selectedParticipant.name}
                  disabled={readOnly}
                  onCommit={(value) =>
                    change(
                      updateParticipant(draft, selectedParticipant.id, {
                        name: value,
                      }),
                    )
                  }
                />
                {caps.teams && teams.length > 0 && (
                  <label className="sf-force-field">
                    {t("cap.teams")}
                    <select
                      value={
                        teams.some((row) => row.id === selectedParticipant.team)
                          ? selectedParticipant.team
                          : ""
                      }
                      disabled={readOnly}
                      onChange={(event) =>
                        change(
                          updateParticipant(draft, selectedParticipant.id, {
                            team: event.target.value,
                          }),
                        )
                      }
                    >
                      <option value="">{t("prep.people.unassigned")}</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <small>
                  {t("prep.people.devices")}:{" "}
                  {teamDevices(selectedParticipant.team).length
                    ? teamDevices(selectedParticipant.team)
                        .map((row) => row.name)
                        .join(", ")
                    : t("prep.people.noDevices")}
                </small>
              </>
            )}
            {selectedActor && (
              <>
                <h3>{selectedActor.name}</h3>
                <Field
                  label={t("editor.name")}
                  value={selectedActor.name}
                  disabled={readOnly}
                  onCommit={(value) =>
                    change(updateActor(draft, selectedActor.id, { name: value }))
                  }
                />
                <Field
                  label={t("prep.people.character")}
                  value={selectedActor.character}
                  disabled={readOnly}
                  onCommit={(value) =>
                    change(
                      updateActor(draft, selectedActor.id, { character: value }),
                    )
                  }
                />
                {caps.dossiers && (
                  <label className="sf-force-field">
                    {t("prep.people.dossier")}
                    <select
                      value={selectedActor.dossierId}
                      disabled={readOnly}
                      onChange={(event) =>
                        change(
                          updateActor(draft, selectedActor.id, {
                            dossierId: event.target.value,
                          }),
                        )
                      }
                    >
                      <option value="">{t("prep.people.noDossier")}</option>
                      {draft.dossiers.map((dossier) => (
                        <option key={dossier.id} value={dossier.id}>
                          {dossier.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="sf-force-field">
                  {t("prep.people.briefing")}
                  <textarea
                    value={selectedActor.briefing}
                    disabled={readOnly}
                    onChange={(event) =>
                      change(
                        updateActor(draft, selectedActor.id, {
                          briefing: event.target.value,
                        }),
                      )
                    }
                  />
                </label>
              </>
            )}
            {selectedPatient && (
              <>
                <h3>{selectedPatient.name}</h3>
                <Field
                  label={t("editor.name")}
                  value={selectedPatient.name}
                  disabled={readOnly}
                  onCommit={(value) =>
                    change(updatePatient(draft, selectedPatient.id, { name: value }))
                  }
                />
                <label className="sf-force-field">
                  {t("prep.people.patientState")}
                  <select
                    value={selectedPatient.kind}
                    disabled={readOnly}
                    onChange={(event) =>
                      change(
                        updatePatient(draft, selectedPatient.id, {
                          kind: event.target.value as typeof selectedPatient.kind,
                        }),
                      )
                    }
                  >
                    {kinds.map((kind) => (
                      <option key={kind} value={kind}>
                        {labelFor("patientKind", kind)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="sf-force-field">
                  {t("prep.people.triage")}
                  <select
                    value={selectedPatient.triage}
                    disabled={readOnly}
                    onChange={(event) =>
                      change(
                        updatePatient(draft, selectedPatient.id, {
                          triage: event.target.value as typeof selectedPatient.triage,
                        }),
                      )
                    }
                  >
                    {["green", "yellow", "red", "black"].map((level) => (
                      <option key={level} value={level}>
                        {labelFor("triage", level)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="sf-force-field">
                  {t("prep.people.injuries")}
                  <textarea
                    value={selectedPatient.injuries}
                    disabled={readOnly}
                    onChange={(event) =>
                      change(
                        updatePatient(draft, selectedPatient.id, {
                          injuries: event.target.value,
                        }),
                      )
                    }
                  />
                </label>
              </>
            )}
            {!selection && (
              <p className="sf-force-inspector-empty">
                {t("prep.people.noSelection")}
              </p>
            )}
          </div>
        }
      />
    </section>
  );
}
