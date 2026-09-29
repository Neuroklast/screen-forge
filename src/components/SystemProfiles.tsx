import { useState } from "react";
import { applyIdentity, schema, type Config } from "../core/config";
const companies: {
  name: string;
  identity: Pick<Config, "title" | "subtitle" | "identifier"> & {
    brand: NonNullable<Config["brand"]>;
  };
}[] = [
  {
    name: "Umbrella Corporation",
    identity: {
      title: "UMBRELLA",
      subtitle: "BIOLOGICAL RESEARCH / FACILITY 07",
      identifier: "UC-07 / FACILITY",
      brand: { mark: "umbrella", logo: "" },
    },
  },
  {
    name: "Ashenrai Deck",
    identity: {
      title: "ASHENRAI",
      subtitle: "NEURAL INTERFACE / ACCESS TIER 04",
      identifier: "AR-04 / DECK",
      brand: { mark: "triad", logo: "" },
    },
  },
  {
    name: "Vesper Research",
    identity: {
      title: "VESPER",
      subtitle: "BIOLOGICAL RESEARCH DIVISION",
      identifier: "VS-204 / UNIT 07",
      brand: { mark: "default", logo: "" },
    },
  },
  {
    name: "Blackline Operations",
    identity: {
      title: "BLACKLINE",
      subtitle: "NETWORK OPERATIONS / LOCAL SESSION",
      identifier: "BL-09 / RELAY 07",
      brand: { mark: "default", logo: "" },
    },
  },
  {
    name: "Helix Biotech",
    identity: {
      title: "HELIX",
      subtitle: "CELLULAR SYSTEMS / RESEARCH DIVISION",
      identifier: "HX-12 / LAB 03",
      brand: { mark: "hex", logo: "" },
    },
  },
  {
    name: "Asterion Aerospace",
    identity: {
      title: "ASTERION",
      subtitle: "ORBITAL SENSOR / FLIGHT OPERATIONS",
      identifier: "AS-04 / SENSOR",
      brand: { mark: "orbital", logo: "" },
    },
  },
  {
    name: "Meridian Security",
    identity: {
      title: "MERIDIAN",
      subtitle: "IDENTITY CONTROL / EVIDENCE SYSTEM",
      identifier: "MD-18 / GATE",
      brand: { mark: "hex", logo: "" },
    },
  },
  {
    name: "AEON Spatial",
    identity: {
      title: "AEON",
      subtitle: "SPATIAL RECONSTRUCTION LABORATORY",
      identifier: "AE-09 / TABLE",
      brand: { mark: "orbital", logo: "" },
    },
  },
  {
    name: "Kestrel Cockpit",
    identity: {
      title: "KESTREL",
      subtitle: "AUTONOMOUS FLIGHT / CONTACT TELEMETRY",
      identifier: "KS-02 / HUD",
      brand: { mark: "hex", logo: "" },
    },
  },
  {
    name: "Obsidian Sequence",
    identity: {
      title: "OBSIDIAN",
      subtitle: "SEQUENCE CONTROL / SERIES 09",
      identifier: "OB-09 / CELL",
      brand: { mark: "atom", logo: "" },
    },
  },
  {
    name: "Kagetsu Heavy",
    identity: {
      title: "KAGETSU",
      subtitle: "HEAVY INDUSTRY / ZAIBATSU DIVISION",
      identifier: "KG-11 / TOWER",
      brand: { mark: "triad", logo: "" },
    },
  },
  {
    name: "Foldsteel Arms",
    identity: {
      title: "FOLDSTEEL",
      subtitle: "ORDNANCE / CONTRACT MANUFACTURING",
      identifier: "FS-08 / YARD",
      brand: { mark: "plate", logo: "" },
    },
  },
  {
    name: "Cordon Enforcement",
    identity: {
      title: "CORDON",
      subtitle: "MUNICIPAL CONTAINMENT / TACTICAL NET",
      identifier: "CD-03 / GATE",
      brand: { mark: "ridge", logo: "" },
    },
  },
  {
    name: "Ghost Relay",
    identity: {
      title: "GHOST",
      subtitle: "ISOLATED RELAY / MAINTENANCE CONSOLE",
      identifier: "GH-07 / TTY",
      brand: { mark: "default", logo: "" },
    },
  },
];
export const systemTemplates = companies;
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
            const i = Number(e.target.value);
            if (i < companies.length) {
              onChange(applyIdentity(config, companies[i].identity));
              setName(companies[i].name);
              setStatus("Firma gesetzt. Farben bleiben beim Theme.");
              return;
            }
            const p = profiles[i - companies.length];
            if (p) {
              onLoad(p.config);
              setName(p.name);
              setStatus("System geladen.");
            }
          }}
        >
          <option value="" disabled>
            Firma wählen…
          </option>
          <optgroup label="Firmen">
            {companies.map((p, i) => (
              <option key={p.name} value={i}>
                {p.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Eigene Systeme">
            {profiles.map((p, i) => (
              <option key={p.name} value={i + companies.length}>
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
              onChange({
                ...config,
                brand: { mark: config.brand?.mark ?? "default", logo },
              });
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
            onChange({
              ...config,
              brand: { mark: config.brand?.mark ?? "default", logo: "" },
            })
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
          "Firma setzt nur Name und Zeichen. Farben über Themes."}
      </p>
    </details>
  );
}
