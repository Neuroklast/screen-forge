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
import { labelFor } from "./core/labels";
import { setSoundEnabled } from "./core/sound";
import { t } from "./i18n";
import { TokenEditor } from "./components/TokenEditor";
import { CodePad } from "./components/CodePad";
import { MediaManager } from "./components/MediaManager";
import { SequenceEditor } from "./components/SequenceEditor";
import { terminalScript, terminalScripts } from "./core/terminalScripts";
import {
  entryStep,
  failStep,
  loadShow,
  nextStep,
  stepById,
  timeoutStep,
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
const ELEMENT_SCENES: SceneId[] = [
  "countdown",
  "tracking",
  "hologram",
  "clock",
  "rotary",
  "code-table",
  "data-sheet",
  "os",
  "terminal",
];
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
    [unlocked, setUnlocked] = useState(false),
    [configWidth, setConfigWidth] = useState(() => {
      try {
        const stored = Number(localStorage.getItem("screenforge.inspectorWidth"));
        return stored >= 360 && stored <= 900 ? stored : 560;
      } catch {
        return 560;
      }
    });
  const [show, setShow] = useState(loadShow),
    [running, setRunning] = useState<string | null>(null);
  const [takeLog, setTakeLog] = useState<TakeEvent[]>([]);
  const [kioskPin, setKioskPin] = useState("");
  const kiosk =
    typeof location !== "undefined" &&
    new URLSearchParams(location.search).has("kiosk");
  const clock = useSceneClock();
  const rehearsal = config.workspace === "rehearsal";
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
    if (!rehearsal) return;
    setTakeLog((log) =>
      appendTake(log, { at: clock.elapsed, kind, gate }),
    );
  };
  const advanceShow = () => {
    if (!running) return;
    const step = stepById(show, running);
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
    const step = stepById(show, running);
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
      setNotice(t("studio.sequenceSaveFailed"));
    }
  }, [show]);
  useEffect(() => {
    setUnlocked(false);
  }, [config.pinEnabled, config.pin, take]);
  useEffect(() => {
    if (!running || !clock.playing) return;
    const step = stepById(show, running);
    if (step && triggerMatches(step, clock.elapsed)) advanceShow();
    if (
      step &&
      step.timeout > 0 &&
      clock.elapsed >= step.timeout &&
      step.trigger !== "time"
    ) {
      noteTake("timeout", step.value || step.name);
      const next = timeoutStep(show, running);
      if (next) applyStep(next);
      else {
        setRunning(null);
        clock.setPlaying(false);
      }
    }
  }, [clock.elapsed, clock.playing, running, show]);
  useEffect(() => {
    const input = (e: Event) => {
      const detail = (e as CustomEvent<{ type: string; value: string }>).detail;
      const step = running ? stepById(show, running) : undefined;
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
  const updateSceneOptions = <K extends keyof Config["sceneOptions"]>(
    section: K,
    value: Partial<Config["sceneOptions"][K]>,
  ) =>
    setConfig((c) => ({
      ...c,
      sceneOptions: {
        ...c.sceneOptions,
        [section]: { ...c.sceneOptions[section], ...value },
      },
    }));
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
      setNotice(t("studio.localSaveUnavailable"));
    }
    setSoundEnabled(config.sound);
  }, [config]);
  useEffect(() => {
    try {
      localStorage.setItem(
        "screenforge.inspectorWidth",
        String(configWidth),
      );
    } catch {
      /* private browsing */
    }
  }, [configWidth]);
  const startInspectorResize = (event: React.PointerEvent) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = configWidth;
    const onMove = (move: PointerEvent) => {
      const max = Math.min(900, window.innerWidth - 40);
      setConfigWidth(
        Math.min(Math.max(360, startWidth + (startX - move.clientX)), max),
      );
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };
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
        t("studio.stageModeActive"),
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
      if (file.size > 400000) throw new Error(t("studio.fileTooBig"));
      const next = schema.parse(JSON.parse(await file.text()));
      reset();
      setConfig(next);
      setNotice(t("studio.presetLoaded"));
    } catch {
      setNotice(
        t("studio.invalidPreset"),
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
              {t("studio.direction")}
            </button>
            <button
              className={directorTab === "sequence" ? "active" : ""}
              onClick={() => setDirectorTab("sequence")}
            >
              {t("studio.sequenceEditor")}
            </button>
            <button
              aria-label={t("studio.openConfig")}
              onClick={() => setSettings((v) => !v)}
            >
              {t("studio.configuration")}
            </button>
          </nav>
          <a className="training-entry" href="/?role=trainer">{t("studio.exerciseControl")}</a>
          <nav className="workspace-switch" aria-label={t("studio.workMode")}>
            <button
              className={config.workspace === "film" ? "active" : ""}
              onClick={() => update("workspace", "film")}
            >
              {t("studio.film")}
            </button>
            <button
              className={rehearsal ? "active" : ""}
              onClick={() => update("workspace", "rehearsal")}
            >
              {t("studio.training")}
            </button>
          </nav>
          <div className="project-label">
            <span className="tiny-dot" />
            {t("studio.filmTv")}{" "}
            <span className="version">
              {t(rehearsal ? "studio.training" : "studio.film")}
            </span>
          </div>
          <button className="primary-button" onClick={fullscreen}>
            <Monitor size={15} /> {t("studio.startStage")} <ArrowUpRight size={15} />
          </button>
        </header>
        <nav className="director-scenes" aria-label={t("studio.scenes")}>
          <em>{t("studio.scenes")}</em>
          {scenes
            .filter((s) => s.kind === "scene")
            .map((scene) => (
              <button
                key={scene.id}
                className={scene.id === config.scene ? "active" : ""}
                onClick={() => select(scene.id)}
              >
                {labelFor("scene", scene.id)}
              </button>
            ))}
          <em>{t("studio.blocks")}</em>
          {scenes
            .filter((s) => s.kind === "block")
            .map((scene) => (
              <button
                key={scene.id}
                className={scene.id === config.scene ? "active" : ""}
                onClick={() => select(scene.id)}
              >
                {labelFor("scene", scene.id)}
              </button>
            ))}
          <span>{running ? t("studio.sequenceActive") : t("studio.manualDirection")}</span>
          <button
            onClick={() => setUnlocked(false)}
            disabled={!config.pinEnabled}
          >
            {t("studio.lockAccess")}
          </button>
        </nav>
        <main className="workspace">
          <div className="workspace-heading">
            <div>
              <span className="eyebrow">
                {t("studio.sceneEyebrow", { code: selected.code })}
              </span>
              <h1>{labelFor("scene", selected.id)}</h1>
            </div>
            <button
              className={`icon-button ${settings ? "selected" : ""}`}
              aria-label={t("studio.designSettings")}
              onClick={() => setSettings((p) => !p)}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
          <div className="stage-shell">
            <div className="stage-topline">
              <span>
                <span className="tiny-dot" />
                {t(clock.playing ? "studio.playing" : "studio.standby")}
              </span>
              <span>
                {t("studio.livePreview")} / {stageFmt.width} × {stageFmt.height}
              </span>
              <button onClick={fullscreen} aria-label={t("studio.fullscreen")}>
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
                      ? stepById(show, running)?.operation
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
                    heading={config.pinTitle}
                    code={config.pin}
                    mode={config.pinMode}
                    fake={config.pinFake}
                    onUnlock={() => setUnlocked(true)}
                  />
                )}
                <DisplayOverlays config={config} time={clock.elapsed} />
                {rehearsal && config.exerciseMark && (
                  <div className="exercise-mark">UNCLASSIFIED // EXERCISE</div>
                )}
              </div>
            </div>
            <div className="stage-bottomline">
              <span>{t("studio.pointerTouch")}</span>
              <span>
                {t("studio.take", {
                  n: take.toString().padStart(2, "0"),
                  mood: t(`studio.mood.${config.mood}`),
                })}
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
                const first = entryStep(show);
                if (first) {
                  applyStep(first);
                  setDirectorTab("monitor");
                }
              }}
              onStop={() => setRunning(null)}
              onAdvance={advanceShow}
              onFail={failShow}
            />
          )}
          <div className="transport">
            <div className="playback">
              <button
                className="play-button"
                aria-label={clock.playing ? t("studio.pause") : t("studio.play")}
                onClick={() => clock.setPlaying((p) => !p)}
              >
                {clock.playing ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                className="icon-button"
                aria-label={t("studio.resetTake")}
                onClick={reset}
              >
                <RotateCcw size={17} />
              </button>
              <div className="transport-time">
                {formatTime(clock.elapsed)}
                <small>{t("studio.sceneTime")}</small>
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
                    {[t("studio.cue.idle"), t("studio.cue.active"), t("studio.cue.warning"), t("studio.cue.complete")][i]}
                  </button>
                ),
              )}
            </div>
            <button
              className="text-button clean-trigger"
              onClick={() => setClean(true)}
            >
              {t("studio.outputOnly")} <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="timeline">
            <span>00:00</span>
            <input
              aria-label={t("studio.sceneTime")}
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
                ? t("studio.noteGesture")
                : t("studio.noteTouch")}
            </span>
            <span>{t("studio.shortcuts")}</span>
          </div>
        </main>
        <aside
          className={`inspector config-menu config-${configTab}`}
          hidden={!settings || clean}
          aria-label={t("studio.configuration")}
          style={{ "--config-width": `${configWidth}px` } as CSSProperties}
        >
          <div
            className="config-resize"
            role="separator"
            aria-orientation="vertical"
            aria-label={t("studio.resizeConfig")}
            onPointerDown={startInspectorResize}
          />
          <header className="config-header">
            <strong>{t("studio.configuration")}</strong>
            <button
              aria-label={t("studio.closeConfig")}
              onClick={() => setSettings(false)}
            >
              ×
            </button>
          </header>
          <nav className="config-tabs" role="tablist">
            <span className="config-tabs-group">
              {t("studio.groupGeneral")}
            </span>
            {[
              ["content", t("studio.tab.content")],
              ["systems", t("studio.tab.systems")],
              ["design", t("studio.tab.design")],
              ["themes", t("studio.tab.themes")],
              ["effects", t("studio.tab.effects")],
              ["tokens", t("studio.tab.tokens")],
              ["media", t("studio.tab.media")],
              ["playback", t("studio.tab.playback")],
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
            <span className="config-tabs-group">
              {t("studio.groupElement")}
            </span>
            <button
              role="tab"
              aria-selected={configTab === "element"}
              onClick={() => setConfigTab("element")}
            >
              {t("studio.tab.element")}
            </button>
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
                <span>01</span> {t("studio.sectionContent")}
              </div>
              <label>
                {t("studio.title")}
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
                {t("studio.subtitle")}
                <input
                  value={config.subtitle}
                  maxLength={70}
                  onChange={(e) => update("subtitle", e.target.value)}
                />
              </label>
              <label>
                {t("studio.identifier")}
                <input
                  value={config.identifier}
                  maxLength={24}
                  onChange={(e) => update("identifier", e.target.value)}
                />
              </label>
            </section>
            <section data-panel="design">
              <label>
                {t("studio.font")}
                <select
                  aria-label={t("studio.font")}
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
                <span>02</span> {t("studio.imageLanguage")}
              </div>
              <label>
                {t("studio.mood")}
                <select
                  value={config.mood}
                  onChange={(e) =>
                    update("mood", e.target.value as Config["mood"])
                  }
                >
                  <option value="clinical">{t("studio.mood.clinical")}</option>
                  <option value="tense">{t("studio.mood.tense")}</option>
                  <option value="damaged">{t("studio.mood.damaged")}</option>
                </select>
              </label>
              <label className="color-label">
                {t("studio.accent")}{" "}
                <div>
                  <span>{config.accent.toUpperCase()}</span>
                  <input
                    aria-label={t("studio.accent")}
                    type="color"
                    value={config.accent}
                    onChange={(e) => update("accent", e.target.value)}
                  />
                </div>
              </label>
              <label>
                {t("studio.stageFormat")}
                <select
                  aria-label={t("studio.stageFormat")}
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
                {t("studio.elementFrame")}
                <select
                  aria-label={t("studio.elementFrame")}
                  value={config.frame.style}
                  onChange={(e) =>
                    update("frame", {
                      ...config.frame,
                      style: e.target.value as Config["frame"]["style"],
                    })
                  }
                >
                  <option value="hud">{t("studio.frame.hud")}</option>
                  <option value="plate">{t("studio.frame.plate")}</option>
                  <option value="none">{t("studio.frame.none")}</option>
                </select>
              </label>
              <label>
                {t("studio.density")}
                <select
                  value={config.density}
                  onChange={(e) =>
                    update("density", e.target.value as Config["density"])
                  }
                >
                  <option value="detailed">{t("studio.density.detailed")}</option>
                  <option value="focused">{t("studio.density.focused")}</option>
                </select>
              </label>
              <label>
                {t("studio.effectStrength")}{" "}
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
                {t("studio.displayBrightness")}{" "}
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
              <summary>{t("studio.displayOverlays")}</summary>
              {Object.entries(config.overlays).map(([key, value]) => (
                <label key={key}>
                  {
                    (
                      {
                        scanlines: t("studio.overlay.scanlines"),
                        glow: t("studio.overlay.crtGlow"),
                        grid: t("studio.overlay.technoGrid"),
                        grain: t("studio.overlay.grain"),
                        vignette: t("studio.overlay.vignette"),
                        glitch: t("studio.overlay.glitch"),
                        chromatic: t("studio.overlay.chromatic"),
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
                {t("studio.pinEnabled")}
              </label>
              <label>
                {t("studio.pinField")}
                <select
                  aria-label={t("studio.pinFieldAria")}
                  value={config.pinMode}
                  onChange={(e) =>
                    update("pinMode", e.target.value as Config["pinMode"])
                  }
                >
                  <option value="numeric">{t("studio.pin.numeric")}</option>
                  <option value="alphanumeric">{t("studio.pin.alphanumeric")}</option>
                </select>
              </label>
              <label>
                {t("studio.pinCode")}
                <input
                  aria-label={t("studio.pinCodeAria")}
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
                {t("studio.pinFake")}
              </label>
              <label>
                {t("studio.pinTitle")}
                <input
                  aria-label={t("studio.pinTitleAria")}
                  maxLength={40}
                  defaultValue={config.pinTitle}
                  key={config.pinTitle}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v) update("pinTitle", v);
                    else e.target.value = config.pinTitle;
                  }}
                />
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
                {t("studio.sound")}
              </label>
              <div className="inspector-section-title">
                <span>03</span> {t("studio.sectionFlow")}
              </div>
              {rehearsal && (
                <>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={config.exerciseMark}
                      onChange={(e) =>
                        update("exerciseMark", e.target.checked)
                      }
                    />{" "}
                    {t("studio.exerciseMark")}
                  </label>
                  <label>
                    {t("studio.instructorPin")}
                    <input
                      aria-label={t("studio.instructorPin")}
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
                    {t("studio.kioskHint")}
                  </p>
                  <button
                    type="button"
                    onClick={() => downloadTakeLog(show.name, takeLog)}
                    disabled={!takeLog.length}
                  >
                    {t("studio.takeLogExport", { count: takeLog.length })}
                  </button>
                </>
              )}
              <p className="inspector-hint">{t("studio.pauseHint")}</p>
            </section>
            <section data-panel="element">
              {!ELEMENT_SCENES.includes(config.scene) && (
                <p className="inspector-hint">{t("studio.elementNone")}</p>
              )}
              {config.scene === "countdown" && (
                <>
                  <label>
                    {t("studio.deviceType")}
                    <select
                      aria-label={t("studio.deviceType")}
                      value={config.sceneOptions.countdown.type}
                      onChange={(e) => {
                        reset();
                        updateSceneOptions("countdown", {
                          type: e.target
                            .value as Config["sceneOptions"]["countdown"]["type"],
                        });
                      }}
                    >
                      <option value="transfer">{t("studio.countdown.transfer")}</option>
                      <option value="bomb">{t("studio.countdown.bomb")}</option>
                      <option value="reactor">{t("studio.countdown.reactor")}</option>
                      <option value="custom">{t("studio.countdown.custom")}</option>
                    </select>
                  </label>
                  <label>
                    {t("studio.designation")}
                    <input
                      value={config.sceneOptions.countdown.label}
                      maxLength={40}
                      onChange={(e) =>
                        updateSceneOptions("countdown", {
                          label: e.target.value,
                        })
                      }
                    />
                  </label>
                  {config.sceneOptions.countdown.type === "bomb" && (
                    <label>
                      {t("studio.assembly")}
                      <select
                        aria-label={t("studio.assembly")}
                        value={config.sceneOptions.countdown.variant}
                        onChange={(e) => {
                          reset();
                          updateSceneOptions("countdown", {
                            variant:
                              e.target
                                .value as Config["sceneOptions"]["countdown"]["variant"],
                          });
                        }}
                      >
                        <option value="antimatter">{t("studio.assembly.containment")}</option>
                        <option value="nuclear">{t("studio.assembly.nuclear")}</option>
                      </select>
                    </label>
                  )}
                </>
              )}
              {config.scene === "tracking" && (
                <>
                  <label>
                    {t("studio.trackingMode")}
                    <select
                      aria-label={t("studio.trackingMode")}
                      value={config.sceneOptions.tracking.mode}
                      onChange={(e) =>
                        updateSceneOptions("tracking", {
                          mode: e.target
                            .value as Config["sceneOptions"]["tracking"]["mode"],
                        })
                      }
                    >
                      <option value="sensor">{t("studio.tracking.sensor")}</option>
                      <option value="drone">{t("studio.tracking.drone")}</option>
                    </select>
                  </label>
                  <label>
                    {t("studio.callsign")}
                    <input
                      value={config.sceneOptions.tracking.callsign}
                      maxLength={24}
                      onChange={(e) =>
                        updateSceneOptions("tracking", {
                          callsign: e.target.value,
                        })
                      }
                    />
                  </label>
                </>
              )}
              {config.scene === "hologram" && (
                <>
                  <label>
                    {t("studio.analysisMode")}
                    <select
                      aria-label={t("studio.analysisMode")}
                      value={config.sceneOptions.analysis.mode}
                      onChange={(e) =>
                        updateSceneOptions("analysis", {
                          mode: e.target
                            .value as Config["sceneOptions"]["analysis"]["mode"],
                        })
                      }
                    >
                      <option value="reconstruct">{t("studio.analysis.reconstruct")}</option>
                      <option value="decrypt">{t("studio.analysis.decrypt")}</option>
                      <option value="data">{t("studio.analysis.data")}</option>
                    </select>
                  </label>
                  <label>
                    {t("studio.cipherInput")}
                    <input
                      value={config.sceneOptions.analysis.input}
                      maxLength={400}
                      onChange={(e) =>
                        updateSceneOptions("analysis", { input: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    {t("studio.plainResult")}
                    <input
                      value={config.sceneOptions.analysis.result}
                      maxLength={400}
                      onChange={(e) =>
                        updateSceneOptions("analysis", { result: e.target.value })
                      }
                    />
                  </label>
                </>
              )}
              {config.scene === "clock" && (
                <>
                  <label>
                    {t("studio.clockMode")}
                    <select
                      aria-label={t("studio.clockMode")}
                      value={config.sceneOptions.clock.mode}
                      onChange={(e) =>
                        updateSceneOptions("clock", {
                          mode: e.target
                            .value as Config["sceneOptions"]["clock"]["mode"],
                        })
                      }
                    >
                      <option value="mission">{t("studio.clock.mission")}</option>
                      <option value="wall">{t("studio.clock.wall")}</option>
                      <option value="zones">{t("studio.clock.zones")}</option>
                      <option value="countdown">{t("studio.clock.countdown")}</option>
                      <option value="schedule">{t("studio.clock.schedule")}</option>
                    </select>
                  </label>
                  <label>
                    {t("studio.label")}
                    <input
                      value={config.sceneOptions.clock.label}
                      maxLength={40}
                      onChange={(e) =>
                        updateSceneOptions("clock", { label: e.target.value })
                      }
                    />
                  </label>
                </>
              )}
              {config.scene === "rotary" && (
                <label>
                  {t("studio.dials")}
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={config.sceneOptions.rotary.dials}
                    onChange={(e) =>
                      updateSceneOptions("rotary", {
                        dials: Number(e.target.value),
                      })
                    }
                  />
                </label>
              )}
              {config.scene === "code-table" && (
                <label>
                  {t("studio.plainMessage")}
                  <input
                    value={config.sceneOptions.codeTable.message}
                    maxLength={60}
                    onChange={(e) =>
                      updateSceneOptions("codeTable", {
                        message: e.target.value,
                      })
                    }
                  />
                </label>
              )}
              {config.scene === "data-sheet" && (
                <>
                  <label>
                    {t("studio.hurdle")}
                    <select
                      aria-label={t("studio.hurdle")}
                      value={config.sceneOptions.dataSheet.subject}
                      onChange={(e) =>
                        updateSceneOptions("dataSheet", {
                          subject: e.target
                            .value as Config["sceneOptions"]["dataSheet"]["subject"],
                        })
                      }
                    >
                      <option value="countdown">{t("studio.hurdle.countdown")}</option>
                      <option value="terminal">{t("studio.hurdle.terminal")}</option>
                      <option value="access">{t("studio.hurdle.access")}</option>
                      <option value="custom">{t("studio.hurdle.custom")}</option>
                    </select>
                  </label>
                  <label>
                    {t("studio.searchTerms")}
                    <input
                      value={config.sceneOptions.dataSheet.search.join(", ")}
                      maxLength={120}
                      onChange={(e) =>
                        updateSceneOptions("dataSheet", {
                          search: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </label>
                  <label>
                    {t("studio.title")}
                    <input
                      value={config.sceneOptions.dataSheet.title}
                      maxLength={60}
                      onChange={(e) =>
                        updateSceneOptions("dataSheet", {
                          title: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t("studio.relayText")}
                    <input
                      value={config.sceneOptions.dataSheet.relayText}
                      maxLength={200}
                      onChange={(e) =>
                        updateSceneOptions("dataSheet", {
                          relayText: e.target.value,
                        })
                      }
                    />
                  </label>
                </>
              )}
              <label>
                {t("studio.durationSeconds")}
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
              {config.scene === "os" && (
                <>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={config.sceneOptions.os.login.enabled}
                      onChange={(e) =>
                        updateSceneOptions("os", {
                          login: {
                            ...config.sceneOptions.os.login,
                            enabled: e.target.checked,
                          },
                        })
                      }
                    />{" "}
                    {t("studio.loginScreen")}
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={config.sceneOptions.os.login.biometric}
                      onChange={(e) =>
                        updateSceneOptions("os", {
                          login: {
                            ...config.sceneOptions.os.login,
                            biometric: e.target.checked,
                          },
                        })
                      }
                    />{" "}
                    {t("studio.loginBiometric")}
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={config.sceneOptions.os.login.hackable}
                      onChange={(e) =>
                        updateSceneOptions("os", {
                          login: {
                            ...config.sceneOptions.os.login,
                            hackable: e.target.checked,
                          },
                        })
                      }
                    />{" "}
                    {t("studio.loginHackable")}
                  </label>
                  <label>
                    {t("studio.user")}
                    <input
                      value={config.sceneOptions.os.login.user}
                      maxLength={40}
                      onChange={(e) =>
                        updateSceneOptions("os", {
                          login: {
                            ...config.sceneOptions.os.login,
                            user: e.target.value,
                          },
                        })
                      }
                    />
                  </label>
                  <label>
                    {t("studio.password")}
                    <input
                      value={config.sceneOptions.os.login.pass}
                      maxLength={40}
                      onChange={(e) =>
                        updateSceneOptions("os", {
                          login: {
                            ...config.sceneOptions.os.login,
                            pass: e.target.value,
                          },
                        })
                      }
                    />
                  </label>
                </>
              )}
              {config.scene === "os" && (
                <label>
                  {t("studio.sequenceDuration")}{" "}
                  <output>×{config.sceneOptions.os.sequenceScale}</output>
                  <input
                    aria-label={t("studio.sequenceDuration")}
                    type="range"
                    min=".25"
                    max="4"
                    step=".25"
                    value={config.sceneOptions.os.sequenceScale}
                    onChange={(e) =>
                      updateSceneOptions("os", { sequenceScale: +e.target.value })
                    }
                  />
                </label>
              )}
              {config.scene === "terminal" && (
                <>
                  <label>
                    {t("studio.terminalPreset")}
                    <select
                      aria-label={t("studio.terminalPreset")}
                      value={config.sceneOptions.terminal.preset}
                      onChange={(e) => {
                        const preset = terminalScript(e.target.value);
                        updateSceneOptions(
                          "terminal",
                          preset
                            ? {
                                preset: preset.id,
                                goal: preset.goal,
                                prompt: preset.prompt,
                                successText: preset.successText,
                                steps: preset.steps,
                              }
                            : { preset: "" },
                        );
                      }}
                    >
                      <option value="">
                        {t("studio.terminalPresetCustom")}
                      </option>
                      {terminalScripts.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t("studio.goal")}
                    <input
                      value={config.sceneOptions.terminal.goal}
                      maxLength={60}
                      onChange={(e) =>
                        updateSceneOptions("terminal", { goal: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    {t("studio.prompt")}
                    <input
                      value={config.sceneOptions.terminal.prompt}
                      maxLength={40}
                      onChange={(e) =>
                        updateSceneOptions("terminal", { prompt: e.target.value })
                      }
                    />
                  </label>
                </>
              )}
              {["os", "terminal"].includes(config.scene) && (
                <>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={config.sceneOptions.terminal.actorMode}
                      onChange={(e) =>
                        updateSceneOptions("terminal", {
                          actorMode: e.target.checked,
                        })
                      }
                    />{" "}
                    {t("studio.actorMode")}
                  </label>
                  <label>
                    {t("studio.commandsUntilSuccess")}
                    <input
                      aria-label={t("studio.commandsUntilSuccess")}
                      type="number"
                      min={1}
                      max={40}
                      value={config.sceneOptions.terminal.commandsUntilSuccess}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isInteger(n) && n >= 1 && n <= 40)
                          updateSceneOptions("terminal", {
                            commandsUntilSuccess: n,
                          });
                      }}
                    />
                  </label>
                  <label>
                    {t("studio.preparedCommand")}
                    <textarea
                      value={config.sceneOptions.terminal.script}
                      maxLength={300}
                      onChange={(e) =>
                        updateSceneOptions("terminal", { script: e.target.value })
                      }
                    />
                  </label>
                </>
              )}
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
              {t("studio.export")}
            </button>
            <button onClick={() => upload.current?.click()}>
              <Upload size={14} />
              {t("studio.import")}
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
              {t("studio.resetDesign")}
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
                aria-label={t("studio.instructorPin")}
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
              aria-label={t("studio.leaveStage")}
            >
              <X size={16} /> {t("studio.studio")}
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
                aria-label={t("studio.closeNotice")}
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
