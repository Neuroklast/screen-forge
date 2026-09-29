import { useCallback, useState } from "react";
import {
  actorSchema,
  dossierSchema,
  injectSchema,
  modules,
  objectiveSchema,
  patientSchema,
  propSchema,
  stationSchema,
  teamSchema,
  zoneSchema,
  type Scenario,
  type TrainingStation,
} from "../core/training";
import { findingCounts, lintMission, type Collection } from "../core/missionLint";
import "./builder.css";

type ModuleId = (typeof modules)[number];
type Selection = { collection: Collection; id: string } | null;
type Drag =
  | { source: "palette"; kind: "module"; module: ModuleId }
  | { source: "palette"; kind: "entity"; collection: Collection }
  | { source: "board"; kind: "entity"; collection: Collection; id: string }
  | null;

const uid = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

const MODULE_LABELS: Record<ModuleId, string> = {
  medical: "Medizin",
  camera: "Kamera",
  tracking: "Karte",
  terminal: "Terminal",
  countdown: "Zeitgeber",
  access: "Zugang",
  comms: "Funk",
  corporate: "Konzernsystem",
  hologram: "Projektion",
  lock: "Verriegelung",
  slide: "Schieber",
};
const FIELD_MODULES: ModuleId[] = [
  "tracking",
  "medical",
  "camera",
  "terminal",
  "countdown",
  "access",
  "lock",
  "comms",
];
const SYSTEM_MODULES: ModuleId[] = ["corporate", "hologram", "slide"];

const ENTITY_LABELS: { collection: Collection; label: string }[] = [
  { collection: "patients", label: "Patient" },
  { collection: "props", label: "Requisite" },
  { collection: "dossiers", label: "Akte" },
  { collection: "zones", label: "Zone" },
  { collection: "objectives", label: "Einsatzziel" },
  { collection: "teams", label: "Team" },
  { collection: "actors", label: "Darsteller" },
];

