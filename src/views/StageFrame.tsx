import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  presentationConfig,
  scenePalette,
  type Config,
  type SceneId,
} from "../core/config";
import type { TrainingStation } from "../core/training";
import { sceneComponents } from "../scenes/Scenes";
import { DisplayOverlays } from "../scenes/os/Overlays";
import { authoritativeCue, useSceneClock, type Cue } from "../core/runtime";
import { stageOf, stageOrient, stageRecipe } from "../core/stage";
import { useExerciseMaybe } from "../core/useExercise";
import { onAccent } from "../core/contrast";
export function StageFrame({
  scene,
  mark,
  presentation,
  station,
  native = false,
  cue: forcedCue,
  preview = false,
}: {
  scene: SceneId;
  mark?: boolean;
  presentation?: TrainingStation["presentation"];
  station?: string;
  native?: boolean;
  // Preview host: drive the cue from the editor preview state and run the
  // local scene clock instead of the exercise clock (docs/architecture/previews.md).
  cue?: Cue;
  preview?: boolean;
}) {
  const ex = useExerciseMaybe();
  const [config] = useState<Config>(() => ({
    ...presentationConfig(scene, presentation),
    workspace: "rehearsal",
    exerciseMark: !!mark,
    scene,
  }));
  const [cue, setCue] = useState<Cue>(() =>
    ex && station ? authoritativeCue(ex.state, station) : "idle",
  );
  const clock = useSceneClock();
  const time = preview ? clock.elapsed : ex ? ex.state.clock : clock.elapsed;
  // Server-recorded completion outranks transient local UI state, so a remount
  // or reconnect never re-opens an already completed task. In preview the
  // editor owns the cue; nothing is recorded.
  const effectiveCue: Cue = preview
    ? forcedCue ?? "idle"
    : ex && station && authoritativeCue(ex.state, station) === "complete"
      ? "complete"
      : cue;
  const stage = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1280, height: 720 });
  useEffect(() => {
    clock.setPlaying(preview || !ex);
  }, []);
  useEffect(() => {
    if (!stage.current) return;
    const obs = new ResizeObserver((e) => {
      const r = e[0].contentRect;
      setSize({ width: r.width, height: r.height });
    });
    obs.observe(stage.current);
    return () => obs.disconnect();
  }, []);
  const Scene = sceneComponents[scene];
  const palette = config.palette ?? scenePalette(scene);
  const fmt = stageOf(config.format);
  const scale = Math.min(size.width / fmt.width, size.height / fmt.height);
  const vars = {
    "--accent": config.accent,
    "--on-accent": onAccent(config.accent),
    "--theme-bg": palette.background,
    "--theme-surface": palette.surface,
    "--theme-text": palette.text,
    "--theme-secondary": palette.secondary,
    "--fx": config.effects,
    "--display-glow": config.overlays.glow * config.effects,
    "--display-chroma": config.overlays.chromatic * config.effects,
  } as CSSProperties;
  const content = (
    <>
      <Scene
        config={config}
        time={time}
        cue={effectiveCue}
        onCue={setCue}
        onPlay={() => clock.setPlaying(true)}
      />
      <DisplayOverlays config={config} time={time} />
      {mark && <div className="exercise-mark">UNCLASSIFIED // EXERCISE</div>}
    </>
  );
  // Native mode renders the widget as a field surface that fills its cell
  // (no letterbox scale); the same scene component is used in both hosts.
  if (native)
    return (
      <div
        className={`scene-canvas field-native family-${scene} mood-${config.mood} density-${config.density}`}
        data-orient={stageOrient(config.format)}
        data-recipe={stageRecipe(config.format)}
        data-frame={config.frame.style}
        data-workspace="rehearsal"
        style={{ ...vars, width: "100%", height: "100%" }}
      >
        {content}
      </div>
    );
  return (
    <div
      className="role-stage"
      ref={stage}
      style={{ aspectRatio: `${fmt.width}/${fmt.height}` }}
    >
      <div
        className={`scene-canvas family-${scene} mood-${config.mood} density-${config.density}`}
        data-orient={stageOrient(config.format)}
        data-recipe={stageRecipe(config.format)}
        data-workspace="rehearsal"
        style={{
          ...vars,
          width: fmt.width,
          height: fmt.height,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {content}
      </div>
    </div>
  );
}
