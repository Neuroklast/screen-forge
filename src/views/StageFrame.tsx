import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  defaults,
  scenePalette,
  type Config,
  type SceneId,
} from "../core/config";
import { sceneComponents } from "../scenes/Scenes";
import { DisplayOverlays } from "../scenes/os/Overlays";
import { useSceneClock, type Cue } from "../core/runtime";
import { stageOf, stageOrient, stageRecipe } from "../core/stage";
import { onAccent } from "../core/contrast";
export function StageFrame({
  scene,
  mark,
}: {
  scene: SceneId;
  mark?: boolean;
}) {
  const [config] = useState<Config>(() => ({
    ...defaults(scene),
    workspace: "training",
    exerciseMark: !!mark,
    scene,
  }));
  const [cue, setCue] = useState<Cue>("idle");
  const clock = useSceneClock();
  const stage = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1280, height: 720 });
  useEffect(() => {
    clock.setPlaying(true);
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
    <div className="role-stage" ref={stage} style={{ aspectRatio: `${fmt.width}/${fmt.height}` }}>
      <div
        className={`scene-canvas family-${scene} mood-${config.mood} density-${config.density}`}
        data-orient={stageOrient(config.format)}
        data-recipe={stageRecipe(config.format)}
        data-workspace="training"
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
          time={clock.elapsed}
          cue={cue}
          onCue={setCue}
          onPlay={() => clock.setPlaying(true)}
        />
        <DisplayOverlays config={config} time={clock.elapsed} />
        {mark && <div className="exercise-mark">UNCLASSIFIED // EXERCISE</div>}
      </div>
    </div>
  );
}
