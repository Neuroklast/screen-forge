import { useEffect, useState } from "react";
const BINS = 64;
export function useMicWaveform(live: boolean) {
  const [level, setLevel] = useState(0);
  const [bins, setBins] = useState<number[]>(() => Array(BINS).fill(0));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!live) {
      setLevel(0);
      setBins(Array(BINS).fill(0));
      return;
    }
    let raf = 0;
    let ctx: AudioContext | undefined;
    let stream: MediaStream | undefined;
    let alive = true;
    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        if (!alive) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.72;
        source.connect(analyser);
        const wave = new Uint8Array(analyser.fftSize);
        setReady(true);
        const tick = () => {
          analyser.getByteTimeDomainData(wave);
          const step = Math.max(1, Math.floor(wave.length / BINS));
          const next = Array.from({ length: BINS }, (_, i) => {
            const v = wave[i * step] ?? 128;
            return (v - 128) / 128;
          });
          let sum = 0;
          for (const v of next) sum += v * v;
          setBins(next);
          setLevel(Math.min(1, Math.sqrt(sum / next.length) * 3.4));
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setReady(false);
      }
    })();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
    };
  }, [live]);
  return { level, bins, ready };
}
