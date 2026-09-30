import { useState, type ReactNode } from "react";
import { useTraining } from "../core/useExercise";
import { t } from "../i18n";
export function ConnectionGate({ children }: { children: ReactNode }) {
  const ex = useTraining(),
    [key, setKey] = useState(""),
    [url, setUrl] = useState("");
  const keyRole = ["trainer", "safety", "assessor"].includes(ex.role);
  if (!ex.authenticated)
    return (
      <main className="training-app">
        <section className="training-login">
          <span className="eyebrow">SCREENFORGE / EXERCISE CONTROL</span>
          <h1>{t(keyRole ? "gate.signIn" : "gate.assignDevice")}</h1>
          <p>{t(keyRole ? "gate.signInHint" : "gate.assignHint")}</p>
          {ex.error && <p role="alert">{ex.error}</p>}
          {keyRole ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ex.login(key.trim());
              }}
            >
              <label>
                {t("gate.trainerKey")}
                <input
                  type="password"
                  autoComplete="off"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  required
                />
              </label>
              <button className="primary" type="submit">
                {t("gate.connect")}
              </button>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  const target = new URL(url);
                  if (
                    target.origin !== location.origin ||
                    !new URLSearchParams(target.hash.slice(1)).has("invite")
                  )
                    throw new Error();
                  location.assign(target.href);
                } catch {
                  ex.setError(t("gate.invalidLink"));
                }
              }}
            >
              <label>
                {t("gate.assignLink")}
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </label>
              <button type="submit">{t("gate.assign")}</button>
            </form>
          )}
          <a href="/?mode=film">{t("gate.openFilm")}</a>
        </section>
      </main>
    );
  return (
    <>
      <div className="connection-status" role="status">
        {!ex.online && t("gate.disconnected")}
        {ex.error && (
          <span role="alert">
            {ex.error}
            <button
              onClick={() => ex.setError("")}
              aria-label={t("gate.closeMessage")}
            >
              ×
            </button>
          </span>
        )}
      </div>
      {children}
    </>
  );
}
