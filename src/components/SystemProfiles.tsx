import { useState } from "react";
import { defaults, schema, type Config, type SceneId } from "../core/config";
const templates: [string, SceneId, string, string, string, string][] = [
  [
    "Umbrella Corporation",
    "corporate",
    "UMBRELLA",
    "BIOLOGICAL RESEARCH / FACILITY 07",
    "umbrella",
    "#cf233c",
  ],
  [
    "Umbrella containment",
    "terminal",
    "UMBRELLA",
    "CONTAINMENT OPERATIONS / RED QUEEN",
    "umbrella",
    "#f32645",
  ],
  [
    "Cyberpunk 2077 HUD",
    "terminal",
    "NIGHT CITY OS",
    "NEURAL INTERFACE / ACCESS TIER 04",
    "hex",
    "#ff394e",
  ],
  [
    "Vesper Research",
    "corporate",
    "VESPER",
    "BIOLOGICAL RESEARCH DIVISION",
    "default",
    "#cf233c",
  ],
  [
    "Blackline Operations",
    "terminal",
    "BLACKLINE",
    "NETWORK OPERATIONS / LOCAL SESSION",
    "default",
    "#f36c75",
  ],
  [
    "Helix Biotech",
    "corporate",
    "HELIX",
    "CELLULAR SYSTEMS / RESEARCH DIVISION",
    "hex",
    "#198a7a",
  ],
  [
    "Asterion Aerospace",
    "tracking",
    "ASTERION",
    "ORBITAL SENSOR / FLIGHT OPERATIONS",
    "orbital",
    "#9ad9c0",
  ],
  [
    "Meridian Security",
    "terminal",
    "MERIDIAN",
    "IDENTITY CONTROL / EVIDENCE SYSTEM",
    "hex",
    "#dfa943",
  ],
  [
    "AEON Spatial",
    "hologram",
    "AEON",
    "SPATIAL RECONSTRUCTION LABORATORY",
    "orbital",
    "#8acde8",
  ],
  [
    "Kestrel Cockpit",
    "tracking",
    "KESTREL",
    "AUTONOMOUS FLIGHT / CONTACT TELEMETRY",
    "hex",
    "#79cfed",
  ],
  [
    "Obsidian Sequence",
    "countdown",
    "OBSIDIAN",
    "SEQUENCE CONTROL / SERIES 09",
    "hex",
    "#ff8a62",
  ],
  [
    "Ghost Relay",
    "terminal",
    "GHOST",
    "ISOLATED RELAY / MAINTENANCE CONSOLE",
    "default",
    "#8bed9e",
  ],
];
export const systemTemplates = templates.map(
  ([name, scene, title, subtitle, mark, accent]) => ({
    name,
    config: {
      ...defaults(scene),
      title,
      subtitle,
      accent,
      brand: { mark: mark as NonNullable<Config["brand"]>["mark"], logo: "" },
      skin:
        name === "Cyberpunk 2077 HUD" || name === "Umbrella containment"
          ? ("cyberdeck" as const)
          : ("standard" as const),
      ...(name === "Cyberpunk 2077 HUD"
        ? {
            palette: {
              background: "#08070c",
              surface: "#211015",
              text: "#f86c75",
              secondary: "#f3495e",
            },
            effects: 0.9,
            overlays: {
              scanlines: 0.5,
              glow: 0.7,
              grain: 0.35,
              grid: 0.12,
              vignette: 0.5,
              glitch: 0.35,
              chromatic: 0.4,
            },
          }
        : {}),
    },
  }),
);
export function SystemProfiles({
  config,
  onChange,
  onLoad,
}: {
  config: Config;
  onChange: (c: Config) => void;
  onLoad: (c: Config) => void;
}) {
  const [profiles, setProfiles] = useState<{ name: string; config: Config }[]>(
      () => {
        try {
          return JSON.parse(
            localStorage.getItem("screenforge.systems.v1") || "[]",
          )
            .filter(
              (p: { name: string; config: unknown }) =>
                typeof p.name === "string" &&
                schema.safeParse(p.config).success,
            )
            .map((p: { name: string; config: unknown }) => ({
              ...p,
              config: schema.parse(p.config),
            }));
        } catch {
          return [];
        }
      },
    ),
    [name, setName] = useState("My corporation"),
    [status, setStatus] = useState("");
  const persist = (next: typeof profiles) => {
    try {
      localStorage.setItem("screenforge.systems.v1", JSON.stringify(next));
      setProfiles(next);
      setStatus("Systemprofil gespeichert.");
    } catch {
      setStatus("Speicher voll. Preset als JSON exportieren.");
    }
  };
  return (
    <details className="theme-editor system-profiles" open>
      <summary>Firmen & Systeme</summary>
      <label>
        Systemvorlage
        <select
          aria-label="Systemvorlage"
          defaultValue=""
          onChange={(e) => {
            const p = [...systemTemplates, ...profiles][Number(e.target.value)];
            if (p) {
              onLoad(p.config);
              setName(p.name);
              setStatus("System geladen.");
            }
          }}
        >
          <option value="" disabled>
            System wählen…
          </option>
          <optgroup label="Vorlagen">
            {systemTemplates.map((p, i) => (
              <option key={p.name} value={i}>
                {p.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Eigene Systeme">
            {profiles.map((p, i) => (
              <option key={p.name} value={i + systemTemplates.length}>
                {p.name}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      <label>
        Oberflächenstil
        <select
          aria-label="Oberflächenstil"
          value={config.skin}
          onChange={(e) =>
            onChange({ ...config, skin: e.target.value as Config["skin"] })
          }
        >
          <option value="standard">Technical / Standard</option>
          <option value="cyberdeck">Cyberdeck / Angular HUD</option>
        </select>
      </label>
      <label>
        Eigenes Logo
        <input
          aria-label="Firmenlogo hochladen"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (
              file.size > 8_000_000 ||
              !/^image\/(png|jpeg|webp)$/.test(file.type)
            ) {
              setStatus("PNG, JPEG oder WebP bis 8 MB verwenden.");
              return;
            }
            try {
              const bitmap = await createImageBitmap(file);
              const canvas = document.createElement("canvas");
              const scale = Math.min(
                1,
                256 / Math.max(bitmap.width, bitmap.height),
              );
              canvas.width = Math.max(1, Math.round(bitmap.width * scale));
              canvas.height = Math.max(1, Math.round(bitmap.height * scale));
              canvas
                .getContext("2d")!
                .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
              bitmap.close();
              const logo = canvas.toDataURL("image/webp", 0.9);
              if (logo.length > 180000) throw Error();
              onChange({ ...config, brand: { mark: "default", logo } });
              setStatus("Logo geladen. Zum Wiederverwenden System speichern.");
            } catch {
              setStatus("Logo konnte nicht gelesen werden.");
            }
          }}
        />
      </label>
      {config.brand?.logo && (
        <button
          onClick={() =>
            onChange({ ...config, brand: { mark: "default", logo: "" } })
          }
        >
          Logo entfernen
        </button>
      )}
      <label>
        Profilname
        <input
          aria-label="Systemprofilname"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <div className="theme-actions">
        <button
          disabled={!name.trim()}
          onClick={() =>
            persist(
              [
                ...profiles.filter((p) => p.name !== name.trim()),
                { name: name.trim(), config },
              ].slice(-24),
            )
          }
        >
          System speichern
        </button>
        <button
          disabled={!profiles.some((p) => p.name === name)}
          onClick={() => persist(profiles.filter((p) => p.name !== name))}
        >
          Löschen
        </button>
      </div>
      <p role="status">
        {status ||
          "Logo, Szene, Inhalte, Farben und Effekte als eigenes System sichern."}
      </p>
    </details>
  );
}
