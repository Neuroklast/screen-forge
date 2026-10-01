import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  propKinds,
  propSchema,
  type Scenario,
  type TrainingStation,
} from "../../core/training";
import { labelFor } from "../../core/labels";
import { ordnanceTypes } from "../../core/ordnance";
import { t } from "../../i18n";
import { PresentationFields } from "../PresentationFields";
import { devicePresets, devicePresetsFor, presetLabel } from "./devicePresets";
import { buildDevice, uid, type PrepareSectionProps } from "./shared";

const CODE_MODULES = ["countdown", "access", "lock", "terminal"];

const PROP_KIND_LABELS: Record<string, string> = {
  ordnance: "prop.kind.ordnance",
  beacon: "prop.kind.beacon",
  payload: "prop.kind.payload",
  keycard: "prop.kind.keycard",
  custom: "prop.kind.custom",
};

type DevicesSectionProps = PrepareSectionProps & {
  presence: Record<string, { online: boolean; lastSeen: number }>;
  online: boolean;
  invitation: {
    token: string;
    station: string;
    role: "hq" | "element";
    expires: number;
  } | null;
  onProvision: (station: string) => void;
  onRevoke: (station: string) => void;
  publicOrigin: string;
  setPublicOrigin: (v: string) => void;
  invitationUrl: string;
  onNotice: (message: string) => void;
};

