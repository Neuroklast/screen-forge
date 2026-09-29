import { useState } from "react";
import { missionTemplates } from "../core/templates";
import type { Scenario } from "../core/training";
import "./gallery.css";

export function TemplateGallery({
  onSelect,
  onClose,
}: {
  onSelect: (s: Scenario) => void;
  onClose: () => void;
}) {
  const [difficulty, setDifficulty] = useState(0);
  const [maxDuration, setMaxDuration] = useState(0);
  const list = missionTemplates.filter(
    (t) =>
      (!difficulty || t.difficulty === difficulty) &&
      (!maxDuration || t.durationMin <= maxDuration),
  );
  return (
    <section className="gallery" aria-label="Vorlagen">
      <header className="gallery-head">
        <h2>Vorlagen</h2>
        <button onClick={onClose}>Schließen</button>
      </header>
      <div className="gallery-filters">
        <label>
          Level
          <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}>
            <option value={0}>alle</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </label>
        <label>
          Max. Dauer
          <select value={maxDuration} onChange={(e) => setMaxDuration(Number(e.target.value))}>
            <option value={0}>egal</option>
            <option value={20}>20 min</option>
            <option value={30}>30 min</option>
          </select>
        </label>
      </div>
      <div className="gallery-grid">
        {list.map((t) => (
          <article key={t.id} className="gallery-card">
            <strong>{t.name}</strong>
            <span>{t.summary}</span>
            <span className="gallery-meta">
              {t.scenario.stations.length} Geräte · {t.durationMin || "—"} min · Level{" "}
              {t.difficulty}
            </span>
            <button onClick={() => onSelect(structuredClone(t.scenario))}>Laden</button>
          </article>
        ))}
        {!list.length && <p className="gallery-empty">Keine Vorlage passt zu den Filtern.</p>}
      </div>
    </section>
  );
}
