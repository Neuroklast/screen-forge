export const LATCH_PHYSICS = {
  BRAKE: 0.72,
  SPRING: 0.18,
  SNAP_THRESHOLD: 0.98,
  MAX_PROGRESS_PER_MS: 0.001,
  FRAME_MS: 16,
  REST_VELOCITY: 1e-6,
} as const;
export type LatchStatus = "open" | "armed" | "sealed";
export type LatchState = {
  progress: number;
  velocity: number;
  dragging: boolean;
  latch: LatchStatus;
};
export function createLatchState(): LatchState {
  return { progress: 0, velocity: 0, dragging: false, latch: "open" };
}
export function clamp01(value: number) {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}
function latchFor(progress: number): LatchStatus {
  if (progress >= LATCH_PHYSICS.SNAP_THRESHOLD) return "sealed";
  if (progress > 0) return "armed";
  return "open";
}
function sealed(dragging: boolean): LatchState {
  return { progress: 1, velocity: 0, dragging, latch: "sealed" };
}
export function pointerToTrackProgress(
  clientX: number,
  trackLeft: number,
  trackWidth: number,
) {
  return clamp01((clientX - trackLeft) / Math.max(trackWidth, 1));
}
export function applyLatchToward(
  state: LatchState,
  targetProgress: number,
  dtMs: number,
): LatchState {
  if (state.latch === "sealed") return sealed(true);
  const dt = Math.max(dtMs, 1);
  const target = clamp01(targetProgress);
  const cap = LATCH_PHYSICS.MAX_PROGRESS_PER_MS * dt;
  const applied = Math.min(Math.max(target - state.progress, -cap), cap);
  const progress = clamp01(state.progress + applied);
  if (progress >= LATCH_PHYSICS.SNAP_THRESHOLD) return sealed(true);
  return {
    progress,
    velocity: applied / dt,
    dragging: true,
    latch: latchFor(progress),
  };
}
export function applyLatchRelease(state: LatchState): LatchState {
  if (state.latch === "sealed") return sealed(false);
  return { ...state, dragging: false };
}
export function tickLatchCoast(state: LatchState, dtMs: number): LatchState {
  if (state.latch === "sealed") return sealed(false);
  if (state.dragging) return state;
  const dt = Math.max(dtMs, 1);
  let { progress, velocity } = state;
  progress = clamp01(progress + velocity * dt);
  velocity *= Math.pow(LATCH_PHYSICS.BRAKE, dt / LATCH_PHYSICS.FRAME_MS);
  if (progress >= LATCH_PHYSICS.SNAP_THRESHOLD) return sealed(false);
  if (Math.abs(velocity) < LATCH_PHYSICS.REST_VELOCITY) {
    velocity = 0;
    const spring =
      1 - Math.pow(1 - LATCH_PHYSICS.SPRING, dt / LATCH_PHYSICS.FRAME_MS);
    progress = clamp01(progress + (0 - progress) * spring);
    if (progress < 0.0005) progress = 0;
  }
  return { progress, velocity, dragging: false, latch: latchFor(progress) };
}
