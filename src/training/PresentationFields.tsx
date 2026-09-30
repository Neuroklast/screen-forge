import {
  editPresentation,
  type Presentation,
  type TrainingStation,
} from "../core/training";
import { sceneIds, type SceneId } from "../core/config";
import { stageFormatIds } from "../core/stage";
import { t } from "../i18n";

const MOODS = ["clinical", "tense", "damaged"] as const;
const DENSITIES = ["focused", "detailed"] as const;

// Compact editor for the look a station pushes to its field device. The full
// sceneOptions preset is supported by the model; only the high-value identity
// fields are exposed here.
export function PresentationFields({
  station,
  readOnly,
  onChange,
}: {
  station: TrainingStation;
  readOnly?: boolean;
  onChange: (presentation: Presentation) => void;
}) {
  const p = station.presentation;
  const config = p?.config ?? {};
  const edit = (patch: Parameters<typeof editPresentation>[1]) =>
    onChange(editPresentation(p, patch));
  return (
    <fieldset className="presentation-fields">
      <legend>{t("presentation.heading")}</legend>
      <label>
        {t("presentation.scene")}
        <select
          value={p?.scene ?? ""}
          disabled={readOnly}
          onChange={(e) =>
            edit({ scene: (e.target.value || null) as SceneId | null })
          }
        >
          <option value="">{t("presentation.auto")}</option>
          {sceneIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("presentation.title")}
        <input
          value={config.title ?? ""}
          disabled={readOnly}
          placeholder={station.name}
          onChange={(e) => edit({ config: { title: e.target.value || undefined } })}
        />
      </label>
      <label>
        {t("presentation.subtitle")}
        <input
          value={config.subtitle ?? ""}
          disabled={readOnly}
          onChange={(e) =>
            edit({ config: { subtitle: e.target.value || undefined } })
          }
        />
      </label>
      <label>
        {t("presentation.identifier")}
        <input
          value={config.identifier ?? ""}
          disabled={readOnly}
          onChange={(e) =>
            edit({ config: { identifier: e.target.value || undefined } })
          }
        />
      </label>
      <label>
        {t("presentation.accent")}
        <input
          type="color"
          value={config.accent ?? "#80dce5"}
          disabled={readOnly}
          onChange={(e) => edit({ config: { accent: e.target.value } })}
        />
      </label>
      <label>
        {t("studio.mood")}
        <select
          value={config.mood ?? "clinical"}
          disabled={readOnly}
          onChange={(e) =>
            edit({ config: { mood: e.target.value as (typeof MOODS)[number] } })
          }
        >
          {MOODS.map((mood) => (
            <option key={mood} value={mood}>
              {t(`studio.mood.${mood}`)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("studio.density")}
        <select
          value={config.density ?? "detailed"}
          disabled={readOnly}
          onChange={(e) =>
            edit({
              config: { density: e.target.value as (typeof DENSITIES)[number] },
            })
          }
        >
          {DENSITIES.map((density) => (
            <option key={density} value={density}>
              {t(`studio.density.${density}`)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("studio.stageFormat")}
        <select
          value={config.format ?? "16-9"}
          disabled={readOnly}
          onChange={(e) =>
            edit({
              config: {
                format: e.target.value as (typeof stageFormatIds)[number],
              },
            })
          }
        >
          {stageFormatIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("presentation.effects")}
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={config.effects ?? 0.8}
          disabled={readOnly}
          onChange={(e) => edit({ config: { effects: Number(e.target.value) } })}
        />
      </label>
      <button
        type="button"
        disabled={readOnly}
        onClick={() => onChange(editPresentation(p, { scene: null, config: null }))}
      >
        {t("presentation.reset")}
      </button>
    </fieldset>
  );
}
