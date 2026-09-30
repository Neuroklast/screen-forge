import { useState } from "react";
import { z } from "zod";
import {
  applyTheme,
  paletteSchema,
  scenePalette,
  type Config,
} from "../core/config";
import { t } from "../i18n";
const themeSchema = z.object({
  tokens: z.record(z.string(), z.string()).default({}),
  font: z
    .enum([
      "space",
      "matrix",
      "matrixDisplay",
      "digit7",
      "digit14",
      "digit16",
      "gridtile",
      "binary",
    ])
    .default("space"),
  name: z.string().min(1).max(40),
  palette: paletteSchema,
  accent: z.string().regex(/^#[\da-f]{6}$/i),
  mood: z.enum(["clinical", "tense", "damaged"]),
  effects: z.number().min(0).max(1),
  overlays: z.object({
    scanlines: z.number().min(0).max(1),
    glow: z.number().min(0).max(1),
    grid: z.number().min(0).max(1),
    grain: z.number().min(0).max(1),
    vignette: z.number().min(0).max(1),
    glitch: z.number().min(0).max(1),
    chromatic: z.number().min(0).max(1),
  }),
});
type Theme = z.infer<typeof themeSchema>;
const colors = [
  ["Carbon red", "#000000", "#0a0a0a", "#f5f5f5", "#c8c8c8", "#e10600"],
  ["Carbon white", "#000000", "#111111", "#f2f2f2", "#bdbdbd", "#ffffff"],
  ["Phosphor", "#000000", "#031105", "#b4ffb4", "#5a9a5a", "#7cff7c"],
  ["Blackline", "#080d12", "#0e171f", "#d6e2e5", "#80dce5", "#f36c75"],
  ["Amber phosphor", "#100d05", "#211a09", "#f7df9c", "#c9ab58", "#ffba42"],
  ["Arctic research", "#07141c", "#102a38", "#d9f5ff", "#78cce5", "#d3efff"],
  ["Crimson lockdown", "#130609", "#290d15", "#f5cdd6", "#cf829b", "#ff3b5d"],
  ["Ghost terminal", "#050f09", "#102518", "#c1f2cf", "#78b68a", "#76fa96"],
  ["Ultraviolet", "#0d0919", "#21142e", "#e9ddff", "#b39aeb", "#ee70c1"],
  ["Vesper laboratory", "#f4f3f0", "#e4e3df", "#151515", "#62636b", "#cf233c"],
  ["Desert telemetry", "#15120b", "#282216", "#e4d7b6", "#b6a77e", "#e8b563"],
];
const flat = new Set(["Carbon red", "Carbon white", "Phosphor"]);
const PALETTE_LABEL: Record<string, string> = {
  background: "theme.background",
  surface: "theme.surface",
  text: "theme.text",
  secondary: "theme.secondary",
};
export function ThemeEditor({
  config,
  onChange,
}: {
  config: Config;
  onChange: (c: Config) => void;
}) {
  const [custom, setCustom] = useState<Theme[]>(() => {
      try {
        return z
          .array(themeSchema)
          .max(40)
          .parse(
            JSON.parse(localStorage.getItem("screenforge.themes.v1") || "[]"),
          );
      } catch {
        return [];
      }
    }),
    [name, setName] = useState("My theme"),
    [status, setStatus] = useState("");
  const presets: Theme[] = colors.map(
    ([name, background, surface, text, secondary, accent]) => ({
      name,
      tokens: {},
      font: "space",
      palette: { background: background.trim(), surface, text, secondary },
      accent,
      mood: name === "Crimson lockdown" ? "tense" : "clinical",
      effects: flat.has(name) ? 0.35 : 0.8,
      overlays: flat.has(name)
        ? {
            scanlines: 0.4,
            glow: 0,
            grid: 0.22,
            grain: 0.08,
            vignette: 0.15,
            glitch: 0,
            chromatic: 0,
          }
        : {
            scanlines: 0.5,
            glow: 0.55,
            grid: 0.16,
            grain: 0.35,
            vignette: 0.45,
            glitch: 0.24,
            chromatic: 0.3,
          },
    }),
  );
  const palette = config.palette ?? scenePalette(config.scene);
  const themes = [...presets, ...custom];
  const themeIndex = themes.findIndex((entry) => entry.name === config.theme);
  const persist = (next: Theme[]) => {
    try {
      localStorage.setItem("screenforge.themes.v1", JSON.stringify(next));
      setCustom(next);
      setStatus(t("theme.saved"));
    } catch {
      setStatus(t("theme.saveFailed"));
    }
  };
  return (
    <details className="theme-editor" open>
      <summary>{t("theme.title")}</summary>
      <label>
        {t("theme.select")}
        <select
          aria-label={t("theme.aria")}
          value={themeIndex >= 0 ? String(themeIndex) : ""}
          onChange={(e) => {
            const picked = themes[Number(e.target.value)];
            if (picked) {
              onChange(
                applyTheme(config, {
                  theme: picked.name,
                  palette: picked.palette,
                  accent: picked.accent,
                  mood: picked.mood,
                  effects: picked.effects,
                  overlays: picked.overlays,
                  font: picked.font,
                  tokens: picked.tokens,
                }),
              );
              setName(picked.name);
              setStatus(t("theme.loaded"));
            }
          }}
        >
          <option value="" disabled>
            {t("theme.choose")}
          </option>
          <optgroup label={t("theme.studio")}>
            {presets.map((entry, i) => (
              <option key={entry.name} value={i}>
                {entry.name}
              </option>
            ))}
          </optgroup>
          <optgroup label={t("theme.custom")}>
            {custom.map((entry, i) => (
              <option key={entry.name} value={i + presets.length}>
                {entry.name}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      {Object.entries(palette).map(([key, value]) => (
        <label className="color-label" key={key}>
          {PALETTE_LABEL[key] ? t(PALETTE_LABEL[key]) : key}
          <input
            aria-label={`Theme ${key}`}
            type="color"
            value={value}
            onChange={(e) =>
              onChange({
                ...config,
                palette: { ...palette, [key]: e.target.value },
              })
            }
          />
        </label>
      ))}
      <label>
        {t("theme.name")}
        <input
          aria-label={t("theme.name")}
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <div className="theme-actions">
        <button
          disabled={!name.trim()}
          onClick={() => {
            const draft: Theme = {
              name: name.trim(),
              tokens: config.tokens,
              font: config.font,
              palette,
              accent: config.accent,
              mood: config.mood,
              effects: config.effects,
              overlays: config.overlays,
            };
            persist(
              [...custom.filter((x) => x.name !== draft.name), draft].slice(-40),
            );
          }}
        >
          {t("theme.save")}
        </button>
        <button
          disabled={!custom.some((x) => x.name === name)}
          onClick={() => persist(custom.filter((x) => x.name !== name))}
        >
          {t("common.delete")}
        </button>
      </div>
      <p role="status">{status || t("theme.note")}</p>
    </details>
  );
}
