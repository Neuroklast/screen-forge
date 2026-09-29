export type Sample = { at: number; value: number };

// Fixed-size ring buffer: high-rate telemetry never grows without bound.
export class RingBuffer<T> {
  private data: (T | undefined)[];
  private start = 0;
  private count = 0;

  constructor(readonly capacity: number) {
    if (capacity < 1) throw new Error("capacity must be >= 1");
    this.data = new Array<T | undefined>(capacity);
  }

  push(value: T): void {
    const index = (this.start + this.count) % this.capacity;
    this.data[index] = value;
    if (this.count < this.capacity) this.count++;
    else this.start = (this.start + 1) % this.capacity;
  }

  get length(): number {
    return this.count;
  }

  latest(): T | undefined {
    return this.count
      ? this.data[(this.start + this.count - 1) % this.capacity]
      : undefined;
  }

  toArray(): T[] {
    const out: T[] = [];
    for (let i = 0; i < this.count; i++)
      out.push(this.data[(this.start + i) % this.capacity] as T);
    return out;
  }
}

export class TelemetryChannel {
  readonly buffer: RingBuffer<Sample>;
  constructor(capacity = 512) {
    this.buffer = new RingBuffer<Sample>(capacity);
  }
  push(at: number, value: number): void {
    this.buffer.push({ at, value });
  }
}

// Out-of-band store for waveforms and positions. React reads only a version
// snapshot via `useSyncExternalStore`; the samples themselves are consumed
// imperatively (Canvas/SVG) so a new sample never re-renders the app tree.
export class TelemetryStore {
  private channels = new Map<string, TelemetryChannel>();
  private listeners = new Set<() => void>();
  private version = 0;

  channel(key: string, capacity = 512): TelemetryChannel {
    let channel = this.channels.get(key);
    if (!channel) {
      channel = new TelemetryChannel(capacity);
      this.channels.set(key, channel);
    }
    return channel;
  }

  push(key: string, at: number, value: number): void {
    this.channel(key).push(at, value);
    this.version++;
    for (const fn of this.listeners) fn();
  }

  latest(key: string): Sample | undefined {
    return this.channels.get(key)?.buffer.latest();
  }

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = (): number => this.version;

  clear(): void {
    this.channels.clear();
    this.version++;
    for (const fn of this.listeners) fn();
  }
}
