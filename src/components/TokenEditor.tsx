import { useState } from "react";
import tokens from "../core/design-tokens.json";
import type { Config } from "../core/config";
export function TokenEditor({
  config,
  onChange,
}: {
  config: Config;
  onChange: (c: Config) => void;
}) {
  const [query, setQuery] = useState(""),
    [page, setPage] = useState(0),
    [error, setError] = useState("");
  const entries = Object.entries(tokens).filter(([key, t]) =>
    (key + " " + t.uses.join(" ")).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="token-editor">
      <label>
        Designwerte durchsuchen
        <input
          aria-label="Designwerte suchen"
          placeholder="color, padding, countdown, font…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
        />
      </label>
      <div className="token-list">
        {entries.slice(page * 8, page * 8 + 8).map(([key, t]) => (
          <label key={key}>
            <span title={t.uses.join("\n")}>{key.replace("--sf-", "")}</span>
            <input
              aria-label={key}
              defaultValue={config.tokens[key] ?? t.value}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (
                  !/^[#a-zA-Z0-9.,% ()+\/-]+$/.test(value) ||
                  !CSS.supports(
                    t.kind === "color"
                      ? "color"
                      : t.kind === "opacity"
                        ? "opacity"
                        : t.kind === "font-weight"
                          ? "font-weight"
                          : "width",
                    value,
                  )
                ) {
                  setError("Ungültiger Designwert.");
                  e.target.value = config.tokens[key] ?? t.value;
                  return;
                }
                onChange({
                  ...config,
                  tokens: { ...config.tokens, [key]: value },
                });
                setError("");
              }}
            />
          </label>
        ))}
      </div>
      <div className="media-pagination">
        <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          Zurück
        </button>
        <span>
          {page + 1}/{Math.max(1, Math.ceil(entries.length / 8))}
        </span>
        <button
          disabled={(page + 1) * 8 >= entries.length}
          onClick={() => setPage((p) => p + 1)}
        >
          Weiter
        </button>
      </div>
      <button onClick={() => onChange({ ...config, tokens: {} })}>
        Designwerte zurücksetzen
      </button>
      <p>
        {error ||
          `${entries.length} zentrale Designwerte. Änderungen werden mit dem Systemprofil gespeichert.`}
      </p>
    </div>
  );
}
