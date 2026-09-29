// Generate first-party synthetic OS sounds (no third-party samples).
// Run: npm run gen:sounds   →  writes WAVs into ./sounds and a manifest.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const sampleRate = 44100;

function toWav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

function segment({ freq, dur, type = "sine", gain = 0.5, sweep = 0, attack = 0.005 }) {
  const n = Math.max(1, Math.floor(sampleRate * dur));
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const f = freq + sweep * t;
    const phase = 2 * Math.PI * f * t;
    const wave = type === "square" ? Math.sign(Math.sin(phase)) : Math.sin(phase);
    const env =
      Math.min(1, i / (attack * sampleRate)) * Math.pow(1 - i / n, 1.6);
    out[i] = wave * env * gain;
  }
  return out;
}

function concat(...parts) {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Float32Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

function mix(...parts) {
  const total = Math.max(...parts.map((p) => p.length));
  const out = new Float32Array(total);
  for (const p of parts) for (let i = 0; i < p.length; i++) out[i] += p[i];
  return out;
}

const sounds = {
  "os_startup.wav": concat(
    segment({ freq: 392, dur: 0.18, gain: 0.4 }),
    segment({ freq: 523, dur: 0.2, gain: 0.4 }),
    segment({ freq: 659, dur: 0.34, gain: 0.42, sweep: 20 }),
  ),
  "os_open.wav": segment({ freq: 880, dur: 0.09, gain: 0.35, sweep: 120 }),
  "os_close.wav": segment({ freq: 340, dur: 0.1, gain: 0.32, sweep: -60 }),
  "os_error.wav": concat(
    segment({ freq: 220, dur: 0.14, type: "square", gain: 0.3 }),
    segment({ freq: 165, dur: 0.22, type: "square", gain: 0.3 }),
  ),
  "os_notify.wav": concat(
    segment({ freq: 660, dur: 0.12, gain: 0.34 }),
    segment({ freq: 880, dur: 0.2, gain: 0.34 }),
  ),
  "os_tick.wav": segment({ freq: 1200, dur: 0.03, gain: 0.3 }),
};

const dir = join(process.cwd(), "sounds");
await mkdir(dir, { recursive: true });
const manifest = [];
for (const [name, samples] of Object.entries(sounds)) {
  await writeFile(join(dir, name), toWav(samples));
  manifest.push({ file: name, origin: "synthetic (first-party)", generator: "scripts/gen-os-sounds.mjs" });
  console.log(`wrote sounds/${name} (${(samples.length / sampleRate).toFixed(2)}s)`);
}
await writeFile(
  join(dir, "manifest.json"),
  `${JSON.stringify({ sounds: manifest }, null, 2)}\n`,
);
console.log(`wrote sounds/manifest.json (${manifest.length} entries)`);
