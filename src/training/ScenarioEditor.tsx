import { useState } from "react";
import {
  moduleEvents,
  modules,
  stationSchema,
  patientSchema,
  injectSchema,
  type Scenario,
  type Action,
} from "../core/training";
import { PresentationFields } from "./PresentationFields";
import { t } from "../i18n";
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
export function ScenarioEditor({
  draft,
  change,
}: {
  draft: Scenario;
  change: (s: Scenario) => void;
}) {
  const [tab, setTab] = useState("devices");
  const patch = (s: Partial<Scenario>) => change({ ...draft, ...s });
  return (
    <section className="panel">
      <nav className="tab-bar">
        {[
          ["devices", t("editor.tab.devices")],
          ["patients", t("editor.tab.patients")],
          ["rules", t("editor.tab.rules")],
          ["area", t("editor.tab.area")],
        ].map(([id, name]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {name}
          </button>
        ))}
      </nav>
      {tab === "devices" && (
        <>
          <p>{t("editor.devicesNote")}</p>
          {draft.stations.map((st) => (
            <fieldset key={st.id} className="editor-row">
              <legend>{st.id}</legend>
              <label>
                {t("editor.name")}
                <input
                  value={st.name}
                  onChange={(e) =>
                    patch({
                      stations: draft.stations.map((s) =>
                        s.id === st.id ? { ...s, name: e.target.value } : s,
                      ),
                    })
                  }
                />
              </label>
              <label>
                {t("editor.role")}
                <select
                  value={st.role}
                  onChange={(e) =>
                    patch({
                      stations: draft.stations.map((s) =>
                        s.id === st.id
                          ? {
                              ...s,
                              role: e.target.value as "hq" | "element",
                              module:
                                e.target.value === "hq" ? "tracking" : s.module,
                            }
                          : s,
                      ),
                    })
                  }
                >
                  <option value="element">{t("editor.fieldDevice")}</option>
                  <option value="hq">HQ</option>
                </select>
              </label>
              <label>
                {t("editor.module")}
                <select
                  value={st.module}
                  onChange={(e) =>
                    patch({
                      stations: draft.stations.map((s) =>
                        s.id === st.id
                          ? {
                              ...s,
                              module: e.target.value as typeof s.module, bindings: { ...s.bindings, patient: e.target.value === "medical" ? draft.patients[0]?.id || "" : "" },
                            }
                          : s,
                      ),
                    })
                  }
                >
                  {modules.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
              {st.module === "medical" && (
                <label>
                  Patient
                  <select
                    value={st.bindings.patient}
                    onChange={(e) =>
                      patch({
                        stations: draft.stations.map((s) =>
                          s.id === st.id
                            ? { ...s, bindings: { ...s.bindings, patient: e.target.value } }
                            : s,
                        ),
                      })
                    }
                  >
                    {draft.patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Team
                <input
                  value={st.team}
                  onChange={(e) =>
                    patch({
                      stations: draft.stations.map((s) =>
                        s.id === st.id ? { ...s, team: e.target.value } : s,
                      ),
                    })
                  }
                />
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={st.player}
                  onChange={(e) =>
                    patch({
                      stations: draft.stations.map((s) =>
                        s.id === st.id ? { ...s, player: e.target.checked } : s,
                      ),
                    })
                  }
                />
                GPS-Spieler
              </label>
              {["countdown", "access", "lock"].includes(st.module) && (
                <>
                  <label>
                    Laufzeit (s)
                    <input
                      type="number"
                      value={st.duration}
                      onChange={(e) =>
                        patch({
                          stations: draft.stations.map((s) =>
                            s.id === st.id
                              ? { ...s, duration: Number(e.target.value) }
                              : s,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    Aktiver Shunt-Code
                    <input
                      inputMode="numeric"
                      value={st.code}
                      onChange={(e) =>
                        patch({
                          stations: draft.stations.map((s) =>
                            s.id === st.id ? { ...s, code: e.target.value } : s,
                          ),
                        })
                      }
                    />
                  </label>
                </>
              )}
              <PresentationFields
                station={st}
                onChange={(presentation) =>
                  patch({
                    stations: draft.stations.map((s) =>
                      s.id === st.id ? { ...s, presentation } : s,
                    ),
                  })
                }
              />
              <button
                onClick={() =>
                  patch({
                    stations: draft.stations.filter((s) => s.id !== st.id),
                  })
                }
              >
                Entfernen
              </button>
            </fieldset>
          ))}
          <button
            onClick={() =>
              patch({
                stations: [
                  ...draft.stations,
                  stationSchema.parse({
                    id: uid("station"),
                    name: t("editor.newStation"),
                    role: "element",
                    module: "medical", bindings: { patient: draft.patients[0]?.id || "" },
                  }),
                ],
              })
            }
          >
            {t("editor.addStation")}
          </button>
        </>
      )}
      {tab === "patients" && (
        <>
          {draft.patients.map((p) => (
            <fieldset key={p.id} className="editor-row">
              <legend>{p.id}</legend>
              <label>
                {t("editor.name")}
                <input
                  value={p.name}
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
                {t("editor.injuries")}
                <textarea
                  value={p.injuries}
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
              <button
                onClick={() =>
                  patch({
                    patients: draft.patients.filter((row) => row.id !== p.id),
                  })
                }
              >
                {t("editor.remove")}
              </button>
            </fieldset>
          ))}
          <button
            onClick={() =>
              patch({
                patients: [
                  ...draft.patients,
                  patientSchema.parse({
                    id: uid("patient"),
                    name: t("editor.newPatient"),
                    kind: "stable",
                    since: 0,
                  }),
                ],
              })
            }
          >
            {t("editor.addPatient")}
          </button>
        </>
      )}
      {tab === "rules" && (
        <>
          <p>{t("editor.rulesNote")}</p>
          {draft.injects.map((r) => {
            const set = (v: Partial<typeof r>) =>
              patch({
                injects: draft.injects.map((row) =>
                  row.id === r.id ? { ...row, ...v } : row,
                ),
              });
            return (
              <fieldset className="rule-editor" key={r.id}>
                <legend>{r.id}</legend>
                <div className="form-grid">
                  <label>
                    {t("editor.name")}
                    <input
                      value={r.name}
                      onChange={(e) => set({ name: e.target.value })}
                    />
                  </label>
                  <label>
                    {t("editor.trigger")}
                    <select
                      value={r.trigger}
                      onChange={(e) =>
                        set({
                          trigger: e.target.value as typeof r.trigger,
                          station:
                            draft.stations.find((s) => s.role === "element")
                              ?.id || "",
                          zone: draft.zones[0]?.id || "",
                        })
                      }
                    >
                      <option value="timer">{t("editor.triggerTime")}</option>
                      <option value="zone">{t("editor.triggerZone")}</option>
                      <option value="intervention">{t("editor.triggerIntervention")}</option>
                      <option value="prop">{t("editor.triggerProp")}</option>
                      <option value="signal">{t("editor.triggerSignal")}</option>
                    </select>
                  </label>
                  <label>
                    {t("editor.station")}
                    <select
                      value={r.station}
                      onChange={(e) => set({ station: e.target.value })}
                    >
                      <option value="">{t("editor.none")}</option>
                      {draft.stations
                        .filter((s) => s.role === "element")
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  {r.trigger === "timer" && (
                    <>
                      <label>
                        {t("editor.at")}
                        <input
                          type="number"
                          value={r.at}
                          onChange={(e) => set({ at: Number(e.target.value) })}
                        />
                      </label>
                      <label>
                        {t("editor.jitter")}
                        <input
                          type="number"
                          value={r.jitter}
                          onChange={(e) =>
                            set({ jitter: Number(e.target.value) })
                          }
                        />
                      </label>
                    </>
                  )}
                  {r.trigger === "zone" && (
                    <label>
                      Zone
                      <select
                        value={r.zone}
                        onChange={(e) => set({ zone: e.target.value })}
                      >
                        {draft.zones.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {r.trigger === "signal" && (
                    <label>
                      {t("editor.moduleAction")}
                      <select
                        value={r.intervention}
                        onChange={(e) => set({ intervention: e.target.value })}
                      >
                        <option value="">{t("editor.chooseAction")}</option>
                        {(
                          moduleEvents[
                            draft.stations.find((s) => s.id === r.station)
                              ?.module || ""
                          ] || []
                        ).map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  {r.trigger === "intervention" && (
                    <label>
                      {t("editor.treatment")}
                      <select
                        value={r.intervention}
                        onChange={(e) => set({ intervention: e.target.value })}
                      >
                        {["treated", "tourniquet", "oxygen", "evacuated"].map(
                          (v) => (
                            <option key={v}>{v}</option>
                          ),
                        )}
                      </select>
                    </label>
                  )}
                  <label>
                    {t("editor.unless")}
                    <select
                      value={r.unless}
                      onChange={(e) => set({ unless: e.target.value })}
                    >
                      <option value="">{t("editor.always")}</option>
                      {["treated", "tourniquet", "oxygen", "evacuated"].map(
                        (v) => (
                          <option key={v}>{v}</option>
                        ),
                      )}
                    </select>
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={r.enabled}
                      onChange={(e) => set({ enabled: e.target.checked })}
                    />
                    {t("editor.active")}
                  </label>
                </div>
                {r.actions.map((a, i) => (
                  <ActionEditor
                    key={i}
                    action={a}
                    scenario={draft}
                    onChange={(action) =>
                      set({
                        actions: r.actions.map((old, j) =>
                          i === j ? action : old,
                        ),
                      })
                    }
                    onRemove={() =>
                      set({ actions: r.actions.filter((_, j) => i !== j) })
                    }
                  />
                ))}
                <div className="button-row">
                  <button
                    onClick={() =>
                      set({
                        actions: [
                          ...r.actions,
                          { type: "message", text: t("editor.newMessage") },
                        ],
                      })
                    }
                  >
                    {t("editor.addFollowUp")}
                  </button>
                  <button
                    onClick={() =>
                      patch({
                        injects: draft.injects.filter((row) => row.id !== r.id),
                      })
                    }
                  >
                    {t("editor.removeEvent")}
                  </button>
                </div>
              </fieldset>
            );
          })}
          <button
            onClick={() =>
              patch({
                injects: [
                  ...draft.injects,
                  injectSchema.parse({
                    id: uid("event"),
                    name: t("editor.newEvent"),
                    trigger: "timer",
                    actions: [{ type: "message", text: t("editor.statusCheck") }],
                  }),
                ],
              })
            }
          >
            {t("editor.addEvent")}
          </button>
        </>
      )}
      {tab === "area" && (
        <>
          <div className="form-grid">
            {(["lat", "lng", "zoom"] as const).map((k) => (
              <label key={k}>
                {k}
                <input
                  type="number"
                  step="any"
                  value={draft.map[k]}
                  onChange={(e) =>
                    patch({
                      map: { ...draft.map, [k]: Number(e.target.value) },
                    })
                  }
                />
              </label>
            ))}
            <label>
              {t("editor.tiles")}
              <input
                value={draft.map.tiles}
                onChange={(e) =>
                  patch({ map: { ...draft.map, tiles: e.target.value } })
                }
              />
            </label>
            <label>
              {t("editor.attribution")}
              <input
                value={draft.map.attribution}
                onChange={(e) =>
                  patch({ map: { ...draft.map, attribution: e.target.value } })
                }
              />
            </label>
          </div>
          {draft.zones.map((z) => (
            <fieldset className="editor-row" key={z.id}>
              <legend>Zone {z.id}</legend>
              <input
                aria-label={t("editor.zoneName")}
                value={z.name}
                onChange={(e) =>
                  patch({
                    zones: draft.zones.map((v) =>
                      v.id === z.id ? { ...v, name: e.target.value } : v,
                    ),
                  })
                }
              />
              {(["lat", "lng", "radius"] as const).map((k) => (
                <label key={k}>
                  {k}
                  <input
                    type="number"
                    step="any"
                    value={z[k]}
                    onChange={(e) =>
                      patch({
                        zones: draft.zones.map((v) =>
                          v.id === z.id
                            ? { ...v, [k]: Number(e.target.value) }
                            : v,
                        ),
                      })
                    }
                  />
                </label>
              ))}
              <button
                onClick={() =>
                  patch({ zones: draft.zones.filter((v) => v.id !== z.id) })
                }
              >
                {t("editor.remove")}
              </button>
            </fieldset>
          ))}
          <button
            onClick={() =>
              patch({
                zones: [
                  ...draft.zones,
                  {
                    id: uid("zone"),
                    name: t("editor.newZone"),
                    lat: draft.map.lat,
                    lng: draft.map.lng,
                    radius: 100,
                  },
                ],
              })
            }
          >
            {t("editor.addZone")}
          </button>
          <h3>{t("editor.objectives")}</h3>
          {draft.objectives.map((o) => (
            <div className="button-row" key={o.id}>
              <input
                aria-label={t("editor.objective")}
                value={o.name}
                onChange={(e) =>
                  patch({
                    objectives: draft.objectives.map((v) =>
                      v.id === o.id ? { ...v, name: e.target.value } : v,
                    ),
                  })
                }
              />
              <button
                onClick={() =>
                  patch({
                    objectives: draft.objectives.filter((v) => v.id !== o.id),
                  })
                }
              >
                {t("editor.remove")}
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              patch({
                objectives: [
                  ...draft.objectives,
                  { id: uid("objective"), name: t("editor.newObjective") },
                ],
              })
            }
          >
            {t("editor.addObjective")}
          </button>
          <h3>{t("editor.routes")}</h3>
          {draft.stations
            .filter((s) => s.player)
            .map((st) => (
              <fieldset key={st.id}>
                <legend>{st.name}</legend>
                {st.route.map((p, i) => (
                  <div className="button-row" key={i}>
                    {(["lat", "lng"] as const).map((k) => (
                      <label key={k}>
                        {k}
                        <input
                          type="number"
                          step="any"
                          value={p[k]}
                          onChange={(e) =>
                            patch({
                              stations: draft.stations.map((s) =>
                                s.id === st.id
                                  ? {
                                      ...s,
                                      route: s.route.map((v, j) =>
                                        i === j
                                          ? {
                                              ...v,
                                              [k]: Number(e.target.value),
                                            }
                                          : v,
                                      ),
                                    }
                                  : s,
                              ),
                            })
                          }
                        />
                      </label>
                    ))}
                  </div>
                ))}
                <button
                  onClick={() =>
                    patch({
                      stations: draft.stations.map((s) =>
                        s.id === st.id
                          ? {
                              ...s,
                              route: [
                                ...s.route,
                                { lat: draft.map.lat, lng: draft.map.lng },
                              ],
                            }
                          : s,
                      ),
                    })
                  }
                >
                  {t("editor.addWaypoint")}
                </button>
              </fieldset>
            ))}
        </>
      )}
    </section>
  );
}
function ActionEditor({
  action: a,
  scenario: s,
  onChange,
  onRemove,
}: {
  action: Action;
  scenario: Scenario;
  onChange: (a: Action) => void;
  onRemove: () => void;
}) {
  const targets =
    a.type === "patient"
      ? s.patients
      : a.type === "release"
        ? s.dossiers
        : a.type === "objective"
          ? s.objectives
          : a.type === "camera"
            ? s.stations.filter((st) => st.module === "camera")
            : [];
  return (
    <div className="editor-row">
      <label>
        {t("editor.action")}
        <select
          value={a.type}
          onChange={(e) => {
            const type = e.target.value;
            onChange(
              type === "patient"
                ? { type, target: s.patients[0]?.id || "", kind: "desat" }
                : type === "release"
                  ? { type, target: s.dossiers[0]?.id || "" }
                  : type === "objective"
                    ? { type, target: s.objectives[0]?.id || "" }
                    : type === "camera"
                      ? {
                          type,
                          target:
                            s.stations.find((st) => st.module === "camera")
                              ?.id || "",
                          offline: true,
                        }
                      : { type: "message", text: t("editor.newMessage") },
            );
          }}
        >
          <option value="patient">{t("editor.actionPatient")}</option>
          <option value="release">{t("editor.actionRelease")}</option>
          <option value="camera">{t("editor.actionCamera")}</option>
          <option value="objective">{t("editor.actionObjective")}</option>
          <option value="message">{t("editor.actionMessage")}</option>
        </select>
      </label>
      {a.type !== "message" ? (
        <label>
          {t("editor.target")}
          <select
            value={a.target}
            onChange={(e) => onChange({ ...a, target: e.target.value })}
          >
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label>
          {t("editor.message")}
          <input
            value={a.text}
            onChange={(e) => onChange({ ...a, text: e.target.value })}
          />
        </label>
      )}
      {a.type === "patient" && (
        <select
          aria-label={t("editor.patientState")}
          value={a.kind}
          onChange={(e) =>
            onChange({ ...a, kind: e.target.value as typeof a.kind })
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
          ].map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      )}
      {a.type === "camera" && (
        <label className="check">
          <input
            type="checkbox"
            checked={a.offline}
            onChange={(e) => onChange({ ...a, offline: e.target.checked })}
          />
          {t("editor.signalLost")}
        </label>
      )}
      <button onClick={onRemove}>{t("editor.removeAction")}</button>
    </div>
  );
}
