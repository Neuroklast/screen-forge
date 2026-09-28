import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize,
  SlidersHorizontal,
  Download,
  Upload,
  ChevronRight,
  Monitor,
  Crosshair,
  Layers,
  ArrowUpRight,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import {
  defaults,
  downloadPreset,
  loadConfig,
  scenes,
  schema,
  type Config,
  type SceneId,
} from "./core/config";
import { formatTime, useSceneClock, type Cue } from "./core/runtime";
import { sceneComponents } from "./scenes/Scenes";
export default function App() {
  const [config, setConfig] = useState<Config>(loadConfig),
    [cue, setCue] = useState<Cue>("idle"),
    [take, setTake] = useState(1),
    [settings, setSettings] = useState(true),
    [clean, setClean] = useState(false),
    [notice, setNotice] = useState("");
  const clock = useSceneClock();
  const stage = useRef<HTMLDivElement>(null),
    upload = useRef<HTMLInputElement>(null);
  const [size, setSize] = useState({ width: 1280, height: 760 });
  const selected = scenes.find((x) => x.id === config.scene)!;
  const Scene = sceneComponents[config.scene];
  const update = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));
  const reset = () => {
    clock.reset();
    setCue("idle");
    setTake((n) => n + 1);
  };
  const select = (id: SceneId) => {
    reset();
    setConfig(defaults(id));
  };
  useEffect(() => {
    try {
      localStorage.setItem("screenforge.config.v1", JSON.stringify(config));
    } catch {
      setNotice("Lokales Speichern nicht verfügbar. Bitte Preset exportieren.");
    }
  }, [config]);
  useEffect(() => {
    if (!stage.current) return;
    const observer = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ width: r.width, height: r.height });
    });
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setClean(false);
        return;
      }
      const target = e.target as HTMLElement;
      if (target.closest("input,textarea,select,button")) return;
      if (e.code === "Space") {
        e.preventDefault();
        clock.setPlaying((p) => !p);
      }
      if (e.key.toLowerCase() === "r") reset();
      if (e.key.toLowerCase() === "h") setClean((p) => !p);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  });
  useEffect(() => {
    if (
      config.scene === "countdown" &&
      clock.elapsed >= config.duration &&
      clock.playing
    ) {
      clock.setPlaying(false);
      clock.seek(config.duration);
    }
  }, [clock.elapsed, clock.playing, config.scene, config.duration]);
  const fullscreen = async () => {
    setClean(true);
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      setNotice(
        "Bühnenmodus aktiv. Browser-Vollbild bei Bedarf mit F11 starten.",
      );
    }
  };
  const exitClean = () => {
    setClean(false);
    if (document.fullscreenElement)
      void document.exitFullscreen().catch(() => {});
  };
  const importPreset = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 100000) throw new Error("Datei zu groß");
      const next = schema.parse(JSON.parse(await file.text()));
      reset();
      setConfig(next);
      setNotice("Preset geladen.");
    } catch {
      setNotice(
        "Ungültiges Preset. Erwartet wird eine ScreenForge JSON-Datei, Version 1.",
      );
    }
    if (upload.current) upload.current.value = "";
  };
  const scale = Math.min(size.width / 1280, size.height / 760);
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={`studio ${clean ? "is-clean" : ""} ${!settings ? "settings-hidden" : ""}`}
      >
        <header className="studio-header">
          <a className="wordmark" href="#" onClick={(e) => e.preventDefault()}>
            <span className="app-symbol">
              S<span>/</span>F
            </span>
            <strong>
              ScreenForge<span>SCREEN GRAPHICS STUDIO</span>
            </strong>
          </a>
          <div className="project-label">
            <span className="tiny-dot" />
            LOCAL WORKSPACE <span className="version">V.01</span>
          </div>
          <button className="primary-button" onClick={fullscreen}>
            <Monitor size={15} /> Bühne starten <ArrowUpRight size={15} />
          </button>
        </header>
        <aside className="scene-library">
          <div className="sidebar-heading">
            <span>SZENENBIBLIOTHEK</span>
            <span>05</span>
          </div>
          <div className="library-intro">
            Oberflächen
            <br />
            <span>für den Dreh.</span>
          </div>
          <nav>
            {scenes.map((s, i) => (
              <button
                key={s.id}
                className={`scene-card ${config.scene === s.id ? "active" : ""}`}
                onClick={() => select(s.id)}
                style={{ "--card-accent": s.accent } as CSSProperties}
              >
                <div className={`scene-thumbnail thumb-${s.id}`}>
                  <span className="thumb-line" />
                  <span className="thumb-visual">
                    {i === 0 ? (
                      "V /"
                    ) : i === 1 ? (
                      ">_"
                    ) : i === 2 ? (
                      "02:59"
                    ) : i === 3 ? (
                      <Crosshair size={38} strokeWidth={1} />
                    ) : (
                      "◇"
                    )}
                  </span>
                  <small>{s.code.split(" / ")[1]}</small>
                </div>
                <div className="scene-card-title">
                  <span>{s.name}</span>
                  <ChevronRight size={14} />
                </div>
                <p>{s.description}</p>
              </button>
            ))}
          </nav>
          <div className="library-footer">
            <Layers size={15} />
            <span>
              5 Szenen · lokal verfügbar
              <br />
              <small>Keine Verbindung erforderlich</small>
            </span>
          </div>
        </aside>
        <main className="workspace">
          <div className="workspace-heading">
            <div>
              <span className="eyebrow">SCENE {selected.code}</span>
              <h1>{selected.name}</h1>
            </div>
            <button
              className={`icon-button ${settings ? "selected" : ""}`}
              aria-label="Design-Einstellungen"
              onClick={() => setSettings((p) => !p)}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
          <div className="stage-shell">
            <div className="stage-topline">
              <span>
                <span className="tiny-dot" />
                {clock.playing ? "PLAYING" : "STANDBY"}
              </span>
              <span>LIVE PREVIEW / 1280 × 760</span>
              <button onClick={fullscreen} aria-label="Vollbild">
                <Maximize size={14} />
              </button>
            </div>
            <div className="stage" ref={stage}>
              <div
                className={`scene-canvas family-${config.scene} mood-${config.mood} density-${config.density}`}
                style={
                  {
                    width: 1280,
                    height: 760,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    "--accent": config.accent,
                    "--fx": config.effects,
                    filter: `brightness(${config.brightness})`,
                  } as CSSProperties
                }
              >
                <Scene
                  key={`${config.scene}-${take}`}
                  config={config}
                  time={clock.elapsed}
                  cue={cue}
                  onCue={setCue}
                />
                <div
                  className="display-texture"
                  style={{ opacity: config.effects * 0.22 }}
                />
                {config.mood === "damaged" && config.effects > 0 && (
                  <div
                    className="damage-band"
                    style={{
                      opacity: config.effects * 0.1,
                      top: `${20 + (Math.floor(clock.elapsed / 3) % 5) * 13}%`,
                    }}
                  />
                )}
              </div>
            </div>
            <div className="stage-bottomline">
              <span>POINTER + MULTITOUCH</span>
              <span>
                TAKE {take.toString().padStart(2, "0")} /{" "}
                {config.mood.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="transport">
            <div className="playback">
              <button
                className="play-button"
                aria-label={clock.playing ? "Pause" : "Abspielen"}
                onClick={() => clock.setPlaying((p) => !p)}
              >
                {clock.playing ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                className="icon-button"
                aria-label="Take zurücksetzen"
                onClick={reset}
              >
                <RotateCcw size={17} />
              </button>
              <div className="transport-time">
                {formatTime(clock.elapsed)}
                <small>SCENE TIME</small>
              </div>
            </div>
            <div className="cue-buttons">
              {(["idle", "active", "warning", "complete"] as Cue[]).map(
                (c, i) => (
                  <button
                    key={c}
                    className={cue === c ? "current" : ""}
                    onClick={() => setCue(c)}
                  >
                    {["Ruhe", "Aktion", "Warnung", "Abschluss"][i]}
                  </button>
                ),
              )}
            </div>
            <button
              className="text-button clean-trigger"
              onClick={() => setClean(true)}
            >
              Nur Ausgabe <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="timeline">
            <span>00:00</span>
            <input
              aria-label="Szenenzeit"
              type="range"
              min="0"
              max={config.duration}
              step=".1"
              value={Math.min(clock.elapsed, config.duration)}
              onChange={(e) => clock.seek(+e.target.value)}
            />
            <span>{formatTime(config.duration)}</span>
          </div>
          <div className="workspace-note">
            <span>
              <Check size={13} />{" "}
              {config.scene === "hologram" || config.scene === "tracking"
                ? "Ziehen, Pinch und Rotation auf der Grafik aktiv."
                : "Interaktive Elemente reagieren direkt auf Berührung."}
            </span>
            <span>SPACE Play / Pause · R Reset · H Ausgabe</span>
          </div>
        </main>
        <aside className="inspector">
          <div className="sidebar-heading">
            <span>ART DIRECTION</span>
            <SlidersHorizontal size={14} />
          </div>
          <section>
            <div className="inspector-section-title">
              <span>01</span> Inhalt
            </div>
            <label>
              Titel
              <input
                value={config.title}
                onBlur={() => {
                  if (!config.title.trim()) update("title", selected.title);
                }}
                maxLength={40}
                onChange={(e) => update("title", e.target.value)}
              />
            </label>
            <label>
              Unterzeile
              <input
                value={config.subtitle}
                maxLength={70}
                onChange={(e) => update("subtitle", e.target.value)}
              />
            </label>
            <label>
              Gerätekennung
              <input
                value={config.identifier}
                maxLength={24}
                onChange={(e) => update("identifier", e.target.value)}
              />
            </label>
          </section>
          <section>
            <div className="inspector-section-title">
              <span>02</span> Bildsprache
            </div>
            <label>
              Stimmung
              <select
                value={config.mood}
                onChange={(e) =>
                  update("mood", e.target.value as Config["mood"])
                }
              >
                <option value="clinical">Klinisch / Präzise</option>
                <option value="tense">Bedrohlich / Kontrastreich</option>
                <option value="damaged">Beschädigt / Signalstörung</option>
              </select>
            </label>
            <label className="color-label">
              Akzentfarbe{" "}
              <div>
                <span>{config.accent.toUpperCase()}</span>
                <input
                  aria-label="Akzentfarbe"
                  type="color"
                  value={config.accent}
                  onChange={(e) => update("accent", e.target.value)}
                />
              </div>
            </label>
            <label>
              Informationsdichte
              <select
                value={config.density}
                onChange={(e) =>
                  update("density", e.target.value as Config["density"])
                }
              >
                <option value="detailed">Detailliert</option>
                <option value="focused">Fokussiert</option>
              </select>
            </label>
            <label>
              Effektstärke <output>{Math.round(config.effects * 100)}%</output>
              <input
                type="range"
                min="0"
                max="1"
                step=".01"
                value={config.effects}
                onChange={(e) => update("effects", +e.target.value)}
              />
            </label>
            <label>
              Displayhelligkeit{" "}
              <output>{Math.round(config.brightness * 100)}%</output>
              <input
                type="range"
                min=".5"
                max="1.25"
                step=".01"
                value={config.brightness}
                onChange={(e) => update("brightness", +e.target.value)}
              />
            </label>
          </section>
          <section>
            <div className="inspector-section-title">
              <span>03</span> Ablauf
            </div>
            <label>
              Dauer in Sekunden
              <input
                type="number"
                min={1}
                max={35999}
                value={config.duration}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isInteger(n) && n >= 1 && n <= 35999)
                    update("duration", n);
                }}
              />
            </label>
            {config.scene === "terminal" && (
              <>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={config.actorMode}
                    onChange={(e) => update("actorMode", e.target.checked)}
                  />{" "}
                  Vorbereitetes Tippen
                </label>
                <label>
                  Vorbereiteter Befehl
                  <textarea
                    value={config.script}
                    maxLength={300}
                    onChange={(e) => update("script", e.target.value)}
                  />
                </label>
              </>
            )}
            <p className="inspector-hint">
              Zeit und Anzeigen bleiben beim Pausieren stehen. Reset setzt den
              gesamten Take zurück.
            </p>
          </section>
          <div className="preset-actions">
            <button onClick={() => downloadPreset(config)}>
              <Download size={14} />
              Exportieren
            </button>
            <button onClick={() => upload.current?.click()}>
              <Upload size={14} />
              Importieren
            </button>
            <input
              ref={upload}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(e) => void importPreset(e.target.files?.[0])}
            />
            <button
              className="reset-design"
              onClick={() => select(config.scene)}
            >
              Originaldesign wiederherstellen
            </button>
          </div>
        </aside>
        {clean && (
          <button
            className="exit-stage"
            onClick={exitClean}
            aria-label="Bühne verlassen"
          >
            <X size={16} /> Studio
          </button>
        )}
        <AnimatePresence>
          {notice && (
            <motion.div
              className="toast"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="status"
            >
              <AlertTriangle size={16} />
              {notice}
              <button
                aria-label="Hinweis schließen"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
