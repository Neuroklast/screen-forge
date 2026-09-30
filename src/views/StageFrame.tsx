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
}: {
  scene: SceneId;
  mark?: boolean;
  presentation?: TrainingStation["presentation"];
  station?: string;
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
  const time = ex ? ex.state.clock : clock.elapsed;
  // Server-recorded completion outranks transient local UI state, so a remount
  // or reconnect never re-opens an already completed task.
  const effectiveCue: Cue =
    ex && station && authoritativeCue(ex.state, station) === "complete"
      ? "complete"
      : cue;
  const stage = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1280, height: 720 });
  useEffect(() => {
    clock.setPlaying(!ex);
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
        style={
          {
            width: fmt.width,
            height: fmt.height,
            transform: `translate(-50%, -50%) scale(${scale})`,
            "--accent": config.accent,
            "--on-accent": onAccent(config.accent),
            "--theme-bg": palette.background,
            "--theme-surface": palette.surface,
            "--theme-text": palette.text,
            "--theme-secondary": palette.secondary,
            "--fx": config.effects,
            "--display-glow": config.overlays.glow * config.effects,
            "--display-chroma": config.overlays.chromatic * config.effects,
          } as CSSProperties
        }
      >
        <Scene
          config={config}
          time={time}
          cue={effectiveCue}
          onCue={setCue}
          onPlay={() => clock.setPlaying(true)}
        />
        <DisplayOverlays config={config} time={time} />
        {mark && <div className="exercise-mark">UNCLASSIFIED // EXERCISE</div>}
      </div>
    </div>
  );
}
