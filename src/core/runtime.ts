import { useEffect, useRef, useState } from "react";
export type Cue = "idle" | "active" | "warning" | "complete";
export function countdown(duration: number, elapsed: number) {
  return Math.max(0, duration - elapsed);
}
export function formatTime(seconds: number) {
  const n = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(n / 3600)
    .toString()
    .padStart(
      2,
      "0",
    )}:${Math.floor(n / 60) % 60 < 10 ? "0" : ""}${Math.floor(n / 60) % 60}:${(n % 60).toString().padStart(2, "0")}`;
}
export function noise(index: number, seed: number) {
  const v = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453;
  return v - Math.floor(v);
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
