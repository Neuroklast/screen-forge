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
  Monitor,
  ArrowUpRight,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import {
  defaults,
  scenePalette,
  downloadPreset,
  loadConfig,
  scenes,
  schema,
  type Config,
  type SceneId,
  keepLook,
  withScene,
} from "./core/config";
import { formatTime, useSceneClock, type Cue } from "./core/runtime";
import { setSoundEnabled } from "./core/sound";
import { TokenEditor } from "./components/TokenEditor";
import { CodePad } from "./components/CodePad";
import { MediaManager } from "./components/MediaManager";
import { SequenceEditor } from "./components/SequenceEditor";
import {
  failStep,
  loadShow,
  nextStep,
  triggerMatches,
  type Step,
} from "./core/director";
import {
  appendTake,
  downloadTakeLog,
  type TakeEvent,
} from "./core/takeLog";
import { SystemProfiles } from "./components/SystemProfiles";
import { ThemeEditor } from "./components/ThemeEditor";
import { DisplayOverlays } from "./scenes/os/Overlays";
import { sceneComponents } from "./scenes/Scenes";
import { stageFormats, stageOf, stageOrient, stageRecipe } from "./core/stage";
import { onAccent } from "./core/contrast";
export default function App() {
  const [config, setConfig] = useState<Config>(loadConfig),
    [cue, setCue] = useState<Cue>("idle"),
    [take, setTake] = useState(1),
    [settings, setSettings] = useState(false),
    [clean, setClean] = useState(
      () =>
        typeof location !== "undefined" &&
        new URLSearchParams(location.search).has("kiosk"),
    ),
    [notice, setNotice] = useState(""),
    [timelineEnd, setTimelineEnd] = useState(0);
  const [configTab, setConfigTab] = useState("content"),
    [directorTab, setDirectorTab] = useState("monitor"),
    [unlocked, setUnlocked] = useState(false);
  const [show, setShow] = useState(loadShow),
    [running, setRunning] = useState<string | null>(null);
  const [takeLog, setTakeLog] = useState<TakeEvent[]>([]);
  const [kioskPin, setKioskPin] = useState("");
  const kiosk =
    typeof location !== "undefined" &&
    new URLSearchParams(location.search).has("kiosk");
  const clock = useSceneClock();
  const training = config.workspace === "training";
  const applyStep = (step: Step) => {
    setUnlocked(false);
    setConfig((c) => ({
      ...keepLook(c, step.config),
      pinEnabled: step.trigger === "pin" || step.config.pinEnabled,
      pin:
        step.trigger === "pin" && /^[A-Za-z0-9]{4,8}$/.test(step.value)
          ? step.value
          : step.config.pin,
    }));
    setCue(step.cue);
    setTake((n) => n + 1);
    clock.seek(0);
    setTimelineEnd(0);
    setRunning(step.id);
    clock.setPlaying(true);
  };
  const noteTake = (kind: TakeEvent["kind"], gate: string) => {
    if (!training) return;
    setTakeLog((log) =>
      appendTake(log, { at: clock.elapsed, kind, gate }),
    );
  };
  const advanceShow = () => {
    if (!running) return;
    const step = show.steps.find((s) => s.id === running);
    noteTake("ok", step?.value || step?.name || running);
    const next = nextStep(show, running);
    if (next) applyStep(next);
    else {
      setRunning(null);
      clock.setPlaying(false);
    }
  };
  const failShow = () => {
    if (!running) return;
    const step = show.steps.find((s) => s.id === running);
    noteTake("fail", step?.value || step?.name || running);
    const next = failStep(show, running);
    if (next) applyStep(next);
    else {
      setRunning(null);
      clock.setPlaying(false);
    }
  };
  useEffect(() => {
    try {
      localStorage.setItem("screenforge.show.v1", JSON.stringify(show));
    } catch {
      setNotice("Ablauf konnte nicht gespeichert werden. Bitte exportieren.");
    }
  }, [show]);
  useEffect(() => {
    setUnlocked(false);
  }, [config.pinEnabled, config.pin, take]);
  useEffect(() => {
    if (!running || !clock.playing) return;
    const step = show.steps.find((s) => s.id === running);
    if (step && triggerMatches(step, clock.elapsed)) advanceShow();
    if (
      training &&
      step &&
      step.timeout > 0 &&
      clock.elapsed >= step.timeout &&
      step.trigger !== "time"
    ) {
      noteTake("timeout", step.value || step.name);
      const next = failStep(show, running);
      if (next) applyStep(next);
      else {
        setRunning(null);
        clock.setPlaying(false);
      }
    }
  }, [clock.elapsed, clock.playing, running, show, training]);
  useEffect(() => {
    const input = (e: Event) => {
      const detail = (e as CustomEvent<{ type: string; value: string }>).detail;
      const step = show.steps.find((s) => s.id === running);
      if (step && clock.playing && triggerMatches(step, clock.elapsed, detail))
        advanceShow();
    };
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest("input,textarea,select") ||
        settings
      )
        return;
      input(
        new CustomEvent("screenforge:input", {
          detail: { type: "key", value: e.key },
        }),
      );
    };
    window.addEventListener("screenforge:input", input);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("screenforge:input", input);
      window.removeEventListener("keydown", key);
    };
  }, [running, show, clock.playing, settings, clock.elapsed]);
  const stage = useRef<HTMLDivElement>(null),
    upload = useRef<HTMLInputElement>(null);
  const [size, setSize] = useState({ width: 1280, height: 720 });
  const selected = scenes.find((x) => x.id === config.scene)!;
  const Scene = sceneComponents[config.scene];
  const update = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));
  const reset = () => {
    setRunning(null);
    clock.reset();
    setTimelineEnd(0);
    setCue("idle");
    setTake((n) => n + 1);
  };
  const select = (id: SceneId) => {
    reset();
    setConfig((c) => withScene(c, id));
    clock.setPlaying(id !== "countdown");
  };
  useEffect(() => {
    try {
      localStorage.setItem("screenforge.config.v1", JSON.stringify(config));
    } catch {
      setNotice("Lokales Speichern nicht verfügbar. Bitte Preset exportieren.");
    }
    setSoundEnabled(config.sound);
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
        if (!kiosk) {
          setClean(false);
          setSettings(false);
        }
        return;
      }
      const target = e.target as HTMLElement;
      if (
        target.closest("input,textarea,select,button") ||
        settings ||
        (config.pinEnabled && !unlocked)
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        clock.setPlaying((p) => !p);
      }
      if (e.key.toLowerCase() === "r") reset();
      if (e.key.toLowerCase() === "h" && !kiosk) setClean((p) => !p);
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
      if (file.size > 400000) throw new Error("Datei zu groß");
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
  const palette = config.palette ?? scenePalette(config.scene);
  const timelineMax = Math.max(config.duration, timelineEnd);
  const stageFmt = stageOf(config.format);
  const scale = Math.min(
    size.width / stageFmt.width,
    size.height / stageFmt.height,
  );
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={`studio director-${directorTab} workspace-${config.workspace} ${clean ? "is-clean" : ""} ${!settings ? "settings-hidden" : ""} ${kiosk ? "is-kiosk" : ""}`}
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
          <nav className="director-nav">
            <button
              className={directorTab === "monitor" ? "active" : ""}
              onClick={() => setDirectorTab("monitor")}
            >
              Regie
            </button>
            <button
              className={directorTab === "sequence" ? "active" : ""}
              onClick={() => setDirectorTab("sequence")}
            >
              Ablaufeditor
            </button>
            <button
              aria-label="Konfiguration öffnen"
              onClick={() => setSettings((v) => !v)}
            >
              Konfiguration
            </button>
          </nav>
          <nav className="workspace-switch" aria-label="Arbeitsmodus">
            <button
              className={config.workspace === "film" ? "active" : ""}
              onClick={() => update("workspace", "film")}
            >
              Film
            </button>
            <button
              className={training ? "active" : ""}
              onClick={() => update("workspace", "training")}
            >
              Training
            </button>
          </nav>
          <div className="project-label">
            <span className="tiny-dot" />
            {training ? "TRAINING" : "FILM / TV"}{" "}
            <span className="version">V.01</span>
          </div>
          <button className="primary-button" onClick={fullscreen}>
            <Monitor size={15} /> Bühne starten <ArrowUpRight size={15} />
          </button>
        </header>
        <nav className="director-scenes" aria-label="Szenen">
          <em>Szenen</em>
          {scenes
            .filter((s) => s.kind === "scene")
            .map((scene) => (
              <button
                key={scene.id}
                className={scene.id === config.scene ? "active" : ""}
                onClick={() => select(scene.id)}
              >
                {scene.name}
              </button>
            ))}
          <em>Bausteine</em>
          {scenes
            .filter((s) => s.kind === "block")
            .map((scene) => (
              <button
                key={scene.id}
                className={scene.id === config.scene ? "active" : ""}
                onClick={() => select(scene.id)}
              >
                {scene.name}
              </button>
            ))}
          <span>{running ? "ABLAUF AKTIV" : "MANUELLE REGIE"}</span>
          <button
            onClick={() => setUnlocked(false)}
            disabled={!config.pinEnabled}
          >
            Zugang sperren
          </button>
        </nav>
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
              <span>
                LIVE PREVIEW / {stageFmt.width} × {stageFmt.height}
              </span>
              <button onClick={fullscreen} aria-label="Vollbild">
                <Maximize size={14} />
              </button>
            </div>
            <div
              className="stage"
              ref={stage}
              style={{ aspectRatio: `${stageFmt.width} / ${stageFmt.height}` }}
            >
              <div
                className={`scene-canvas family-${config.scene} skin-${config.skin} mood-${config.mood} density-${config.density}${config.overlays.glow < 0.08 && config.overlays.chromatic < 0.08 ? " is-flat" : ""}`}
                data-orient={stageOrient(config.format)}
                data-recipe={stageRecipe(config.format)}
                data-format={config.format}
                data-frame={config.frame.style}
                data-workspace={config.workspace}
                style={
                  {
                    ...config.tokens,
                    "--scene-font": {
                      space: "Space Grotesk",
                      matrix: "MatrixType",
                      matrixDisplay: "MatrixTypeDisplay",
                      digit7: "DigitTech7",
                      digit14: "DigitTech14",
                      digit16: "DigitTech16",
                      gridtile: "Gridtile",
                      binary: "codiceBinario",
                    }[config.font],
                    width: stageFmt.width,
                    height: stageFmt.height,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    "--accent": config.accent,
                    "--on-accent": onAccent(config.accent),
                    "--theme-bg": palette.background,
                    "--theme-surface": palette.surface,
                    "--theme-text": palette.text,
                    "--theme-secondary": palette.secondary,
                    "--mood-pulse":
                      (0.4 + Math.sin(clock.elapsed * 2.3) * 0.2) *
                      config.effects,
                    "--fx": config.effects,
                    "--display-glow": config.overlays.glow * config.effects,
                    "--display-chroma":
                      config.overlays.chromatic * config.effects,
                    filter: `brightness(${config.brightness})`,
                  } as CSSProperties
                }
              >
                 <Scene
                  key={`${config.scene}-${take}`}
                  config={config}
                  operation={
                    running
                      ? show.steps.find((s) => s.id === running)?.operation
                      : undefined
                  }
                  time={clock.elapsed}
                  cue={cue}
                  onCue={setCue}
                  onPlay={() => clock.setPlaying(true)}
                  onTimelineExtend={(end) =>
                    setTimelineEnd((t) => Math.max(t, end))
                  }
                />
                {config.pinEnabled && !unlocked && (
                  <CodePad
                    key={take}
                    title={config.title}
                    code={config.pin}
                    mode={config.pinMode}
                    fake={config.pinFake}
                    onUnlock={() => setUnlocked(true)}
                  />
                )}
                <DisplayOverlays config={config} time={clock.elapsed} />
                {training && config.exerciseMark && (
                  <div className="exercise-mark">UNCLASSIFIED // EXERCISE</div>
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
          {directorTab === "sequence" && (
            <SequenceEditor
              show={show}
              onChange={setShow}
              config={config}
              running={running}
              onStart={() => {
                if (show.steps[0]) {
                  applyStep(show.steps[0]);
                  setDirectorTab("monitor");
                }
              }}
              onStop={() => setRunning(null)}
              onAdvance={advanceShow}
            />
          )}
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
              max={timelineMax}
              step=".1"
              value={Math.min(clock.elapsed, timelineMax)}
              onChange={(e) => clock.seek(+e.target.value)}
            />
            <span>{formatTime(timelineMax)}</span>
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
        <aside
          className={`inspector config-menu config-${configTab}`}
          hidden={!settings || clean}
          aria-label="Konfiguration"
        >
          <header className="config-header">
            <strong>Konfiguration</strong>
            <button
              aria-label="Konfiguration schließen"
              onClick={() => setSettings(false)}
            >
              ×
            </button>
          </header>
          <nav className="config-tabs" role="tablist">
            {[
              ["content", "Inhalt"],
              ["systems", "Firmen"],
              ["design", "Gestaltung"],
              ["themes", "Themes"],
              ["effects", "Effekte"],
              ["playback", "Eingaben"],
              ["media", "Medien"],
              ["tokens", "Tokens"],
            ].map(([id, label]) => (
              <button
                role="tab"
                aria-selected={configTab === id}
                key={id}
                onClick={() => setConfigTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="config-body">
            <div data-panel="systems">
              <SystemProfiles
                config={config}
                onChange={setConfig}
                onLoad={(next) => {
                  reset();
                  setConfig(next);
                  clock.setPlaying(next.scene !== "countdown");
                }}
              />
            </div>
            <section data-panel="content">
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
            <section data-panel="design">
              <label>
                Schrift
                <select
                  aria-label="Schrift"
                  value={config.font}
                  onChange={(e) =>
                    update("font", e.target.value as Config["font"])
                  }
                >
                  {[
                    ["space", "Space Grotesk"],
                    ["matrix", "MatrixType"],
                    ["matrixDisplay", "MatrixType Display"],
                    ["digit7", "Digit Tech 7"],
                    ["digit14", "Digit Tech 14"],
                    ["digit16", "Digit Tech 16"],
                    ["gridtile", "Gridtile"],
                    ["binary", "codiceBinario"],
                  ].map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
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
                Bühnenformat
                <select
                  aria-label="Bühnenformat"
                  value={config.format}
                  onChange={(e) =>
                    update("format", e.target.value as Config["format"])
                  }
                >
                  {stageFormats.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} · {f.width}×{f.height}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Elementrahmen
                <select
                  aria-label="Elementrahmen"
                  value={config.frame.style}
                  onChange={(e) =>
                    update("frame", {
                      ...config.frame,
                      style: e.target.value as Config["frame"]["style"],
                    })
                  }
                >
                  <option value="hud">HUD</option>
                  <option value="plate">Platte</option>
                  <option value="none">Ohne</option>
                </select>
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
                Effektstärke{" "}
                <output>{Math.round(config.effects * 100)}%</output>
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
            <div data-panel="themes">
              <ThemeEditor config={config} onChange={setConfig} />
            </div>
            <details data-panel="effects" className="overlay-settings" open>
              <summary>Display-Overlays</summary>
              {Object.entries(config.overlays).map(([key, value]) => (
                <label key={key}>
                  {
                    (
                      {
                        scanlines: "Scanlines",
                        glow: "CRT Glow",
                        grid: "Technikraster",
                        grain: "Tech Noise / Körnung",
                        vignette: "Vignette",
                        glitch: "Signalstörungen",
                        chromatic: "Chromatische Kanten",
                      } as Record<string, string>
                    )[key]
                  }
                  <output>{Math.round(value * 100)}%</output>
                  <input
                    aria-label={key}
                    type="range"
                    min="0"
                    max="1"
                    step=".01"
                    value={value}
                    onChange={(e) =>
                      update("overlays", {
                        ...config.overlays,
                        [key]: +e.target.value,
                      })
                    }
                  />
                </label>
              ))}
            </details>{" "}
            <section data-panel="playback">
              <label>
                <input
                  type="checkbox"
                  checked={config.pinEnabled}
                  onChange={(e) => update("pinEnabled", e.target.checked)}
                />{" "}
                Code-Tastenfeld aktivieren
              </label>
              <label>
                Tastenfeld
                <select
                  aria-label="Tastenfeldmodus"
                  value={config.pinMode}
                  onChange={(e) =>
                    update("pinMode", e.target.value as Config["pinMode"])
                  }
                >
                  <option value="numeric">Numerisch</option>
                  <option value="alphanumeric">Alphanumerisch</option>
                </select>
              </label>
              <label>
                Zugangscode
                <input
                  aria-label="Zugangscode konfigurieren"
                  inputMode={
                    config.pinMode === "numeric" ? "numeric" : "text"
                  }
                  maxLength={8}
                  defaultValue={config.pin}
                  key={config.pin + config.pinMode}
                  onBlur={(e) => {
                    const ok =
                      config.pinMode === "numeric"
                        ? /^\d{4,8}$/.test(e.target.value)
                        : /^[A-Za-z0-9]{4,8}$/.test(e.target.value);
                    if (ok) update("pin", e.target.value.toUpperCase());
                    else e.target.value = config.pin;
                  }}
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={config.pinFake}
                  onChange={(e) => update("pinFake", e.target.checked)}
                />{" "}
                Inszenierung (jeder 4–8-stellige Code)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={config.sound}
                  onChange={(e) => {
                    update("sound", e.target.checked);
                    setSoundEnabled(e.target.checked);
                  }}
                />{" "}
                Szenen-Sounds
              </label>
              <div className="inspector-section-title">
                <span>03</span> Ablauf
              </div>
              {training && (
                <>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={config.exerciseMark}
                      onChange={(e) =>
                        update("exerciseMark", e.target.checked)
                      }
                    />{" "}
                    EXERCISE-Kennung auf der Bühne
                  </label>
                  <label>
                    Instructor-PIN
                    <input
                      aria-label="Instructor-PIN"
                      defaultValue={config.instructorPin}
                      maxLength={8}
                      onBlur={(e) => {
                        const v = e.target.value;
                        if (/^[A-Za-z0-9]{4,8}$/.test(v))
                          update("instructorPin", v);
                      }}
                    />
                  </label>
                  <p className="inspector-hint">
                    Kiosk: gleiche URL mit ?kiosk=1. Studio nur mit Instructor-PIN.
                  </p>
                  <button
                    type="button"
                    onClick={() => downloadTakeLog(show.name, takeLog)}
                    disabled={!takeLog.length}
                  >
                    Take-Log exportieren ({takeLog.length})
                  </button>
                </>
              )}
              {config.scene === "countdown" && (
                <label>
                  Gerätetyp
                  <select
                    aria-label="Gerätetyp"
                    value={config.device}
                    onChange={(e) => {
                      reset();
                      setConfig({
                        ...config,
                        device: e.target.value as Config["device"],
                      });
                    }}
                  >
                    <option value="antimatter">Containment-Baugruppe</option>
                    <option value="nuclear">Spaltmaterial-Baugruppe</option>
                  </select>
                </label>
              )}
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
                  <label>
                    Sequenzdauer <output>×{config.sequenceScale}</output>
                    <input
                      aria-label="Sequenzdauer"
                      type="range"
                      min=".25"
                      max="4"
                      step=".25"
                      value={config.sequenceScale}
                      onChange={(e) => update("sequenceScale", +e.target.value)}
                    />
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={config.actorMode}
                      onChange={(e) => update("actorMode", e.target.checked)}
                    />{" "}
                    Vorbereitetes Tippen
                  </label>
                  <label>
                    Befehle bis Erfolg
                    <input
                      aria-label="Befehle bis Erfolg"
                      type="number"
                      min={1}
                      max={40}
                      value={config.commandsUntilSuccess}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isInteger(n) && n >= 1 && n <= 40)
                          update("commandsUntilSuccess", n);
                      }}
                    />
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
            <div data-panel="tokens">
              <TokenEditor config={config} onChange={setConfig} />
            </div>
            <div data-panel="media">
              <MediaManager config={config} onChange={setConfig} />
            </div>
          </div>
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
              onClick={() => {
                reset();
                setConfig({
                  ...defaults(config.scene),
                  workspace: config.workspace,
                  instructorPin: config.instructorPin,
                  exerciseMark: config.exerciseMark,
                });
                clock.setPlaying(config.scene !== "countdown");
              }}
            >
              Originaldesign wiederherstellen
            </button>
          </div>
        </aside>
        {clean &&
          (kiosk ? (
            <form
              className="exit-stage kiosk-gate"
              onSubmit={(e) => {
                e.preventDefault();
                if (kioskPin === config.instructorPin) {
                  setClean(false);
                  setKioskPin("");
                }
              }}
            >
              <input
                aria-label="Instructor-PIN"
                value={kioskPin}
                maxLength={8}
                placeholder="PIN"
                onChange={(e) => setKioskPin(e.target.value)}
              />
            </form>
          ) : (
            <button
              className="exit-stage"
              onClick={exitClean}
              aria-label="Bühne verlassen"
            >
              <X size={16} /> Studio
            </button>
          ))}
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
