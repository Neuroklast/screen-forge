import { useEffect, useState } from "react";
import { sessionFromSearch, type Depth } from "../core/session";
import "./startpage.css";

const depthKey = "screenforge.depth.v1";
const resumeKey = "screenforge.start.v1";

type Resume = { mode: string; room?: string; at: number };

function readDepth(): Depth {
  try {
    return localStorage.getItem(depthKey) === "advanced" ? "advanced" : "guided";
  } catch {
    return "guided";
  }
}

function readResume(): Resume | null {
  try {
    const raw = localStorage.getItem(resumeKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "mode" in parsed &&
      "at" in parsed
    ) {
      const resume = parsed as Resume;
      if (Date.now() - resume.at < 7 * 24 * 3600 * 1000) return resume;
    }
    return null;
  } catch {
    return null;
  }
}

export function StartPage() {
  const session = sessionFromSearch(location.search);
  const [depth, setDepth] = useState<Depth>(readDepth);
  const [server, setServer] = useState<"checking" | "online" | "offline">(
    "checking",
  );
  const [resume] = useState<Resume | null>(readResume);

  useEffect(() => {
    try {
      localStorage.setItem(depthKey, depth);
    } catch {
      /* private browsing */
    }
  }, [depth]);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const res = await fetch("/health", { cache: "no-store" });
        const type = res.headers.get("content-type") || "";
        if (alive)
          setServer(
            res.ok && (type.includes("text/plain") || type.includes("application/json"))
              ? "online"
              : "offline",
          );
      } catch {
        if (alive) setServer("offline");
      }
    };
    void check();
    const timer = setInterval(check, 5000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const open = (href: string, mode: string, room?: string) => {
    try {
      localStorage.setItem(
        resumeKey,
        JSON.stringify({ mode, room, at: Date.now() }),
      );
    } catch {
      /* private browsing */
    }
    location.assign(href);
  };

  const serverLabel =
    server === "checking"
      ? "Prüfe Server…"
      : server === "online"
        ? "Server erreichbar"
        : "Offline";

  const resumeHref = (target: Resume) =>
    target.mode === "film"
      ? "/?mode=film"
      : `/?role=excon${target.room ? `&room=${encodeURIComponent(target.room)}` : ""}`;

  return (
    <main className="startpage">
      <header className="startpage-header">
        <span className="startpage-mark">
          S<span>/</span>F
        </span>
        <strong>ScreenForge</strong>
        <span className={`startpage-server is-${server}`} role="status">
          {serverLabel}
        </span>
      </header>

      {session.demo && (
        <p className="startpage-notice" role="status">
          Der Demo-Modus wird in Phase 6 ergänzt. Wähle bis dahin Film &amp; TV
          oder Training.
        </p>
      )}

      <section className="startpage-intro">
        <h1>Modus wählen</h1>
        <p>
          Fiktive Systemoberflächen für Produktion und Training. Alle Systeme
          sind Fiktion.
        </p>
      </section>

      <section className="mode-cards" aria-label="Modi">
        <button
          className="mode-card"
          onClick={() => open("/?mode=film", "film")}
        >
          <span className="mode-code">01</span>
          <strong>Film &amp; TV</strong>
          <span>Szenen, Abläufe und Bühnenausgabe</span>
          <span className="mode-action">Öffnen</span>
        </button>
        <button
          className="mode-card"
          onClick={() => open("/?mode=training", "training")}
        >
          <span className="mode-code">02</span>
          <strong>Training</strong>
          <span>Einsätze, Geräte und Übungsleitung</span>
          <span className="mode-action">Öffnen</span>
        </button>
        <button className="mode-card is-disabled" disabled aria-disabled="true">
          <span className="mode-code">03</span>
          <strong>Demo</strong>
          <span>Offline-Vorführung in fünf Minuten</span>
          <span className="mode-action">In Vorbereitung</span>
        </button>
      </section>

      {resume && (
        <section className="startpage-row" aria-label="Fortsetzen">
          <span className="startpage-row-label">Zuletzt</span>
          <button
            className="text-link"
            onClick={() => open(resumeHref(resume), resume.mode, resume.room)}
          >
            {resume.mode === "film"
              ? "Film & TV fortsetzen"
              : `Training fortsetzen${resume.room ? ` · ${resume.room}` : ""}`}
          </button>
        </section>
      )}

      <section className="startpage-row" aria-label="Direkt">
        <span className="startpage-row-label">Direkt</span>
        <button
          className="text-link"
          onClick={() => open("/?role=player", "training")}
        >
          Gerät verbinden
        </button>
        <button
          className="text-link"
          onClick={() => open("/?role=excon", "training")}
        >
          Übungsleitung
        </button>
        <button
          className="text-link"
          onClick={() => open("/?role=hq", "training")}
        >
          HQ
        </button>
      </section>

      <section className="startpage-row" aria-label="Tiefe">
        <span className="startpage-row-label">Tiefe</span>
        <div className="depth-toggle" role="group" aria-label="Bedientiefe">
          <button
            className={depth === "guided" ? "active" : ""}
            aria-pressed={depth === "guided"}
            onClick={() => setDepth("guided")}
          >
            Geführt
          </button>
          <button
            className={depth === "advanced" ? "active" : ""}
            aria-pressed={depth === "advanced"}
            onClick={() => setDepth("advanced")}
          >
            Experte
          </button>
        </div>
      </section>

      <footer className="startpage-footer">
        <span>Fiktive Systeme. Keine realen Daten, keine Waffentechnik.</span>
        <span>ScreenForge V.01</span>
      </footer>
    </main>
  );
}
