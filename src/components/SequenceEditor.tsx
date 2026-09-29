import { useState } from "react";
import { scenes, defaults, type Config } from "../core/config";
import { newStep, showSchema, type Show, type Step } from "../core/director";
import { showTemplateLabels, showTemplates } from "../core/showTemplates";
import { sequences } from "../scenes/os/sequences";
export function SequenceEditor({
  show,
  onChange,
  config,
  onStart,
  running,
  onStop,
  onAdvance,
}: {
  show: Show;
  onChange: (s: Show) => void;
  config: Config;
  onStart: () => void;
  running: string | null;
  onStop: () => void;
  onAdvance: () => void;
}) {
  const [selected, setSelected] = useState(show.steps[0]?.id ?? ""),
    [page, setPage] = useState(0),
    [status, setStatus] = useState("");
  const item = show.steps.find((s) => s.id === selected);
  const set = (patch: Partial<Step>) =>
    onChange({
      ...show,
      steps: show.steps.map((s) =>
        s.id === selected ? { ...s, ...patch } : s,
      ),
    });
  const add = (config: Config, index = show.steps.length) => {
    if (show.steps.length >= 60) return;
    const step = newStep(config);
    const steps = [...show.steps];
    steps.splice(index, 0, step);
    onChange({ ...show, steps });
    setSelected(step.id);
    setPage(Math.floor(index / 5));
  };
  const move = (id: string, index: number) => {
    const steps = show.steps.filter((s) => s.id !== id),
      step = show.steps.find((s) => s.id === id);
    if (!step) return;
    steps.splice(Math.max(0, index), 0, step);
    onChange({ ...show, steps });
  };
  const exportShow = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(show, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "screenforge-show.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section className="sequence-editor">
      <header>
        <input
          aria-label="Ablaufname"
          value={show.name}
          onChange={(e) => onChange({ ...show, name: e.target.value })}
        />
        <button
          onClick={running ? onStop : onStart}
          disabled={!show.steps.length}
        >
          {running ? "Ablauf stoppen" : "Ablauf starten"}
        </button>
        <button disabled={!running} onClick={onAdvance}>
          Nächster Cue
        </button>
        <button onClick={exportShow}>Ablauf exportieren</button>
        <label className="show-import">
          Import
          <input
            aria-label="Ablauf importieren"
            type="file"
            accept=".json"
            onChange={async (e) => {
              try {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 12_000_000) throw Error();
                const loaded = showSchema.parse(JSON.parse(await f.text()));
                onChange(loaded);
                setSelected(loaded.steps[0]?.id ?? "");
                setPage(0);
                setStatus("Ablauf geladen.");
              } catch {
                setStatus(
                  "Ungültiger Ablauf. Bestehender Ablauf bleibt erhalten.",
                );
              }
            }}
          />
        </label>
      </header>
      <div className="sequence-palette">
        <label>
          Ablaufvorlage
          <select
            aria-label="Ablaufvorlage"
            defaultValue=""
            onChange={(e) => {
              const t = showTemplates(config)[Number(e.target.value)];
              if (!t) return;
              onChange(t.show);
              setSelected(t.show.steps[0]?.id ?? "");
              setPage(0);
              setStatus(`${t.name} geladen.`);
              e.target.value = "";
            }}
          >
            <option value="" disabled>
              Vorlage wählen…
            </option>
            {showTemplateLabels.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <span>Szenen</span>
        {scenes
          .filter((s) => s.kind === "scene")
          .map((s) => (
            <button
              key={s.id}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("application/screenforge-scene", s.id)
              }
              onClick={() => add(defaults(s.id))}
            >
              + {s.name}
            </button>
          ))}
        <span>Bausteine</span>
        {scenes
          .filter((s) => s.kind === "block")
          .map((s) => (
            <button
              key={s.id}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("application/screenforge-scene", s.id)
              }
              onClick={() => add(defaults(s.id))}
            >
              + {s.name}
            </button>
          ))}
        <button onClick={() => add(config)}>+ Aktuelle Konfiguration</button>
      </div>
      <div className="sequence-body">
        <div className="sequence-chain">
          {show.steps.slice(page * 5, page * 5 + 5).map((s, i) => (
            <article
              key={s.id}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("application/screenforge-node", s.id)
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData(
                  "application/screenforge-node",
                );
                const scene = e.dataTransfer.getData(
                  "application/screenforge-scene",
                );
                if (id) move(id, page * 5 + i);
                else if (scenes.some((s) => s.id === scene))
                  add(defaults(scene as Config["scene"]), page * 5 + i);
              }}
              className={`${s.id === selected ? "selected" : ""} ${s.id === running ? "running" : ""}`}
            >
              <button
                className="sequence-node"
                onClick={() => setSelected(s.id)}
              >
                <span>{String(page * 5 + i + 1).padStart(2, "0")}</span>
                <strong>{s.name}</strong>
                <small>
                  {s.config.scene} ·{" "}
                  {s.trigger === "time"
                    ? `${s.duration}s`
                    : s.trigger + " : " + s.value}
                </small>
              </button>
              <div className="sequence-node-actions">
                <button
                  aria-label={`Move ${s.name} up`}
                  disabled={page * 5 + i === 0}
                  onClick={() => move(s.id, page * 5 + i - 1)}
                >
                  ↑
                </button>
                <button
                  aria-label={`Move ${s.name} down`}
                  disabled={page * 5 + i === show.steps.length - 1}
                  onClick={() => move(s.id, page * 5 + i + 1)}
                >
                  ↓
                </button>
              </div>
              <div className="sequence-link">
                →{" "}
                {s.next === "end"
                  ? "ENDE"
                  : s.next
                    ? show.steps.find((n) => n.id === s.next)?.name
                    : "Nächster Knoten"}
              </div>
            </article>
          ))}
          <div className="sequence-page">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Zurück
            </button>
            <span>
              {page + 1}/{Math.max(1, Math.ceil(show.steps.length / 5))}
            </span>
            <button
              disabled={(page + 1) * 5 >= show.steps.length}
              onClick={() => setPage((p) => p + 1)}
            >
              Weiter
            </button>
          </div>
        </div>
        <div className="sequence-properties">
          {item ? (
            <>
              <label>
                Knotenname
                <input
                  value={item.name}
                  onChange={(e) => set({ name: e.target.value })}
                />
              </label>
              <label>
                Szene
                <select
                  value={item.config.scene}
                  onChange={(e) =>
                    set({ config: defaults(e.target.value as Config["scene"]) })
                  }
                >
                  {scenes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Cue
                <select
                  value={item.cue}
                  onChange={(e) => set({ cue: e.target.value as Step["cue"] })}
                >
                  {["idle", "active", "warning", "complete"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              {item.config.scene === "terminal" && (
                <label>
                  OS-Sequenz
                  <select
                    value={item.operation}
                    onChange={(e) => set({ operation: e.target.value })}
                  >
                    <option value="">Keine</option>
                    {sequences.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Weiter bei
                <select
                  aria-label="Knoten-Auslöser"
                  value={item.trigger}
                  onChange={(e) =>
                    set({
                      trigger: e.target.value as Step["trigger"],
                      value:
                        e.target.value === "pin" ? item.config.pin : "Enter",
                    })
                  }
                >
                  <option value="time">Zeit</option>
                  <option value="key">Taste</option>
                  <option value="pin">Zugangscode</option>
                  <option value="signal">Szenensignal</option>
                </select>
              </label>
              {item.trigger === "time" ? (
                <label>
                  Sekunden
                  <input
                    aria-label="Knoten-Dauer"
                    type="number"
                    min=".1"
                    value={item.duration}
                    onChange={(e) =>
                      set({ duration: Math.max(0.1, +e.target.value) })
                    }
                  />
                </label>
              ) : (
                <label>
                  Erwartete Eingabe
                  <input
                    aria-label="Knoten-Eingabe"
                    value={item.value}
                    onChange={(e) =>
                      set({
                        value: e.target.value,
                        config:
                          item.trigger === "pin"
                            ? {
                                ...item.config,
                                pin: /^[A-Za-z0-9]{4,8}$/.test(e.target.value)
                                  ? e.target.value
                                  : item.config.pin,
                                pinEnabled: true,
                              }
                            : item.config,
                      })
                    }
                  />
                </label>
              )}
              <label>
                Verknüpfung
                <select
                  aria-label="Nächster Knoten"
                  value={item.next}
                  onChange={(e) => set({ next: e.target.value })}
                >
                  <option value="">Nächster Knoten in Reihenfolge</option>
                  <option value="end">Ablauf beenden</option>
                  {show.steps
                    .filter((s) => s.id !== item.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </label>
              <button onClick={() => set({ config: structuredClone(config) })}>
                Aktuelle Gestaltung übernehmen
              </button>
              <button
                onClick={() => {
                  onChange({
                    ...show,
                    steps: show.steps
                      .filter((s) => s.id !== selected)
                      .map((s) =>
                        s.next === selected ? { ...s, next: "" } : s,
                      ),
                  });
                  setSelected("");
                }}
              >
                Knoten entfernen
              </button>
            </>
          ) : (
            <p>Knoten auswählen oder hinzufügen.</p>
          )}
        </div>
      </div>
      <footer>
        {status ||
          "Ziehen zum Anordnen. Pfeiltasten-Buttons für Touch und Tastatur. Änderungen werden lokal gespeichert."}
      </footer>
    </section>
  );
}
