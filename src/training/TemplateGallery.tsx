import { useState } from "react";
import {
  applyVariant,
  missionSectionKeys,
  missionTemplates,
} from "../core/templates";
import { equipmentPack } from "../core/equipment";
import { teamTemplateLabel } from "../core/teamTemplates";
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
            {tpl.intent && <span className="gallery-intent">{tpl.intent}</span>}
            {tpl.sections && (
              <details className="gallery-sections">
                <summary>{t("gallery.sections")}</summary>
                <dl>
                  {missionSectionKeys
                    .filter((key) => key !== "intent" && tpl.sections?.[key])
                    .map((key) => (
                      <div key={key}>
                        <dt>{t(`template.section.${key}`)}</dt>
                        <dd>{tpl.sections?.[key]}</dd>
                      </div>
                    ))}
                </dl>
                {tpl.defaults?.teamTemplates?.length ? (
                  <p className="gallery-defaults">
                    <span>{t("gallery.defaultTeams")}</span>
                    {tpl.defaults.teamTemplates
                      .map((id) => teamTemplateLabel(id))
                      .join(" · ")}
                  </p>
                ) : null}
                {tpl.defaults?.equipmentPacks?.length ? (
                  <p className="gallery-defaults">
                    <span>{t("gallery.defaultPacks")}</span>
                    {tpl.defaults.equipmentPacks
                      .map((id) => {
                        const pack = equipmentPack(id);
                        return pack ? t(pack.labelKey) : id;
                      })
                      .join(" · ")}
                  </p>
                ) : null}
              </details>
            )}
            <button onClick={() => onSelect(structuredClone(tpl.scenario))}>
              {t("gallery.load")}
            </button>
            {tpl.variants?.length ? (
              <div className="gallery-variants">
                <span>{t("gallery.variants")}</span>
                {tpl.variants.map((variant) => (
                  <button
                    key={variant.id}
                    title={variant.summary}
                    onClick={() => onSelect(applyVariant(tpl.scenario, variant))}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            ) : null}
          </article>
        ))}
        {!list.length && (
          <p className="gallery-empty">{t("gallery.empty")}</p>
        )}
      </div>
    </section>
  );
}
