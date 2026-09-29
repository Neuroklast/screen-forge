import { useEffect, useRef, useState } from "react";
import { useTraining } from "../core/useExercise";
import type { Position } from "../core/training";
export function DeviceTools() {
  const ex = useTraining(),
    [tracking, setTracking] = useState(false),
    [awake, setAwake] = useState(false),
    [notice, setNotice] = useState("");
  const st = ex.state.scenario.stations.find((s) => s.id === ex.station),
    queue = useRef<Omit<Position, "received">[]>([]);
  const storageKey = `screenforge.gps.${ex.room}.${ex.station}`;
  useEffect(() => {
    try {
      queue.current = JSON.parse(localStorage.getItem(storageKey) || "[]")
        .filter((p: Position) => p.timestamp > Date.now() - 3600000)
        .slice(-120);
    } catch {
      queue.current = [];
    }
  }, [storageKey]);
  useEffect(() => {
    if (!tracking || ex.state.scenario.mode !== "LIVE") return;
    if (!navigator.geolocation || !isSecureContext) {
      setNotice("GPS requires HTTPS and location permission.");
      setTracking(false);
      return;
    }
    const watch = navigator.geolocation.watchPosition(
      (p) => {
        const sample = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
          timestamp: p.timestamp,
        };
        queue.current = [...queue.current, sample].slice(-120);
        try {
          localStorage.setItem(storageKey, JSON.stringify(queue.current));
        } catch {
          /* bounded memory fallback */
        }
      },
      (e) => {
        setNotice(e.message);
        if (e.code === 1) setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [tracking, ex.state.scenario.mode, storageKey]);
  useEffect(() => {
    queue.current = queue.current.filter((p) => p.timestamp > ex.gpsAck);
    try {
      localStorage.setItem(storageKey, JSON.stringify(queue.current));
    } catch {
      /* memory fallback */
    }
  }, [ex.gpsAck, storageKey]);
  useEffect(() => {
    if (!ex.online) return;
    const flush = () => {
      if (queue.current.length)
        ex.send({ type: "gps", samples: queue.current });
    };
    const timer = setInterval(flush, 2000);
    flush();
    return () => clearInterval(timer);
  }, [ex.online, ex.send, storageKey]);
  useEffect(() => {
    if (!awake) return;
    let lock: WakeLockSentinel | undefined,
      stopped = false;
    const acquire = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const acquired = await navigator.wakeLock.request("screen");
        if (stopped) await acquired.release();
        else lock = acquired;
      } catch {
        setNotice("Screen wake lock is not allowed on this device.");
      }
    };
    void acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      stopped = true;
      void lock?.release();
      document.removeEventListener("visibilitychange", acquire);
    };
  }, [awake]);
  return (
    <details className="device-tools">
      <summary>Device · {ex.online ? "online" : "offline"}</summary>
      <div>
        {st?.player && ex.state.scenario.mode === "LIVE" && (
          <button
            onClick={() => {
              setTracking(!tracking);
              if (tracking) {
                queue.current = [];
                try {
                  localStorage.removeItem(storageKey);
                } catch {
                  /* noop */
                }
              }
              setNotice("");
            }}
          >
            {tracking ? "Stop sharing location" : "Share location"}
          </button>
        )}
        <button
          onClick={() => {
            if (!navigator.wakeLock) setNotice("Wake lock not available.");
            else setAwake(!awake);
          }}
        >
          {awake ? "Display normal" : "Keep display awake"}
        </button>
        <button
          onClick={() =>
            void document.documentElement
              .requestFullscreen?.()
              .catch(() => setNotice("Fullscreen not available."))
          }
        >
          Fullscreen
        </button>
        <p>
          GPS is only reliable while the app is active. To lock the device use
          Guided Access (iOS) or the operating system kiosk mode.
          
        </p>
        {notice && <p role="status">{notice}</p>}
        <button onClick={() => ex.logout()}>
          Remove assignment on this device
        </button>
      </div>
    </details>
  );
}
