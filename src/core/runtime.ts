import { useEffect, useRef, useState } from "react";
import type { TrainingState } from "./training.ts";
export type Cue = "idle" | "active" | "warning" | "complete";

// A block is complete once the server has recorded a completion signal for the
// station: a module event, a reported intervention, or an access grant. Used to
// rebuild the visual cue after a remount/reconnect instead of trusting local UI.
export function authoritativeCue(state: TrainingState, station: string): Cue {
  const done =
    (state.moduleEvents?.[station]?.length ?? 0) > 0 ||
    (state.interventions?.[station]?.length ?? 0) > 0 ||
    state.props?.[station] === true;
  return done ? "complete" : "idle";
}
export function countdown(duration: number, elapsed: number) {
  return Math.max(0, duration - elapsed);
}
export function clockParts(seconds: number) {
  const n = Math.max(0, Math.ceil(seconds));
  return {
    hh: Math.floor(n / 3600).toString().padStart(2, "0"),
    mm: (Math.floor(n / 60) % 60).toString().padStart(2, "0"),
    ss: (n % 60).toString().padStart(2, "0"),
  };
}
export function formatTime(seconds: number) {
  const p = clockParts(seconds);
  return `${p.hh}:${p.mm}:${p.ss}`;
}
export function noise(index: number, seed: number) {
  const v = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453;
  return v - Math.floor(v);
}
export function scriptedInput(target: string, current: string, key: string) {
  if (key === "Backspace") return current.slice(0, Math.max(0, current.length - 1));
  if (key.length === 1) return target.slice(0, current.length + 1);
  return current;
}
export function useSceneClock() {
  const [elapsed, setElapsed] = useState(0),
    [playing, setPlaying] = useState(true);
  const value = useRef(0);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous = performance.now(),
      published = previous;
    const tick = (now: number) => {
      value.current += (now - previous) / 1000;
      previous = now;
      if (now - published >= 16) {
        setElapsed(value.current);
        published = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  const seek = (n: number) => {
    value.current = Math.max(0, n);
    setElapsed(value.current);
  };
  return {
    elapsed,
    playing,
    setPlaying,
    seek,
    reset: () => {
      setPlaying(false);
      seek(0);
    },
  };
}
