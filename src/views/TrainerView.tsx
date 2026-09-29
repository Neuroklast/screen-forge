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
    [gallery, setGallery] = useState(false);
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
  const save = (s = draft) => {
    const result = scenarioSchema.safeParse(s);
    if (!result.success) {
      setMessage(result.error.issues.map((i) => i.message).join(" · "));
      return false;
    }
    if (ex.send({ type: "configure", scenario: result.data, revision })) {
      setMessage("Szenario an Server gesendet.");
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
      setMessage("Szenario gespeichert.");
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
      <header className="training-header">
        <a href="/">SCREENFORGE</a>
        <div>
          <span className="eyebrow">EXERCISE CONTROL · {room}</span>
          <h1>{ex.state.scenario.name}</h1>
        </div>
        <span className={ex.online ? "status-up" : "status-down"}>
          {ex.online ? "Verbunden" : "Offline"}
        </span>
        <div className="training-clock">
          {Math.floor(ex.state.clock / 60)
            .toString()
            .padStart(2, "0")}
          :
          {Math.floor(ex.state.clock % 60)
            .toString()
            .padStart(2, "0")}
          <small>{ex.state.frozen ? "PAUSIERT" : "LÄUFT"}</small>
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
          {ex.state.frozen ? "Übung starten" : "Pausieren"}
        </button>
        <button
          disabled={!ex.online}
          onClick={() => {
            if (
              confirm(
                "Durchgang zurücksetzen? Laufzeit, Ereignisse und Fortschritt werden auf den gespeicherten Anfangszustand gesetzt.",
              )
            )
              ex.send({ type: "transport", command: "reset" });
          }}
        >
          Reset
        </button>
      </header>
      <nav className="training-nav">
        {[
          ["home", "Übersicht"],
          ["devices", "Geräte vorbereiten"],
          ["live", "Live-Steuerung"],
          ["editor", "Szenario bearbeiten"],
          ["dossiers", "Personalakten"],
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
            else setMessage("Bitte die laufende Übung zuerst pausieren.");
          }}
        >
          Geführte Einrichtung
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
          Ungespeicherter Entwurf. Zum Speichern muss die Übung pausiert sein.{" "}
          <button
            disabled={!ex.state.frozen || !ex.online}
            onClick={() => save()}
          >
            Szenario speichern
          </button>
          <button
            onClick={() => {
              setDraft(structuredClone(ex.state.scenario));
              setRevision(ex.state.revision);
              setDirty(false);
            }}
          >
            Entwurf verwerfen
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
                <span className="eyebrow">
                  VORBEREITEN · VERBINDEN · DURCHFÜHREN
                </span>
                <h2>Was möchtest du als Nächstes tun?</h2>
                <div className="template-grid">
                  <button
                    onClick={() => setWizard(true)}
                    disabled={!ex.state.frozen}
                  >
                    <strong>Neues Szenario erstellen</strong>
                    <span>
                      Fünf kurze Schritte von der Vorlage bis zur Geräteausgabe.
                    </span>
                  </button>
                  <button onClick={() => setGallery(true)} disabled={!ex.state.frozen}>
                    <strong>Vorlage laden</strong>
                    <span>Baukasten mit einer fertigen Vorlage starten.</span>
                  </button>
                  <button onClick={() => setTab("devices")}>
                    <strong>Vorbereitetes Szenario starten</strong>
                    <span>
                      Geräte verbinden und Einsatzbereitschaft prüfen.
                    </span>
                  </button>
                  <label className="import-card">
                    <strong>Szenario importieren</strong>
                    <span>Gespeicherte Vorlage wiederverwenden.</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          if (file.size > 10000000)
                            throw new Error("Datei zu groß");
                          change(
                            scenarioSchema.parse(JSON.parse(await file.text())),
                          );
                          setTab("editor");
                        } catch (e) {
                          setMessage(
                            `Import nicht übernommen: ${(e as Error).message}`,
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
                  <span>Geräte verbunden</span>
                </div>
                <div>
                  <b>{ex.state.scenario.mode}</b>
                  <span>Datenquelle</span>
                </div>
                <div>
                  <b>
                    {ex.state.completed.length} /{" "}
                    {ex.state.scenario.objectives.length}
                  </b>
                  <span>Ziele abgeschlossen</span>
                </div>
              </div>
              <div className="training-columns">
                <TacticalMap />
                <section className="panel">
                  <h2>Ablaufprotokoll</h2>
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
                    Protokoll exportieren
                  </button>
                </section>
              </div>
            </>
          )}
          {tab === "devices" && (
            <section className="panel">
              <h2>Geräte vorbereiten</h2>
              <p>
                QR-Code einmalig einlösen. Er ist zehn Minuten gültig und
                ersetzt die bisherige Gerätezuweisung erst beim Einlösen. HQ
                kann keine Traineraktionen ausführen.
              </p>
              <label>
                Adresse, die die Geräte erreichen können
                <input
                  value={publicOrigin}
                  onChange={(e) => setPublicOrigin(e.target.value)}
                />
              </label>
              <p className="muted">
                Für Kamera und GPS ist HTTPS nötig. localhost funktioniert nur
                auf diesem Rechner. Bereite jedes Tablet mit der Systemkamera
                vor und öffne den QR-Link.
              </p>
              <div className="device-grid">
                {ex.state.scenario.stations.map((s) => (
                  <article key={s.id} className="device-card">
                    <span className="eyebrow">
                      {s.role} / {s.module}
                    </span>
                    <h3>{s.name}</h3>
                    <p>
                      {ex.state.presence[s.id]?.online
                        ? "Verbunden"
                        : "Nicht verbunden"}{" "}
                      · {s.team}
                    </p>
                    <small>
                      {s.bindings.patient ? `Datenquelle: ${s.bindings.patient}` : s.id}
                    </small>
                    <div className="button-row">
                      <button
                        disabled={!ex.online}
                        onClick={() =>
                          ex.send({ type: "provision", station: s.id })
                        }
                      >
                        QR-Code anzeigen
                      </button>
                      <button
                        disabled={!ex.online}
                        onClick={() =>
                          ex.send({ type: "revoke", station: s.id })
                        }
                      >
                        Zugang widerrufen
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {ex.invitation && invitationUrl && (
                <section className="qr-panel" aria-label="Gerätezuweisung">
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
                    Gültig bis{" "}
                    {new Date(ex.invitation.expires).toLocaleTimeString()}
                  </p>
                  <a href={invitationUrl} target="_blank" rel="noreferrer">
                    Gerätelink öffnen
                  </a>
                  <button
                    onClick={() =>
                      void navigator.clipboard
                        .writeText(invitationUrl)
                        .then(() => setMessage("Gerätelink kopiert."))
                        .catch(() => setMessage(invitationUrl))
                    }
                  >
                    Link kopieren
                  </button>
                </section>
              )}
              <h3>Bereitschaft prüfen</h3>
              <ul>
                <li>Alle vorgesehenen Geräte verbunden?</li>
                <li>
                  GPS und Kamera auf den betreffenden Geräten freigegeben?
                </li>
                <li>
                  Rollen, Patientenzuordnung und aktive Shunt-Codes
                  kontrolliert?
                </li>
                <li>
                  Startsignal und Abbruchsignal mit allen Teilnehmenden
                  vereinbart?
                </li>
              </ul>
              <button
                className="primary"
                disabled={!ex.online || dirty || !ex.state.frozen}
                onClick={() => {
                  ex.send({ type: "transport", command: "play" });
                  setTab("live");
                }}
              >
                Übung starten
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
                <h2>Verdeckte Ereignisse</h2>
                <ul className="event-log">
                  {ex.state.scenario.injects.map((r) => (
                    <li key={r.id}>
                      <span>{r.name}</span>
                      <b>
                        {!r.enabled
                          ? "Inaktiv"
                          : ex.state.fired.includes(r.id)
                            ? "Verarbeitet"
                            : r.trigger === "timer"
                              ? `Bei ${dueAt(r, ex.state.scenario.seed).toFixed(0)} s`
                              : r.trigger}
                      </b>
                    </li>
                  ))}
                </ul>
                <h3>Freigaben und Signalstörungen</h3>
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
                        {d.name} freigeben
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
                          ? "Signal wiederherstellen"
                          : "Signal unterbrechen"}
                      </button>
                    ))}
                </div>
              </section>
            </>
          )}
          {tab === "editor" && (
            <>
              <section className="panel form-grid">
                <label>
                  Szenarioname
                  <input
                    value={draft.name}
                    onChange={(e) => change({ ...draft, name: e.target.value })}
                  />
                </label>
                <label>
                  Datenquelle
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
                  Vorlage exportieren
                </button>
              </section>
              <div className="editor-mode">
                <button
                  className={editorMode === "builder" ? "active" : ""}
                  onClick={() => setEditorMode("builder")}
                >
                  Baukasten
                </button>
                <button
                  className={editorMode === "classic" ? "active" : ""}
                  onClick={() => setEditorMode("classic")}
                >
                  Klassisch
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
