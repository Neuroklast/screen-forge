import { useState, type ReactNode } from "react";
import { useTraining } from "../core/useExercise";
export function ConnectionGate({ children }: { children: ReactNode }) {
  const ex = useTraining(),
    [key, setKey] = useState(""),
    [url, setUrl] = useState("");
  if (!ex.authenticated)
    return (
      <main className="training-app">
        <section className="training-login">
          <span className="eyebrow">SCREENFORGE / EXERCISE CONTROL</span>
          <h1>
            {ex.role === "trainer" ? "Trainer anmelden" : "Gerät zuweisen"}
          </h1>
          <p>
            {ex.role === "trainer"
              ? "Den Trainer-Schlüssel zeigt das Serverfenster beim Start. Der Zugang gilt für diesen Browser-Tab."
              : "QR-Code auf dem Trainerbildschirm mit der Systemkamera scannen und den Link öffnen. Alternativ den Zuweisungslink einfügen."}
          </p>
          {ex.error && <p role="alert">{ex.error}</p>}
          {ex.role === "trainer" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ex.login(key.trim());
              }}
            >
              <label>
                Trainer-Schlüssel
                <input
                  type="password"
                  autoComplete="off"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  required
                />
              </label>
              <button className="primary" type="submit">
                Verbinden
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
                  ex.setError("Ungültiger Zuweisungslink für diesen Server.");
                }
              }}
            >
              <label>
                Zuweisungslink
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </label>
              <button type="submit">Zuweisen</button>
            </form>
          )}
          <a href="/?mode=film">Filmstudio öffnen</a>
        </section>
      </main>
    );
  return (
    <>
      <div className="connection-status" role="status">
        {!ex.online &&
          "Verbindung unterbrochen. Angezeigte Daten sind veraltet."}
        {ex.error && (
          <span role="alert">
            {ex.error}
            <button
              onClick={() => ex.setError("")}
              aria-label="Meldung schließen"
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
