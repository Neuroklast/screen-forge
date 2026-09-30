import {
  actorSchema,
  kinds,
  patientSchema,
  stationSchema,
  teamSchema,
  type Scenario,
} from "../../core/training";
import { t } from "../../i18n";
import { DossierEditor } from "../Dossiers";
import { uid, type PrepareSectionProps } from "./shared";

// Participants: people concepts only — participants (operators), teams, actors
// (with their personnel file) and patients. Devices are managed in Devices.
export function ParticipantsSection({
  draft,
  change,
  readOnly,
  caps,
}: PrepareSectionProps) {
  const patch = (s: Partial<Scenario>) => change({ ...draft, ...s });
  const teams = draft.teams;
  const participants = draft.stations.filter((st) => st.player);
  // Only real team entities count as ownership; the legacy per-station team
  // label (schema default) must not make every device belong to one player.
  const teamDevices = (team: string) =>
    teams.some((row) => row.id === team)
      ? draft.stations.filter((st) => !st.player && st.team === team)
      : [];

  return (
    <section className="panel prepare">
      <h2>{t("prep.tab.participants")}</h2>

      {caps.teams && (
        <section className="prepare-block">
          <h3>{t("prep.people.teams")}</h3>
          <div className="prepare-list">
            {teams.map((team) => (
              <div className="prepare-row" key={team.id}>
                <label>
                  {t("editor.name")}
                  <input
                    value={team.name}
                    disabled={readOnly}
                    onChange={(e) =>
                      patch({
                        teams: teams.map((row) =>
                          row.id === team.id
                            ? { ...row, name: e.target.value }
                            : row,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  {t("prep.people.teamColor")}
                  <input
                    type="color"
                    value={team.color}
                    disabled={readOnly}
                    onChange={(e) =>
                      patch({
                        teams: teams.map((row) =>
                          row.id === team.id
                            ? { ...row, color: e.target.value }
                            : row,
                        ),
                      })
                    }
                  />
                </label>
                <button
                  disabled={readOnly}
                  onClick={() =>
                    patch({ teams: teams.filter((row) => row.id !== team.id) })
                  }
                >
                  {t("prep.people.remove")}
                </button>
              </div>
            ))}
          </div>
          <button
            disabled={readOnly}
            onClick={() =>
              patch({
                teams: [
                  ...teams,
                  teamSchema.parse({
                    id: uid("team").toUpperCase().replace("-", ""),
                    name: t("prep.people.teamName", { n: teams.length + 1 }),
                  }),
                ],
              })
            }
          >
            {t("prep.people.addTeam")}
          </button>
        </section>
      )}

      {caps.participants && (
        <section className="prepare-block">
          <h3>{t("prep.people.participants")}</h3>
          <p className="prepare-hint">{t("prep.people.participantsHint")}</p>
          <div className="prepare-list">
            {participants.map((st) => {
              const assigned = teamDevices(st.team);
              return (
                <div className="prepare-person" key={st.id}>
                  <header>
                    <span>{t("prep.devices.roleField")}</span>
                    <button
                      disabled={readOnly}
                      onClick={() =>
                        patch({
                          stations: draft.stations.filter(
                            (row) => row.id !== st.id,
                          ),
                        })
                      }
                    >
                      {t("prep.people.remove")}
                    </button>
                  </header>
                  <div className="prepare-device-grid">
                    <label>
                      {t("editor.name")}
                      <input
                        value={st.name}
                        disabled={readOnly}
                        onChange={(e) =>
                          patch({
                            stations: draft.stations.map((row) =>
                              row.id === st.id
                                ? { ...row, name: e.target.value }
                                : row,
                            ),
                          })
                        }
                      />
                    </label>
                    {caps.teams && (
                      <label>
                        {t("cap.teams")}
                        <select
                          value={
                            teams.some((row) => row.id === st.team)
                              ? st.team
                              : ""
                          }
                          disabled={readOnly}
                          onChange={(e) =>
                            patch({
                              stations: draft.stations.map((row) =>
                                row.id === st.id
                                  ? { ...row, team: e.target.value }
                                  : row,
                              ),
                            })
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
                  </div>
                  <small>
                    {t("prep.people.devices")}:{" "}
                    {assigned.length
                      ? assigned.map((row) => row.name).join(", ")
                      : t("prep.people.noDevices")}
                  </small>
                </div>
              );
            })}
          </div>
          <button
            disabled={readOnly}
            onClick={() =>
              patch({
                stations: [
                  ...draft.stations,
                  stationSchema.parse({
                    id: uid("participant"),
                    name: t("prep.people.participantName", {
                      n: participants.length + 1,
                    }),
                    role: "element",
                    module: "tracking",
                    player: true,
                    team: teams[0]?.id ?? "",
                  }),
                ],
              })
            }
          >
            {t("prep.people.addParticipant")}
          </button>
        </section>
      )}

      {caps.actors && (
        <section className="prepare-block">
          <h3>{t("prep.people.actors")}</h3>
          <div className="prepare-list">
            {draft.actors.map((actor) => (
              <div className="prepare-person" key={actor.id}>
                <header>
                  <span>{t("prep.people.actors")}</span>
                  <button
                    disabled={readOnly}
                    onClick={() =>
                      patch({
                        actors: draft.actors.filter(
                          (row) => row.id !== actor.id,
                        ),
                      })
                    }
                  >
                    {t("prep.people.remove")}
                  </button>
                </header>
                <div className="prepare-device-grid">
                  <label>
                    {t("editor.name")}
                    <input
                      value={actor.name}
                      disabled={readOnly}
                      onChange={(e) =>
                        patch({
                          actors: draft.actors.map((row) =>
                            row.id === actor.id
                              ? { ...row, name: e.target.value }
                              : row,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    {t("prep.people.character")}
                    <input
                      value={actor.character}
                      disabled={readOnly}
                      onChange={(e) =>
                        patch({
                          actors: draft.actors.map((row) =>
                            row.id === actor.id
                              ? { ...row, character: e.target.value }
                              : row,
                          ),
                        })
                      }
                    />
                  </label>
                  {caps.dossiers && (
                    <label>
                      {t("prep.people.dossier")}
                      <select
                        value={actor.dossierId}
                        disabled={readOnly}
                        onChange={(e) =>
                          patch({
                            actors: draft.actors.map((row) =>
                              row.id === actor.id
                                ? { ...row, dossierId: e.target.value }
                                : row,
                            ),
                          })
                        }
                      >
                        <option value="">{t("prep.people.noDossier")}</option>
                        {draft.dossiers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                <label>
                  {t("prep.people.briefing")}
                  <textarea
                    value={actor.briefing}
                    disabled={readOnly}
                    onChange={(e) =>
                      patch({
                        actors: draft.actors.map((row) =>
                          row.id === actor.id
                            ? { ...row, briefing: e.target.value }
                            : row,
                        ),
                      })
                    }
                  />
                </label>
              </div>
            ))}
          </div>
          <button
            disabled={readOnly}
            onClick={() =>
              patch({
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
        </section>
      )}

      {caps.patients && (
        <section className="prepare-block">
          <h3>{t("prep.people.patients")}</h3>
          <div className="prepare-list">
            {draft.patients.map((p) => (
              <div className="prepare-person" key={p.id}>
                <header>
                  <span>{t("prep.people.patients")}</span>
                  <button
                    disabled={readOnly}
                    onClick={() =>
                      patch({
                        patients: draft.patients.filter(
                          (row) => row.id !== p.id,
                        ),
                      })
                    }
                  >
                    {t("prep.people.remove")}
                  </button>
                </header>
                <div className="prepare-device-grid">
                  <label>
                    {t("editor.name")}
                    <input
                      value={p.name}
                      disabled={readOnly}
                      onChange={(e) =>
                        patch({
                          patients: draft.patients.map((row) =>
                            row.id === p.id
                              ? { ...row, name: e.target.value }
                              : row,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    {t("prep.people.patientState")}
                    <select
                      value={p.kind}
                      disabled={readOnly}
                      onChange={(e) =>
                        patch({
                          patients: draft.patients.map((row) =>
                            row.id === p.id
                              ? {
                                  ...row,
                                  kind: e.target.value as typeof p.kind,
                                }
                              : row,
                          ),
                        })
                      }
                    >
                      {kinds.map((kind) => (
                        <option key={kind} value={kind}>
                          {kind}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t("prep.people.triage")}
                    <select
                      value={p.triage}
                      disabled={readOnly}
                      onChange={(e) =>
                        patch({
                          patients: draft.patients.map((row) =>
                            row.id === p.id
                              ? {
                                  ...row,
                                  triage: e.target.value as typeof p.triage,
                                }
                              : row,
                          ),
                        })
                      }
                    >
                      {["green", "yellow", "red", "black"].map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  {t("prep.people.injuries")}
                  <textarea
                    value={p.injuries}
                    disabled={readOnly}
                    onChange={(e) =>
                      patch({
                        patients: draft.patients.map((row) =>
                          row.id === p.id
                            ? { ...row, injuries: e.target.value }
                            : row,
                        ),
                      })
                    }
                  />
                </label>
              </div>
            ))}
          </div>
          <button
            disabled={readOnly}
            onClick={() =>
              patch({
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
        </section>
      )}

      {caps.dossiers && (
        <section className="prepare-block">
          <h3>{t("prep.people.dossiers")}</h3>
          <DossierEditor
            dossiers={draft.dossiers}
            onChange={(dossiers) => patch({ dossiers })}
          />
        </section>
      )}
    </section>
  );
}
