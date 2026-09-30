import { useState } from "react";
import { missionTemplates } from "../core/templates";
import type { Scenario } from "../core/training";
import { t } from "../i18n";
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
    (tpl) =>
      (!difficulty || tpl.difficulty === difficulty) &&
      (!maxDuration || tpl.durationMin <= maxDuration),
  );
  return (
    <section className="gallery" aria-label={t("gallery.title")}>
      <header className="gallery-head">
        <h2>{t("gallery.title")}</h2>
        <button onClick={onClose}>{t("gallery.close")}</button>
      </header>
      <div className="gallery-filters">
        <label>
          {t("gallery.level")}
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
          >
            <option value={0}>{t("gallery.all")}</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </label>
        <label>
          {t("gallery.maxDuration")}
          <select
            value={maxDuration}
            onChange={(e) => setMaxDuration(Number(e.target.value))}
          >
            <option value={0}>{t("gallery.any")}</option>
            <option value={20}>20 min</option>
            <option value={30}>30 min</option>
          </select>
        </label>
      </div>
      <div className="gallery-grid">
        {list.map((tpl) => (
          <article key={tpl.id} className="gallery-card">
            <strong>{tpl.name}</strong>
            <span>{tpl.summary}</span>
            <span className="gallery-meta">
              {t("gallery.meta", {
                count: tpl.scenario.stations.length,
                duration: tpl.durationMin || "—",
                level: tpl.difficulty,
              })}
            </span>
            <button onClick={() => onSelect(structuredClone(tpl.scenario))}>
              {t("gallery.load")}
            </button>
          </article>
        ))}
        {!list.length && (
          <p className="gallery-empty">{t("gallery.empty")}</p>
        )}
      </div>
    </section>
  );
}
