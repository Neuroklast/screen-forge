export type ClockSample = { serverNow: number; localNow: number };

// Robust offset estimate from samples (median resists outliers).
export function estimateOffset(samples: ClockSample[]): number {
  if (!samples.length) return 0;
  const offsets = samples
    .map((s) => s.serverNow - s.localNow)
    .sort((a, b) => a - b);
  const mid = Math.floor(offsets.length / 2);
  return offsets.length % 2
    ? offsets[mid]
    : (offsets[mid - 1] + offsets[mid]) / 2;
}

// Tracks server time against a monotonic browser clock, so a changed device
// wall clock cannot move the authoritative deadline. Display is a prediction;
// the server remains the authority.
export class ServerClock {
  private anchorMonotonic = 0;
  private anchorServer = 0;
  private synced = false;
  private window: ClockSample[] = [];
  offsetMs = 0;

  observe(serverNow: number, monotonic = performance.now()): void {
    if (!Number.isFinite(serverNow)) return;
    this.window.push({ serverNow, localNow: Date.now() });
    if (this.window.length > 8) this.window.shift();
    this.offsetMs = estimateOffset(this.window);
    if (!this.synced) {
      this.anchorMonotonic = monotonic;
      this.anchorServer = serverNow;
      this.synced = true;
      return;
    }
    const predicted = this.anchorServer + (monotonic - this.anchorMonotonic);
    const drift = serverNow - predicted;
    if (Math.abs(drift) > 2000) {
      this.anchorServer = serverNow;
    } else {
      this.anchorServer = predicted + drift * 0.5;
    }
    this.anchorMonotonic = monotonic;
  }

  now(monotonic = performance.now()): number {
    return this.synced
      ? this.anchorServer + (monotonic - this.anchorMonotonic)
      : Date.now();
  }

  remaining(deadlineAt: number, monotonic = performance.now()): number {
    return deadlineAt - this.now(monotonic);
  }

  reset(): void {
    this.synced = false;
    this.window = [];
    this.offsetMs = 0;
  }
}
