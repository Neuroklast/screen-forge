import { useState } from "react";
import tokens from "../core/design-tokens.json";
import type { Config } from "../core/config";
import { t } from "../i18n";
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
  const entries = Object.entries(tokens).filter(([key, token]) =>
    (key + " " + token.uses.join(" ")).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="token-editor">
      <label>
        {t("tokens.search")}
        <input
          aria-label={t("tokens.searchAria")}
          placeholder="color, padding, countdown, font…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
        />
      </label>
      <div className="token-list">
        {entries.slice(page * 8, page * 8 + 8).map(([key, token]) => (
          <label key={key}>
            <span title={token.uses.join("\n")}>{key.replace("--sf-", "")}</span>
            <input
              aria-label={key}
              defaultValue={config.tokens[key] ?? token.value}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (
                  !/^[#a-zA-Z0-9.,% ()+\/-]+$/.test(value) ||
                  !CSS.supports(
                    token.kind === "color"
                      ? "color"
                      : token.kind === "opacity"
                        ? "opacity"
                        : token.kind === "font-weight"
                          ? "font-weight"
                          : "width",
                    value,
                  )
                ) {
                  setError(t("tokens.invalid"));
                  e.target.value = config.tokens[key] ?? token.value;
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
          {t("common.back")}
        </button>
        <span>
          {page + 1}/{Math.max(1, Math.ceil(entries.length / 8))}
        </span>
        <button
          disabled={(page + 1) * 8 >= entries.length}
          onClick={() => setPage((p) => p + 1)}
        >
          {t("common.next")}
        </button>
      </div>
      <button onClick={() => onChange({ ...config, tokens: {} })}>
        {t("tokens.reset")}
      </button>
      <p>{error || t("tokens.summary", { count: entries.length })}</p>
    </div>
  );
}