export function MissionBuilder({
  draft,
  change,
  readOnly = false,
}: {
  draft: Scenario;
  change: (s: Scenario) => void;
  readOnly?: boolean;
}) {
  const [selected, setSelected] = useState<Selection>(null);
  const [history, setHistory] = useState<Scenario[]>([]);
  const [future, setFuture] = useState<Scenario[]>([]);
  const [drag, setDrag] = useState<Drag>(null);

  const commit = useCallback(
    (next: Scenario) => {
      if (readOnly) return;
      setHistory((h) => [...h.slice(-49), draft]);
      setFuture([]);
      change(next);
    },
    [draft, change, readOnly],
  );
  const undo = () => {
    if (!history.length) return;
    setFuture((f) => [draft, ...f]);
    setHistory((h) => h.slice(0, -1));
    change(history[history.length - 1]);
  };
  const redo = () => {
    if (!future.length) return;
    setHistory((h) => [...h, draft]);
    setFuture((f) => f.slice(1));
    change(future[0]);
  };

  const addStation = (module: ModuleId) => {
    const station = stationSchema.parse({
      id: uid("station"),
      name: MODULE_LABELS[module],
      role: module === "tracking" && draft.stations.length === 0 ? "hq" : "element",
      module,
    });
    commit({ ...draft, stations: [...draft.stations, station] });
    setSelected({ collection: "stations", id: station.id });
  };

  const addEntity = (collection: Collection) => {
    const id = uid(collection.slice(0, -1));
    let next: Scenario = draft;
    if (collection === "patients")
      next = { ...draft, patients: [...draft.patients, patientSchema.parse({ id, name: "Patient", kind: "stable", since: 0 })] };
    if (collection === "props")
      next = { ...draft, props: [...draft.props, propSchema.parse({ id, kind: "custom", name: "Requisite" })] };
    if (collection === "dossiers")
      next = {
        ...draft,
        dossiers: [...draft.dossiers, dossierSchema.parse({ id, name: "Akte", role: "", blood: "", allergies: "", clearance: "", status: "", facility: "", notes: "", events: [] })],
      };
    if (collection === "zones")
      next = { ...draft, zones: [...draft.zones, zoneSchema.parse({ id, name: "Zone", lat: draft.map.lat, lng: draft.map.lng, radius: 100 })] };
    if (collection === "objectives")
      next = { ...draft, objectives: [...draft.objectives, objectiveSchema.parse({ id, name: "Einsatzziel" })] };
    if (collection === "teams")
      next = { ...draft, teams: [...draft.teams, teamSchema.parse({ id, name: "Team" })] };
    if (collection === "actors")
      next = { ...draft, actors: [...draft.actors, actorSchema.parse({ id, name: "Darsteller" })] };
    commit(next);
    setSelected({ collection, id });
  };

  const addInject = () => {
    const inject = injectSchema.parse({
      id: uid("inject"),
      name: "Ereignis",
      trigger: "timer",
      actions: [{ type: "message", text: "Status prüfen" }],
    });
    commit({ ...draft, injects: [...draft.injects, inject] });
    setSelected({ collection: "injects", id: inject.id });
  };

  const patchStation = (id: string, patch: Partial<TrainingStation>) =>
    commit({
      ...draft,
      stations: draft.stations.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });

  const bind = (stationId: string, key: "patient" | "prop" | "objective", entityId: string) =>
    commit({
      ...draft,
      stations: draft.stations.map((s) =>
        s.id === stationId
          ? { ...s, bindings: { ...s.bindings, [key]: entityId } }
          : s,
      ),
    });

  const removeItem = (collection: Collection, id: string) => {
    if (collection === "stations")
      commit({ ...draft, stations: draft.stations.filter((s) => s.id !== id) });
    else if (collection === "patients")
      commit({ ...draft, patients: draft.patients.filter((x) => x.id !== id) });
    else if (collection === "props")
      commit({ ...draft, props: draft.props.filter((x) => x.id !== id) });
    else if (collection === "dossiers")
      commit({ ...draft, dossiers: draft.dossiers.filter((x) => x.id !== id) });
    else if (collection === "zones")
      commit({ ...draft, zones: draft.zones.filter((x) => x.id !== id) });
    else if (collection === "objectives")
      commit({ ...draft, objectives: draft.objectives.filter((x) => x.id !== id) });
    else if (collection === "teams")
      commit({ ...draft, teams: draft.teams.filter((x) => x.id !== id) });
    else if (collection === "actors")
      commit({ ...draft, actors: draft.actors.filter((x) => x.id !== id) });
    else if (collection === "injects")
      commit({ ...draft, injects: draft.injects.filter((x) => x.id !== id) });
    setSelected(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!drag || readOnly) return;
    if (drag.kind === "module") addStation(drag.module);
    else if (drag.source === "palette") addEntity(drag.collection);
    setDrag(null);
  };

  const findings = lintMission(draft);
  const counts = findingCounts(findings);
  const selectedStation =
    selected?.collection === "stations"
      ? draft.stations.find((s) => s.id === selected.id)
      : undefined;

  return (
    <section
      className={`builder ${readOnly ? "is-readonly" : ""}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key.toLowerCase() === "z") {
          e.preventDefault();
          undo();
        }
        if (e.ctrlKey && e.key.toLowerCase() === "y") {
          e.preventDefault();
          redo();
        }
      }}
    >
      <aside className="builder-palette" aria-label="Palette">
        <div className="builder-palette-head">
          <strong>Palette</strong>
          <div className="builder-undo">
            <button onClick={undo} disabled={!history.length || readOnly} title="Rückgängig (Strg+Z)">
              ↶
            </button>
            <button onClick={redo} disabled={!future.length || readOnly} title="Wiederholen (Strg+Y)">
              ↷
            </button>
          </div>
        </div>
        <PaletteGroup
          title="Module"
          items={[...FIELD_MODULES, ...SYSTEM_MODULES].map((m) => ({
            key: m,
            label: MODULE_LABELS[m],
            onAdd: () => addStation(m),
            drag: { source: "palette", kind: "module", module: m } as Drag,
          }))}
          setDrag={setDrag}
          readOnly={readOnly}
        />
        <PaletteGroup
          title="Entitäten"
          items={ENTITY_LABELS.map((e) => ({
            key: e.collection,
            label: e.label,
            onAdd: () => addEntity(e.collection),
            drag: { source: "palette", kind: "entity", collection: e.collection } as Drag,
          }))}
          setDrag={setDrag}
          readOnly={readOnly}
        />
        <PaletteGroup
          title="Ereignisse"
          items={[{ key: "inject", label: "Ereignis", onAdd: addInject, drag: null }]}
          setDrag={setDrag}
          readOnly={readOnly}
        />
      </aside>

      <div
        className="builder-board"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="builder-board-head">
          <input
            className="builder-name"
            aria-label="Einsatzname"
            value={draft.name}
            disabled={readOnly}
            onChange={(e) => commit({ ...draft, name: e.target.value })}
          />
          <span className="builder-count">
            {draft.stations.length} Geräte · {draft.injects.length} Ereignisse
          </span>
        </div>
        {draft.stations.length === 0 && (
          <p className="builder-empty">
            Noch keine Geräte. Ein Modul aus der Palette ziehen oder anklicken.
          </p>
        )}
        <div className="builder-cards">
          {draft.stations.map((st) => (
            <article
              key={st.id}
              className={`builder-card ${selected?.id === st.id ? "is-selected" : ""}`}
              onClick={() => setSelected({ collection: "stations", id: st.id })}
              onDragOver={(e) => {
                if (drag?.kind === "entity") e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!drag || drag.kind !== "entity" || drag.source !== "board") return;
                const key =
                  drag.collection === "patients"
                    ? "patient"
                    : drag.collection === "props"
                      ? "prop"
                      : drag.collection === "objectives"
                        ? "objective"
                        : null;
                if (key) bind(st.id, key, drag.id);
                setDrag(null);
              }}
            >
              <header>
                <span className="builder-card-module">{MODULE_LABELS[st.module]}</span>
                <span className="builder-card-role">{st.role === "hq" ? "HQ" : "Feld"}</span>
              </header>
              <strong>{st.name}</strong>
              <div className="builder-bindings">
                {st.bindings.patient && (
                  <span className="builder-bind">Patient: {st.bindings.patient}</span>
                )}
                {st.bindings.prop && (
                  <span className="builder-bind">Requisite: {st.bindings.prop}</span>
                )}
                {!st.bindings.patient && !st.bindings.prop && (
                  <span className="builder-bind is-empty">keine Bindung</span>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="builder-chips" aria-label="Entitäten">
          {ENTITY_LABELS.map(({ collection, label }) => {
            const rows = entityRows(draft, collection);
            if (!rows.length) return null;
            return (
              <div key={collection} className="builder-chip-group">
                <span className="builder-chip-label">{label}</span>
                {rows.map((row) => (
                  <button
                    key={row.id}
                    className={`builder-chip ${selected?.id === row.id ? "is-selected" : ""}`}
                    draggable={!readOnly}
                    onDragStart={() => setDrag({ source: "board", kind: "entity", collection, id: row.id })}
                    onDragEnd={() => setDrag(null)}
                    onClick={() => setSelected({ collection, id: row.id })}
                  >
                    {row.name}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <aside className="builder-inspector" aria-label="Inspektor">
        <div className="builder-linter" aria-label="Prüfen">
          <span className="sev-error">{counts.error} Fehler</span>
          <span className="sev-warning">{counts.warning} Warnungen</span>
          <span className="sev-info">{counts.info} Hinweise</span>
        </div>
        <ul className="builder-findings">
          {findings.map((f) => (
            <li key={f.id} className={`is-${f.severity}`}>
              <button onClick={() => setSelected({ collection: f.path.collection, id: f.path.id ?? "" })}>
                {f.message}
              </button>
            </li>
          ))}
          {!findings.length && <li className="is-ok">Keine Befunde.</li>}
        </ul>
        <div className="builder-fields">
          {selectedStation ? (
            <StationInspector
              station={selectedStation}
              draft={draft}
              readOnly={readOnly}
              onPatch={(p) => patchStation(selectedStation.id, p)}
              onRemove={() => removeItem("stations", selectedStation.id)}
            />
          ) : selected && selected.collection !== "stations" ? (
            <EntityInspector
              collection={selected.collection}
              id={selected.id}
              draft={draft}
              readOnly={readOnly}
              onRemove={() => removeItem(selected.collection, selected.id)}
              onChange={change}
              commit={commit}
            />
          ) : (
            <p className="builder-hint">
              Gerät oder Entität auswählen, um Eigenschaften zu bearbeiten.
            </p>
          )}
        </div>
      </aside>
    </section>
  );
}

function PaletteGroup({
  title,
  items,
  setDrag,
  readOnly,
}: {
  title: string;
  items: { key: string; label: string; onAdd: () => void; drag: Drag }[];
  setDrag: (d: Drag) => void;
  readOnly: boolean;
}) {
  return (
    <div className="palette-group">
      <span className="palette-group-title">{title}</span>
      <div className="palette-items">
        {items.map((item) => (
          <button
            key={item.key}
            className="palette-item"
            draggable={!readOnly && !!item.drag}
            onDragStart={() => item.drag && setDrag(item.drag)}
            onDragEnd={() => setDrag(null)}
            onClick={item.onAdd}
            disabled={readOnly}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function entityRows(s: Scenario, collection: Collection): { id: string; name: string }[] {
  if (collection === "patients") return s.patients;
  if (collection === "props") return s.props;
  if (collection === "dossiers") return s.dossiers;
  if (collection === "zones") return s.zones;
  if (collection === "objectives") return s.objectives;
  if (collection === "teams") return s.teams;
  if (collection === "actors") return s.actors;
  return [];
}

function StationInspector({
  station,
  draft,
  readOnly,
  onPatch,
  onRemove,
}: {
  station: TrainingStation;
  draft: Scenario;
  readOnly: boolean;
  onPatch: (p: Partial<TrainingStation>) => void;
  onRemove: () => void;
}) {
  return (
    <>
      <label>
        Name
        <input value={station.name} disabled={readOnly} onChange={(e) => onPatch({ name: e.target.value })} />
      </label>
      <label>
        Rolle
        <select
          value={station.role}
          disabled={readOnly}
          onChange={(e) => {
            const role = e.target.value as "hq" | "element";
            onPatch({ role, module: role === "hq" ? "tracking" : station.module });
          }}
        >
          <option value="element">Feldgerät</option>
          <option value="hq">Einsatzleitung</option>
        </select>
      </label>
      <label>
        Modul
        <select
          value={station.module}
          disabled={readOnly}
          onChange={(e) => onPatch({ module: e.target.value as ModuleId })}
        >
          {modules.map((m) => (
            <option key={m} value={m}>
              {MODULE_LABELS[m]}
            </option>
          ))}
        </select>
      </label>
      {station.module === "medical" && (
        <label>
          Patient
          <select
            value={station.bindings.patient}
            disabled={readOnly}
            onChange={(e) =>
              onPatch({ bindings: { ...station.bindings, patient: e.target.value } })
            }
          >
            <option value="">— keiner —</option>
            {draft.patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {station.bindings.prop !== undefined && draft.props.length > 0 && (
        <label>
          Requisite
          <select
            value={station.bindings.prop}
            disabled={readOnly}
            onChange={(e) =>
              onPatch({ bindings: { ...station.bindings, prop: e.target.value } })
            }
          >
            <option value="">— keine —</option>
            {draft.props.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Team
        <input value={station.team} disabled={readOnly} onChange={(e) => onPatch({ team: e.target.value })} />
      </label>
      <label className="check">
        <input type="checkbox" checked={station.player} disabled={readOnly} onChange={(e) => onPatch({ player: e.target.checked })} />
        GPS-Spieler
      </label>
      {["countdown", "access", "lock", "terminal"].includes(station.module) && (
        <>
          <label>
            Laufzeit (s)
            <input
              type="number"
              value={station.duration}
              disabled={readOnly}
              onChange={(e) => onPatch({ duration: Number(e.target.value) })}
            />
          </label>
          <label>
            Zugangscode
            <input
              inputMode="numeric"
              value={station.code}
              disabled={readOnly}
              onChange={(e) => {
                if (/^\d{0,12}$/.test(e.target.value)) onPatch({ code: e.target.value });
              }}
            />
          </label>
        </>
      )}
      <button className="danger" onClick={onRemove} disabled={readOnly}>
        Gerät entfernen
      </button>
    </>
  );
}

function EntityInspector({
  collection,
  id,
  draft,
  readOnly,
  onRemove,
  onChange,
  commit,
}: {
  collection: Collection;
  id: string;
  draft: Scenario;
  readOnly: boolean;
  onRemove: () => void;
  onChange: (s: Scenario) => void;
  commit: (s: Scenario) => void;
}) {
  const patch = (rows: unknown[]) => commit({ ...draft, [collection]: rows } as Scenario);
  const edit = (row: Record<string, unknown>, field: string, value: unknown) =>
    patch((draft[collection as keyof Scenario] as unknown as Record<string, unknown>[]).map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const rows = draft[collection as keyof Scenario] as unknown as Record<string, unknown>[];
  const row = rows.find((r) => r.id === id);
  if (!row) return <p className="builder-hint">Eintrag nicht gefunden.</p>;
  void onChange;

  return (
    <>
      <label>
        Name
        <input value={String(row.name ?? "")} disabled={readOnly} onChange={(e) => edit(row, "name", e.target.value)} />
      </label>
      {collection === "patients" && (
        <>
          <label>
            Zustand
            <select value={String(row.kind)} disabled={readOnly} onChange={(e) => edit(row, "kind", e.target.value)}>
              {["stable", "tachy", "brady", "desat", "trauma", "arrest", "recovered"].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <label>
            Verletzungen
            <textarea value={String(row.injuries ?? "")} disabled={readOnly} onChange={(e) => edit(row, "injuries", e.target.value)} />
          </label>
        </>
      )}
      {collection === "props" && (
        <label>
          Art
          <select value={String(row.kind)} disabled={readOnly} onChange={(e) => edit(row, "kind", e.target.value)}>
            {["ordnance", "beacon", "payload", "keycard", "custom"].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
      )}
      {collection === "zones" && (
        <>
          <label>
            Radius (m)
            <input type="number" value={Number(row.radius)} disabled={readOnly} onChange={(e) => edit(row, "radius", Number(e.target.value))} />
          </label>
        </>
      )}
      {collection === "dossiers" && (
        <label className="check">
          <input type="checkbox" checked={Boolean(row.released)} disabled={readOnly} onChange={(e) => edit(row, "released", e.target.checked)} />
          Beim Start freigegeben
        </label>
      )}
      <button className="danger" onClick={onRemove} disabled={readOnly}>
        Eintrag entfernen
      </button>
    </>
  );
}
