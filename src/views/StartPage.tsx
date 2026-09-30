import { useEffect, useState } from "react";
import { sessionFromSearch, type Depth } from "../core/session";
import { t } from "../i18n";
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
      ? t("start.checking")
      : server === "online"
        ? t("start.online")
        : t("start.offline");

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
          {t("start.demoNotice")}
        </p>
      )}

      <section className="startpage-intro">
        <h1>{t("start.chooseMode")}</h1>
        <p>{t("start.intro")}</p>
      </section>

      <section className="mode-cards" aria-label={t("start.modes")}>
        <button
          className="mode-card"
          onClick={() => open("/?mode=film", "film")}
        >
          <span className="mode-code">01</span>
          <strong>{t("start.film")}</strong>
          <span>{t("start.filmDesc")}</span>
          <span className="mode-action">{t("start.open")}</span>
        </button>
        <button
          className="mode-card"
          onClick={() => open("/?mode=training", "training")}
        >
          <span className="mode-code">02</span>
          <strong>{t("start.training")}</strong>
          <span>{t("start.trainingDesc")}</span>
          <span className="mode-action">{t("start.open")}</span>
        </button>
        <button
          className="mode-card"
          onClick={() => open("/?demo=1", "demo")}
        >
          <span className="mode-code">03</span>
          <strong>{t("start.demo")}</strong>
          <span>{t("start.demoDesc")}</span>
          <span className="mode-action">{t("start.open")}</span>
        </button>
      </section>

      {resume && (
        <section className="startpage-row" aria-label={t("start.resume")}>
          <span className="startpage-row-label">{t("start.last")}</span>
          <button
            className="text-link"
            onClick={() => open(resumeHref(resume), resume.mode, resume.room)}
          >
            {resume.mode === "film"
              ? t("start.resumeFilm")
              : `${t("start.resumeTraining")}${resume.room ? ` · ${resume.room}` : ""}`}
          </button>
        </section>
      )}

      <section className="startpage-row" aria-label={t("start.direct")}>
        <span className="startpage-row-label">{t("start.direct")}</span>
        <button
          className="text-link"
          onClick={() => open("/?role=player", "training")}
        >
          {t("start.connectDevice")}
        </button>
        <button
          className="text-link"
          onClick={() => open("/?role=excon", "training")}
        >
          {t("start.excon")}
        </button>
        <button
          className="text-link"
          onClick={() => open("/?role=hq", "training")}
        >
          HQ
        </button>
        <button
          className="text-link"
          onClick={() => open("/?role=safety", "training")}
        >
          {t("start.safety")}
        </button>
        <button
          className="text-link"
          onClick={() => open("/?role=assessor", "training")}
        >
          {t("start.assessor")}
        </button>
      </section>

      <section className="startpage-row" aria-label={t("start.depth")}>
        <span className="startpage-row-label">{t("start.depth")}</span>
        <div className="depth-toggle" role="group" aria-label={t("start.depthGroup")}>
          <button
            className={depth === "guided" ? "active" : ""}
            aria-pressed={depth === "guided"}
            onClick={() => setDepth("guided")}
          >
            {t("start.guided")}
          </button>
          <button
            className={depth === "advanced" ? "active" : ""}
            aria-pressed={depth === "advanced"}
            onClick={() => setDepth("advanced")}
          >
            {t("start.expert")}
          </button>
        </div>
      </section>

      <footer className="startpage-footer">
        <span>{t("start.footer")}</span>
        <span>ScreenForge V.01</span>
      </footer>
    </main>
  );
}
