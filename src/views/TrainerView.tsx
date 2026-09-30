import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useTraining } from "../core/useExercise";
import { scenarioSchema, dueAt, type Scenario } from "../core/training";
import { stationUrl } from "../core/session";
import { ScenarioWizard } from "../training/ScenarioWizard";
import { ScenarioEditor } from "../training/ScenarioEditor";
import { MissionBuilder } from "../builder/MissionBuilder";
import { DossierEditor } from "../training/Dossiers";
import { TacticalMap } from "../training/TacticalMap";
import { PatientControl } from "../training/PatientControl";
import { TemplateGallery } from "../training/TemplateGallery";
import { MelTimeline } from "../training/MelTimeline";
import { briefingFilename, missionBriefing } from "../core/briefing";
import { t } from "../i18n";
import "../training/roles.css";
export function TrainerView({ room }: { room: string }) {
  const ex = useTraining(),
    [tab, setTab] = useState("home"),
    [wizard, setWizard] = useState(false),
    [draft, setDraft] = useState<Scenario>(() =>
      structuredClone(ex.state.scenario),
    ),
    [dirty, setDirty] = useState(false),
    [revision, setRevision] = useState(ex.state.revision),
    [message, setMessage] = useState(""),
    [publicOrigin, setPublicOrigin] = useState(location.origin),
    [editorMode, setEditorMode] = useState<"builder" | "classic">("builder"),
    [gallery, setGallery] = useState(false),
    [msgTo, setMsgTo] = useState("all"),
    [msgText, setMsgText] = useState("");
  useEffect(() => {
    if (!dirty) {
      setDraft(structuredClone(ex.state.scenario));
      setRevision(ex.state.revision);
    }
  }, [ex.state.revision, dirty]);
  const change = (s: Scenario) => {
    setDraft(s);
    setDirty(true);
  };
  const briefingText = missionBriefing(draft, {
    date: `${new Date().toISOString().slice(0, 16).replace("T", " ")}Z`,
  });
  const save = (s = draft) => {
    const result = scenarioSchema.safeParse(s);
    if (!result.success) {
      setMessage(result.error.issues.map((i) => i.message).join(" · "));
      return false;
    }
    if (ex.send({ type: "configure", scenario: result.data, revision })) {
      setMessage(t("trainer.sent"));
      return true;
    }
    return false;
  };
  const exportJson = (value: unknown, filename: string) => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  useEffect(() => {
    if (ex.savedRevision >= 0) {
      setDirty(false);
      setMessage(t("trainer.saved"));
    }
  }, [ex.savedRevision]);
  const connected = Object.values(ex.state.presence).filter(
    (p) => p.online,
  ).length;
  let invitationUrl = "";
  try {
    const origin = new URL(publicOrigin);
    if (!["http:", "https:"].includes(origin.protocol)) throw new Error();
    if (ex.invitation)
      invitationUrl =
        stationUrl(
          origin.origin,
          room,
          ex.invitation.role,
          ex.invitation.station,
        ) + `#invite=${ex.invitation.token}`;
  } catch {
    /* validation below */
  }
  return (
    <main className="training-app">
      {ex.state.phase === "aborted" && (
        <div className="abort-banner" role="alert">
          {t("common.aborted")}
        </div>
      )}
      <header className="training-header">
        <a href="/">SCREENFORGE</a>
        <div>
          <span className="eyebrow">EXERCISE CONTROL · {room}</span>
          <h1>{ex.state.scenario.name}</h1>
        </div>
        <span className={ex.online ? "status-up" : "status-down"}>
          {t(ex.online ? "trainer.connected" : "trainer.offline")}
        </span>
        <div className="training-clock">
          {Math.floor(ex.state.clock / 60)
            .toString()
            .padStart(2, "0")}
          :
          {Math.floor(ex.state.clock % 60)
            .toString()
            .padStart(2, "0")}
          <small>{t(ex.state.frozen ? "common.paused" : "trainer.running")}</small>
        </div>
        <button
          disabled={!ex.online || dirty}
          className="primary"
          onClick={() =>
            ex.send({
              type: "transport",
              command: ex.state.frozen ? "play" : "pause",
            })
          }
        >
          {t(ex.state.frozen ? "trainer.start" : "trainer.pause")}
        </button>
        <button
          disabled={!ex.online}
          onClick={() => {
            if (
              confirm(
                t("trainer.resetConfirm"),
              )
            )
              ex.send({ type: "transport", command: "reset" });
          }}
        >
          {t("trainer.reset")}
        </button>
        <button
          className="danger"
          disabled={!ex.online || ex.state.phase === "aborted"}
          onClick={() => ex.send({ type: "abort" })}
        >
          {t("trainer.abort")}
        </button>
      </header>
      <nav className="training-nav">
        {[
          ["home", t("trainer.tab.home")],
          ["devices", t("trainer.tab.devices")],
          ["live", t("trainer.tab.live")],
          ["editor", t("trainer.tab.editor")],
          ["briefing", t("trainer.tab.briefing")],
          ["dossiers", t("trainer.tab.dossiers")],
        ].map(([id, name]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {name}
          </button>
        ))}
        <button
          onClick={() => {
            if (ex.state.frozen) setWizard(true);
            else setMessage(t("trainer.pauseFirst"));
          }}
        >
          {t("trainer.guided")}
        </button>
      </nav>
      {message && (
        <p className="notice" role="status">
          {message}
          <button onClick={() => setMessage("")}>×</button>
        </p>
      )}
      {dirty && (
        <p className="notice">
          {t("trainer.unsaved")}{" "}
          <button
            disabled={!ex.state.frozen || !ex.online}
            onClick={() => save()}
          >
            {t("trainer.saveScenario")}
          </button>
          <button
            onClick={() => {
              setDraft(structuredClone(ex.state.scenario));
              setRevision(ex.state.revision);
              setDirty(false);
            }}
          >
            {t("trainer.discardDraft")}
          </button>
        </p>
      )}
      {wizard ? (
        <ScenarioWizard
          onClose={() => setWizard(false)}
          onSave={(s) => {
            if (save(s)) {
              setWizard(false);
              setTab("devices");
            }
          }}
        />
      ) : (
        <>
          {tab === "home" && (
            <>
              <section className="panel welcome">
                <span className="eyebrow">{t("trainer.home.eyebrow")}</span>
                <h2>{t("trainer.home.title")}</h2>
                <div className="template-grid">
                  <button
                    onClick={() => setWizard(true)}
                    disabled={!ex.state.frozen}
                  >
                    <strong>{t("trainer.home.newScenario")}</strong>
                    <span>{t("trainer.home.newScenarioDesc")}</span>
                  </button>
                  <button onClick={() => setGallery(true)} disabled={!ex.state.frozen}>
                    <strong>{t("trainer.home.loadTemplate")}</strong>
                    <span>{t("trainer.home.loadTemplateDesc")}</span>
                  </button>
                  <button onClick={() => setTab("briefing")}>
                    <strong>{t("trainer.home.briefing")}</strong>
                    <span>{t("trainer.home.briefingDesc")}</span>
                  </button>
                  <button onClick={() => setTab("devices")}>
                    <strong>{t("trainer.home.prepared")}</strong>
                    <span>{t("trainer.home.preparedDesc")}</span>
                  </button>
                  <label className="import-card">
                    <strong>{t("trainer.home.import")}</strong>
                    <span>{t("trainer.home.importDesc")}</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          if (file.size > 10000000)
                            throw new Error(t("trainer.fileTooBig"));
                          change(
                            scenarioSchema.parse(JSON.parse(await file.text())),
                          );
                          setTab("editor");
                        } catch (e) {
                          setMessage(
                            t("trainer.importFailed", {
                              message: (e as Error).message,
                            }),
                          );
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </section>
              {gallery && (
                <TemplateGallery
                  onClose={() => setGallery(false)}
                  onSelect={(s) => {
                    change(s);
                    setGallery(false);
                    setTab("editor");
                  }}
                />
              )}
              <div className="summary-grid">
                <div>
                  <b>
                    {connected} / {ex.state.scenario.stations.length}
                  </b>
                  <span>{t("trainer.devicesConnected")}</span>
                </div>
                <div>
                  <b>{ex.state.scenario.mode}</b>
                  <span>{t("trainer.dataSource")}</span>
                </div>
                <div>
                  <b>
                    {ex.state.completed.length} /{" "}
                    {ex.state.scenario.objectives.length}
                  </b>
                  <span>{t("trainer.objectivesDone")}</span>
                </div>
              </div>
              <div className="training-columns">
                <TacticalMap />
                <section className="panel">
                  <h2>{t("trainer.log")}</h2>
                  <ol className="event-log">
                    {ex.state.log
                      .slice(-30)
                      .reverse()
                      .map((e, i) => (
                        <li key={i}>
                          <time>{e.at.toFixed(1)}s</time>
                          {e.message}
                        </li>
                      ))}
                  </ol>
                  <button
                    onClick={() =>
                      exportJson(
                        { scenario: ex.state.scenario.name, log: ex.state.log },
                        "screenforge-debrief.json",
                      )
                    }
                  >
                    {t("trainer.exportLog")}
                  </button>
                  <button
                    onClick={() => {
                      const rows = [
                        ["time", "message"],
                        ...ex.state.log.map((e) => [
                          e.at.toFixed(1),
                          e.message.replace(/"/g, '""'),
                        ]),
                      ];
                      const csv = rows
                        .map((r) => r.map((c) => `"${c}"`).join(","))
                        .join("\n");
                      const url = URL.createObjectURL(
                        new Blob([csv], { type: "text/csv" }),
                      );
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "screenforge-debrief.csv";
                      a.click();
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                    }}
                  >
                    {t("trainer.exportCsv")}
                  </button>
                </section>
              </div>
            </>
          )}
          {tab === "devices" && (
            <section className="panel">
              <h2>{t("trainer.prepare")}</h2>
              <p>{t("trainer.qrNote")}</p>
              <label>
                {t("trainer.address")}
                <input
                  value={publicOrigin}
                  onChange={(e) => setPublicOrigin(e.target.value)}
                />
              </label>
              <p className="muted">{t("trainer.httpsNote")}</p>
              <div className="device-grid">
                {ex.state.scenario.stations.map((s) => (
                  <article key={s.id} className="device-card">
                    <span className="eyebrow">
                      {s.role} / {s.module}
                    </span>
                    <h3>{s.name}</h3>
                    <p>
                      {ex.state.presence[s.id]?.online
                        ? t("trainer.connected")
                        : t("trainer.notConnected")}{" "}
                      · {s.team}
                    </p>
                    <small>
                      {s.bindings.patient
                        ? `${t("trainer.dataSource")}: ${s.bindings.patient}`
                        : s.id}
                    </small>
                    <div className="button-row">
                      <button
                        disabled={!ex.online}
                        onClick={() =>
                          ex.send({ type: "provision", station: s.id })
                        }
                      >
                        {t("trainer.showQr")}
                      </button>
                      <button
                        disabled={!ex.online}
                        onClick={() =>
                          ex.send({ type: "revoke", station: s.id })
                        }
                      >
                        {t("trainer.revoke")}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {ex.invitation && invitationUrl && (
                <section className="qr-panel" aria-label={t("trainer.assignment")}>
                  <h3>
                    {
                      ex.state.scenario.stations.find(
                        (s) => s.id === ex.invitation?.station,
                      )?.name
                    }
                  </h3>
                  <QRCodeSVG
                    value={invitationUrl}
                    size={240}
                    marginSize={4}
                    level="M"
                  />
                  <p>
                    {t("trainer.validUntil")}{" "}
                    {new Date(ex.invitation.expires).toLocaleTimeString()}
                  </p>
                  <a href={invitationUrl} target="_blank" rel="noreferrer">
                    {t("trainer.openLink")}
                  </a>
                  <button
                    onClick={() =>
                      void navigator.clipboard
                        .writeText(invitationUrl)
                        .then(() => setMessage(t("trainer.linkCopied")))
                        .catch(() => setMessage(invitationUrl))
                    }
                  >
                    {t("trainer.copyLink")}
                  </button>
                </section>
              )}
              <h3>{t("trainer.readiness")}</h3>
              <ul>
                <li>{t("trainer.ready1")}</li>
                <li>{t("trainer.ready2")}</li>
                <li>{t("trainer.ready3")}</li>
                <li>{t("trainer.ready4")}</li>
              </ul>
              <button
                className="primary"
                disabled={!ex.online || dirty || !ex.state.frozen}
                onClick={() => {
                  ex.send({ type: "transport", command: "play" });
                  setTab("live");
                }}
              >
                {t("trainer.start")}
              </button>
            </section>
          )}
          {tab === "live" && (
            <>
              <div className="training-columns">
                {ex.state.scenario.patients.map((p) => (
                  <PatientControl key={p.id} patient={p} />
                ))}
              </div>
              <section className="panel">
                <h2>{t("trainer.hiddenEvents")}</h2>
                <ul className="event-log">
                  {ex.state.scenario.injects.map((r) => (
                    <li key={r.id}>
                      <span>{r.name}</span>
                      <b>
                        {!r.enabled
                          ? t("trainer.inactive")
                          : ex.state.fired.includes(r.id)
                            ? t("trainer.processed")
                            : r.trigger === "timer"
                              ? t("trainer.at", {
                                  seconds: dueAt(r, ex.state.scenario.seed).toFixed(0),
                                })
                              : r.trigger === "manual"
                                ? t("trainer.manual")
                                : r.trigger}
                      </b>
                      <button
                        disabled={
                          !ex.online ||
                          ex.state.frozen ||
                          !r.enabled ||
                          ex.state.fired.includes(r.id)
                        }
                        onClick={() => ex.send({ type: "fire", inject: r.id })}
                      >
                        {t("trainer.fire")}
                      </button>
                      <button
                        disabled={!ex.online || ex.state.frozen}
                        onClick={() =>
                          change({
                            ...draft,
                            injects: draft.injects.map((row) =>
                              row.id === r.id
                                ? { ...row, enabled: !row.enabled }
                                : row,
                            ),
                          })
                        }
                      >
                        {t(r.enabled ? "trainer.disable" : "trainer.enable")}
                      </button>
                      {[-300, -60, 60, 300].map((delta) => (
                        <button
                          key={delta}
                          disabled={
                            !ex.online ||
                            ex.state.frozen ||
                            ex.state.fired.includes(r.id)
                          }
                          onClick={() =>
                            ex.send({
                              type: "reschedule",
                              inject: r.id,
                              to: Math.max(
                                0,
                                dueAt(r, ex.state.scenario.seed) + delta,
                              ),
                              reason: "live",
                            })
                          }
                        >
                          {delta > 0 ? `+${delta / 60}` : delta / 60} min
                        </button>
                      ))}
                    </li>
                  ))}
                </ul>
                <h3>{t("trainer.releases")}</h3>
                <div className="button-row">
                  {ex.state.scenario.dossiers
                    .filter((d) => !d.released)
                    .map((d) => (
                      <button
                        key={d.id}
                        onClick={() =>
                          ex.send({
                            type: "action",
                            action: { type: "release", target: d.id },
                          })
                        }
                      >
                        {t("trainer.release", { name: d.name })}
                      </button>
                    ))}
                  {ex.state.scenario.stations
                    .filter((s) => s.module === "camera")
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() =>
                          ex.send({
                            type: "action",
                            action: {
                              type: "camera",
                              target: s.id,
                              offline: !ex.state.cameraOffline[s.id],
                            },
                          })
                        }
                      >
                        {s.name}:{" "}
                        {ex.state.cameraOffline[s.id]
                          ? t("trainer.restoreSignal")
                          : t("trainer.cutSignal")}
                      </button>
                    ))}
                </div>
              </section>
              <MelTimeline
                state={ex.state}
                onStartWorkflow={(id) =>
                  ex.send({ type: "workflow-start", workflow: id })
                }
              />
              <section className="panel">
                <h2>{t("trainer.sendMessage")}</h2>
                <div className="message-compose">
                  <select
                    aria-label={t("trainer.recipient")}
                    value={msgTo}
                    onChange={(e) => setMsgTo(e.target.value)}
                  >
                    <option value="all">{t("trainer.all")}</option>
                    <option value="hq">HQ</option>
                    {draft.stations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label={t("trainer.message")}
                    value={msgText}
                    maxLength={280}
                    placeholder={t("trainer.message")}
                    onChange={(e) => setMsgText(e.target.value)}
                  />
                  <button
                    disabled={!ex.online || !msgText.trim()}
                    onClick={() => {
                      if (
                        ex.send({ type: "message", to: msgTo, text: msgText })
                      )
                        setMsgText("");
                    }}
                  >
                    {t("trainer.send")}
                  </button>
                </div>
                <ul className="event-log">
                  {ex.state.messages
                    .slice(-8)
                    .reverse()
                    .map((m, i) => (
                      <li key={i}>
                        <time>{m.at.toFixed(1)}s</time>
                        {m.to}: {m.text}
                      </li>
                    ))}
                </ul>
              </section>
            </>
          )}
          {tab === "editor" && (
            <>
              <section className="panel form-grid">
                <label>
                  {t("trainer.scenarioName")}
                  <input
                    value={draft.name}
                    onChange={(e) => change({ ...draft, name: e.target.value })}
                  />
                </label>
                <label>
                  {t("trainer.dataSourceLabel")}
                  <select
                    value={draft.mode}
                    onChange={(e) =>
                      change({
                        ...draft,
                        mode: e.target.value as Scenario["mode"],
                      })
                    }
                  >
                    <option>LIVE</option>
                    <option>PLAYBACK</option>
                  </select>
                </label>
                <button
                  onClick={() => exportJson(draft, "screenforge-scenario.json")}
                >
                  {t("trainer.exportTemplate")}
                </button>
              </section>
              <div className="editor-mode">
                <button
                  className={editorMode === "builder" ? "active" : ""}
                  onClick={() => setEditorMode("builder")}
                >
                  {t("trainer.builder")}
                </button>
                <button
                  className={editorMode === "classic" ? "active" : ""}
                  onClick={() => setEditorMode("classic")}
                >
                  {t("trainer.classic")}
                </button>
              </div>
              {editorMode === "builder" ? (
                <MissionBuilder
                  draft={draft}
                  change={change}
                  readOnly={!ex.state.frozen}
                />
              ) : (
                <ScenarioEditor draft={draft} change={change} />
              )}
            </>
          )}
          {tab === "briefing" && (
            <section className="panel">
              <div className="button-row">
                <button
                  onClick={() => {
                    void navigator.clipboard
                      ?.writeText(briefingText)
                      .then(() => setMessage(t("trainer.briefingCopied")))
                      .catch(() => setMessage(t("trainer.copyFailed")));
                  }}
                >
                  {t("trainer.copy")}
                </button>
                <button
                  onClick={() => {
                    const url = URL.createObjectURL(
                      new Blob([briefingText], { type: "text/plain" }),
                    );
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = briefingFilename(draft);
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  }}
                >
                  {t("trainer.asFile")}
                </button>
              </div>
              <pre className="briefing-text">{briefingText}</pre>
            </section>
          )}
          {tab === "dossiers" && (
            <DossierEditor
              dossiers={draft.dossiers}
              onChange={(dossiers) => change({ ...draft, dossiers })}
            />
          )}
        </>
      )}
    </main>
  );
}
