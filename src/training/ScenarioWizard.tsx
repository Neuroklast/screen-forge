import { useState } from "react";
import { scenarioSchema, template, type Scenario } from "../core/training";
import { defaultDossiers } from "../core/dossiers";
export function ScenarioWizard({
  onSave,
  onClose,
}: {
  onSave: (s: Scenario) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0),
    [draft, setDraft] = useState(() => template("sar")),
    [error, setError] = useState("");
  const questions = [
    "Was möchtest du durchführen?",
    "Wo findet das Szenario statt?",
    "Welche Geräte und Teilnehmer brauchst du?",
    "Was soll währenddessen passieren?",
    "Ist alles bereit?",
  ];
  const update = (patch: Partial<Scenario>) =>
    setDraft((s) => ({ ...s, ...patch }));
  const choose = (kind: Parameters<typeof template>[0]) => {
    const s = template(kind);
    s.dossiers = defaultDossiers().map((d) => ({ ...d, released: false }));
    setDraft(s);
    setStep(1);
  };
  const next = () => {
    const result = scenarioSchema.safeParse(draft);
    if (!result.success) {
      setError(result.error.issues.map((i) => i.message).join(" · "));
      return;
    }
    setError("");
    if (step === 4) onSave(result.data);
    else setStep(step + 1);
  };
  return (
    <section className="wizard panel" aria-label="Geführte Szenarioeinrichtung">
      <div className="section-heading">
        <span className="eyebrow">GEFÜHRTE EINRICHTUNG · {step + 1} / 5</span>
        <button onClick={onClose}>Schließen</button>
      </div>
      <h2>{questions[step]}</h2>
      <ol className="wizard-steps">
        {["Zweck", "Gelände", "Geräte", "Ablauf", "Start"].map((name, i) => (
          <li key={name} className={i === step ? "active" : ""}>
            {i + 1}. {name}
          </li>
        ))}
      </ol>
      {step === 0 && (
        <div className="template-grid">
          {(["sar", "medical", "airsoft", "film"] as const).map((kind) => (
            <button key={kind} onClick={() => choose(kind)}>
              <strong>{template(kind).name}</strong>
              <span>
                {
                  {
                    sar: "Suche, Lagekarte, Akten und Patientenversorgung",
                    medical: "Patientenmonitor und verdeckte Zustandswechsel",
                    airsoft: "Freiwilliges GPS, Teams und Aufgaben im Gelände",
                    film: "Wiederholbarer Ablauf mit simulierten Positionen",
                  }[kind]
                }
              </span>
            </button>
          ))}
        </div>
      )}
      {step === 1 && (
        <div className="form-grid">
          <label>
            Szenarioname
            <input
              value={draft.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </label>
          <label>
            Datenquelle
            <select
              value={draft.mode}
              onChange={(e) =>
                update({ mode: e.target.value as Scenario["mode"] })
              }
            >
              <option>LIVE</option>
              <option>PLAYBACK</option>
            </select>
          </label>
          {(["lat", "lng", "zoom"] as const).map((k) => (
            <label key={k}>
              {{ lat: "Breitengrad", lng: "Längengrad", zoom: "Kartenzoom" }[k]}
              <input
                type="number"
                step="any"
                value={draft.map[k]}
                onChange={(e) =>
                  update({ map: { ...draft.map, [k]: Number(e.target.value) } })
                }
              />
            </label>
          ))}
          <p>
            LIVE verwendet freigegebene GPS-Daten und Online-Karten. PLAYBACK
            bewegt die vorbereiteten Routen ohne Standortfreigabe oder
            Kartenabruf. Die Zielzone lässt sich anschließend im Editor
            anpassen.
          </p>
        </div>
      )}
      {step === 2 && (
        <>
          <p>
            Eine Station entspricht einem Gerät. Mehrere Monitore können
            denselben Patienten zeigen. Namen und Teamzugehörigkeit helfen bei
            der Ausgabe der Geräte.
          </p>
          <div className="form-grid">
            {draft.stations.map((st) => (
              <label key={st.id}>
                {st.module} · {st.id}
                <input
                  value={st.name}
                  onChange={(e) =>
                    update({
                      stations: draft.stations.map((s) =>
                        s.id === st.id ? { ...s, name: e.target.value } : s,
                      ),
                    })
                  }
                />
              </label>
            ))}
          </div>
          <button
            onClick={() => {
              const id = `player-${Date.now().toString(36)}`;
              update({
                stations: [
                  ...draft.stations,
                  {
                    ...draft.stations.find((s) => s.player)!,
                    id,
                    name: `Player ${draft.stations.filter((s) => s.player).length + 1}`,
                  },
                ],
              });
            }}
          >
            Spieler hinzufügen
          </button>
        </>
      )}
      {step === 3 && (
        <>
          <p>
            Der Trainer kann jederzeit pausieren oder Werte ändern. Verdeckte
            Ereignisse sind nur hier sichtbar.
          </p>
          <label>
            Patientenzustand nach wie vielen Sekunden ändern?
            <input
              type="number"
              min="0"
              max="86400"
              value={draft.injects[0]?.at ?? 180}
              onChange={(e) =>
                update({
                  injects: draft.injects.map((r, i) =>
                    i === 0 ? { ...r, at: Number(e.target.value) } : r,
                  ),
                })
              }
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={draft.injects[0]?.enabled ?? false}
              onChange={(e) =>
                update({
                  injects: draft.injects.map((r, i) =>
                    i === 0 ? { ...r, enabled: e.target.checked } : r,
                  ),
                })
              }
            />
            Zustandswechsel aktivieren, sofern noch keine Behandlung gemeldet
            wurde
          </label>
          <p>
            Terminalaufgabe: aktiven Shunt-Code im Diagnosebericht erkennen und
            im Freigabefeld eingeben. Alle Gerätedaten sind fiktiv. Weitere
            Auslöser und Folgeaktionen ergänzt du danach im Ablaufeditor.
          </p>
        </>
      )}
      {step === 4 && (
        <>
          <div className="summary-grid">
            <div>
              <b>{draft.name}</b>
              <span>{draft.mode}</span>
            </div>
            <div>
              <b>{draft.stations.length}</b>
              <span>Geräte</span>
            </div>
            <div>
              <b>{draft.patients.length}</b>
              <span>Patienten</span>
            </div>
            <div>
              <b>{draft.injects.filter((r) => r.enabled).length}</b>
              <span>Ereignisse</span>
            </div>
          </div>
          <p>
            Nach dem Anlegen bleibt das Szenario pausiert. Im nächsten Schritt
            weist du Geräte per QR-Code zu und prüfst ihre Verbindung. Erst
            „Übung starten“ setzt die gemeinsame Uhr in Gang.
          </p>
        </>
      )}
      {error && <p role="alert">{error}</p>}
      <div className="button-row">
        {step > 0 && <button onClick={() => setStep(step - 1)}>Zurück</button>}
        {step > 0 && (
          <button className="primary" onClick={next}>
            {step === 4 ? "Szenario anlegen" : "Weiter"}
          </button>
        )}
      </div>
    </section>
  );
}