// Devices: the equipment of the scenario. Stations stay the storage format;
// the UI assigns devices to participants, teams or a scenario task.
export function DevicesSection({
  draft,
  change,
  readOnly,
  caps,
  presence,
  online,
  invitation,
  onProvision,
  onRevoke,
  publicOrigin,
  setPublicOrigin,
  invitationUrl,
  onNotice,
}: DevicesSectionProps) {
  const patch = (s: Partial<Scenario>) => change({ ...draft, ...s });
  const [presetId, setPresetId] = useState(devicePresets[0].id);
  const [owner, setOwner] = useState("scenario");
  const presets = devicePresetsFor(caps);
  const teams = draft.teams;
  const participants = draft.stations.filter((st) => st.player);
  // Ownership is only offered when it can be meaningful; otherwise the device
  // is a scenario task by definition.
  const hasOwnershipOptions =
    caps.teams &&
    (teams.length > 0 || participants.some((row) => row.team !== ""));

  const ownerOf = (st: TrainingStation): string => {
    if (st.player) return "participant";
    if (teams.some((team) => team.id === st.team)) return st.team;
    const participant = participants.find(
      (row) => row.team !== "" && row.team === st.team,
    );
    if (participant) return `participant:${participant.id}`;
    return "scenario";
  };

  const assignOwner = (st: TrainingStation, value: string) => {
    let team = "";
    if (value.startsWith("participant:")) {
      const participant = draft.stations.find(
        (row) => row.id === value.slice("participant:".length),
      );
      team = participant?.team ?? "";
    } else if (value !== "scenario") {
      team = value;
    }
    patch({
      stations: draft.stations.map((row) =>
        row.id === st.id ? { ...row, team } : row,
      ),
    });
  };

  const addDevice = () => {
    const preset =
      presets.find((p) => p.id === presetId) ?? presets[0];
    if (!preset) return;
    let team = "";
    if (owner.startsWith("participant:")) {
      const participant = draft.stations.find(
        (row) => row.id === owner.slice("participant:".length),
      );
      team = participant?.team ?? "";
    } else if (owner !== "scenario") {
      team = owner;
    }
    const { station, props, patients } = buildDevice(draft, preset);
    patch({
      stations: [...draft.stations, { ...station, team }],
      props,
      patients,
    });
  };

  const patchStation = (id: string, next: Partial<TrainingStation>) =>
    patch({
      stations: draft.stations.map((st) =>
        st.id === id ? { ...st, ...next } : st,
      ),
    });

  return (
    <section className="panel prepare">
      <h2>{t("prep.tab.devices")}</h2>

      <section className="prepare-block">
        <h3>{t("prep.devices.add")}</h3>
        <div className="prepare-row">
          <label>
            {t("prep.devices.preset")}
            <select
              value={presetId}
              disabled={readOnly}
              onChange={(e) => setPresetId(e.target.value)}
            >
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {t(preset.labelKey)}
                </option>
              ))}
            </select>
          </label>
          {hasOwnershipOptions && (
            <label>
              {t("prep.devices.owner")}
              <select
                value={owner}
                disabled={readOnly}
                onChange={(e) => setOwner(e.target.value)}
              >
                <option value="scenario">
                  {t("prep.devices.ownerScenario")}
                </option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
                {participants
                  .filter((row) => row.team !== "")
                  .map((row) => (
                    <option key={row.id} value={`participant:${row.id}`}>
                      {row.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <button disabled={readOnly} onClick={addDevice}>
            {t("prep.devices.add")}
          </button>
        </div>
      </section>

      <div className="prepare-list">
        {draft.stations.map((st) => (
          <article className="prepare-device" key={st.id}>
            <header>
              <strong>{st.name}</strong>
              <span className="eyebrow">
                {t(presetLabel(st.module))}
                {st.player ? ` · ${t("prep.people.participants")}` : ""}
              </span>
              <button
                disabled={readOnly}
                onClick={() =>
                  patch({
                    stations: draft.stations.filter((row) => row.id !== st.id),
                  })
                }
              >
                {t("prep.devices.remove")}
              </button>
            </header>
            <div className="prepare-device-grid">
              <label>
                {t("editor.name")}
                <input
                  value={st.name}
                  disabled={readOnly}
                  onChange={(e) =>
                    patchStation(st.id, { name: e.target.value })
                  }
                />
              </label>
              <label>
                {t("prep.devices.preset")}
                <select
                  value={st.module}
                  disabled={readOnly}
                  onChange={(e) =>
                    patchStation(st.id, {
                      module: e.target.value as TrainingStation["module"],
                    })
                  }
                >
                  {!presets.some((preset) => preset.module === st.module) && (
                    <option value={st.module}>{t(presetLabel(st.module))}</option>
                  )}
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.module}>
                      {t(preset.labelKey)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("prep.devices.role")}
                <select
                  value={st.role}
                  disabled={readOnly}
                  onChange={(e) => {
                    const role = e.target.value as "hq" | "element";
                    patchStation(st.id, {
                      role,
                      module: role === "hq" ? "tracking" : st.module,
                      player: role === "hq" ? false : st.player,
                    });
                  }}
                >
                  <option value="element">{t("prep.devices.roleField")}</option>
                  <option value="hq">{t("prep.devices.roleHq")}</option>
                </select>
              </label>
              {st.role === "element" && !st.player && (
                hasOwnershipOptions ? (
                  <label>
                    {t("prep.devices.owner")}
                    <select
                      value={ownerOf(st)}
                      disabled={readOnly}
                      onChange={(e) => assignOwner(st, e.target.value)}
                    >
                      <option value="scenario">
                        {t("prep.devices.ownerScenario")}
                      </option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                      {participants
                        .filter((row) => row.team !== "")
                        .map((row) => (
                          <option key={row.id} value={`participant:${row.id}`}>
                            {row.name}
                          </option>
                        ))}
                    </select>
                  </label>
                ) : (
                  <p className="prepare-hint">
                    {t("prep.devices.owner")}:{" "}
                    {t("prep.devices.ownerScenario")}
                  </p>
                )
              )}
              {caps.patients && st.module === "medical" && (
                <label>
                  {t("cap.patients")}
                  <select
                    value={st.bindings.patient}
                    disabled={readOnly}
                    onChange={(e) =>
                      patchStation(st.id, {
                        bindings: { ...st.bindings, patient: e.target.value },
                      })
                    }
                  >
                    <option value="">{t("prep.devices.bindingNone")}</option>
                    {draft.patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {caps.props && st.module === "ordnance" && (
                <label>
                  {t("cap.props")}
                  <select
                    value={st.bindings.prop}
                    disabled={readOnly}
                    onChange={(e) =>
                      patchStation(st.id, {
                        bindings: { ...st.bindings, prop: e.target.value },
                      })
                    }
                  >
                    <option value="">{t("prep.devices.bindingNone")}</option>
                    {draft.props
                      .filter((p) => p.kind === "ordnance")
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              {caps.props && st.module === "beacon" && (
                <label>
                  {t("cap.props")}
                  <select
                    value={st.bindings.prop}
                    disabled={readOnly}
                    onChange={(e) =>
                      patchStation(st.id, {
                        bindings: { ...st.bindings, prop: e.target.value },
                      })
                    }
                  >
                    <option value="">{t("prep.devices.bindingNone")}</option>
                    {draft.props
                      .filter((p) => p.kind === "beacon")
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              {CODE_MODULES.includes(st.module) && (
                <>
                  <label>
                    {t("prep.devices.duration")}
                    <input
                      type="number"
                      value={st.duration}
                      disabled={readOnly}
                      onChange={(e) =>
                        patchStation(st.id, { duration: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    {t("prep.devices.code")}
                    <input
                      inputMode="numeric"
                      value={st.code}
                      disabled={readOnly}
                      onChange={(e) => {
                        if (/^\d{0,12}$/.test(e.target.value))
                          patchStation(st.id, { code: e.target.value });
                      }}
                    />
                  </label>
                </>
              )}
            </div>
            <details className="prepare-advanced">
              <summary>{t("presentation.heading")}</summary>
              <PresentationFields
                station={st}
                readOnly={readOnly}
                hideLegend
                onChange={(presentation) =>
                  patchStation(st.id, { presentation })
                }
              />
            </details>
          </article>
        ))}
      </div>

      {caps.props && (
        <section className="prepare-block">
          <h3>{t("prep.devices.props")}</h3>
          <div className="prepare-list">
            {draft.props.map((prop) => (
              <div className="prepare-person" key={prop.id}>
                <header>
                  <span>{t("prep.devices.props")}</span>
                  <button
                    disabled={readOnly}
                    onClick={() =>
                      patch({
                        props: draft.props.filter((row) => row.id !== prop.id),
                      })
                    }
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
                      onChange={(e) =>
                        patch({
                          props: draft.props.map((row) =>
                            row.id === prop.id
                              ? {
                                  ...row,
                                  kind: e.target.value as typeof prop.kind,
                                }
                              : row,
                          ),
                        })
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
                        onChange={(e) =>
                          patch({
                            props: draft.props.map((row) =>
                              row.id === prop.id
                                ? { ...row, ordnanceId: e.target.value }
                                : row,
                            ),
                          })
                        }
                      >
                        <option value="">{t("prep.devices.bindingNone")}</option>
                        {[...ordnanceTypes(), ...draft.ordnanceTypes].map((o) => (
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
                      onChange={(e) =>
                        patch({
                          props: draft.props.map((row) =>
                            row.id === prop.id
                              ? { ...row, name: e.target.value }
                              : row,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    {t("prep.devices.propStates")}
                    <input
                      value={prop.states.join(", ")}
                      disabled={readOnly}
                      onChange={(e) => {
                        const states = e.target.value
                          .split(",")
                          .map((v) => v.trim())
                          .filter(Boolean)
                          .slice(0, 20);
                        if (!states.length) return;
                        patch({
                          props: draft.props.map((row) =>
                            row.id === prop.id
                              ? {
                                  ...row,
                                  states,
                                  initial: states.includes(row.initial)
                                    ? row.initial
                                    : states[0],
                                }
                              : row,
                          ),
                        });
                      }}
                    />
                  </label>
                  <label>
                    {t("prep.devices.propInitial")}
                    <select
                      value={prop.initial}
                      disabled={readOnly}
                      onChange={(e) =>
                        patch({
                          props: draft.props.map((row) =>
                            row.id === prop.id
                              ? { ...row, initial: e.target.value }
                              : row,
                          ),
                        })
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
          <button
            disabled={readOnly}
            onClick={() =>
              patch({
                props: [
                  ...draft.props,
                  propSchema.parse({
                    id: uid("prop"),
                    kind: "custom",
                    name: t("prep.devices.propName", {
                      n: draft.props.length + 1,
                    }),
                  }),
                ],
              })
            }
          >
            {t("prep.devices.addProp")}
          </button>
        </section>
      )}

      <details className="prepare-advanced" open>
        <summary>{t("trainer.prepare")}</summary>
        <p className="prepare-hint">{t("trainer.qrNote")}</p>
        <label>
          {t("trainer.address")}
          <input
            value={publicOrigin}
            onChange={(e) => setPublicOrigin(e.target.value)}
          />
        </label>
        <p className="muted">{t("trainer.httpsNote")}</p>
        <div className="device-grid">
          {draft.stations.map((st) => (
            <article key={st.id} className="device-card">
              <span className="eyebrow">
                {st.role === "hq"
                  ? t("prep.devices.roleHq")
                  : t("prep.devices.roleField")}{" "}
                / {t(presetLabel(st.module))}
              </span>
              <h3>{st.name}</h3>
              <p>
                {presence[st.id]?.online
                  ? t("trainer.connected")
                  : t("trainer.notConnected")}{" "}
                · {st.team || t("prep.devices.unassigned")}
              </p>
              <small>
                {st.bindings.patient
                  ? `${t("trainer.dataSource")}: ${st.bindings.patient}`
                  : st.id}
              </small>
              <div className="button-row">
                <button disabled={!online} onClick={() => onProvision(st.id)}>
                  {t("trainer.showQr")}
                </button>
                <button disabled={!online} onClick={() => onRevoke(st.id)}>
                  {t("trainer.revoke")}
                </button>
              </div>
            </article>
          ))}
        </div>
        {invitation && invitationUrl && (
          <section className="qr-panel" aria-label={t("trainer.assignment")}>
            <h3>
              {draft.stations.find((st) => st.id === invitation.station)?.name}
            </h3>
            <QRCodeSVG
              value={invitationUrl}
              size={240}
              marginSize={4}
              level="M"
            />
            <p>
              {t("trainer.validUntil")}{" "}
              {new Date(invitation.expires).toLocaleTimeString()}
            </p>
            <a href={invitationUrl} target="_blank" rel="noreferrer">
              {t("trainer.openLink")}
            </a>
            <button
              onClick={() =>
                void navigator.clipboard
                  .writeText(invitationUrl)
                  .then(() => onNotice(t("trainer.linkCopied")))
                  .catch(() => onNotice(invitationUrl))
              }
            >
              {t("trainer.copyLink")}
            </button>
          </section>
        )}
      </details>
    </section>
  );
}
