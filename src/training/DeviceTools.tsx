import { useEffect, useRef, useState } from 'react';
import { useTraining } from '../core/useExercise';
import type { Position } from '../core/training';
export function DeviceTools() {
  const ex = useTraining(), [tracking, setTracking] = useState(false), [awake, setAwake] = useState(false), [notice, setNotice] = useState('');
  const st = ex.state.scenario.stations.find(s => s.id === ex.station), queue = useRef<Omit<Position, 'received'>[]>([]);
  const storageKey = `screenforge.gps.${ex.room}.${ex.station}`;
  useEffect(() => { try { queue.current = JSON.parse(localStorage.getItem(storageKey) || '[]').filter((p: Position) => p.timestamp > Date.now() - 3600000).slice(-120); } catch { queue.current = []; } }, [storageKey]);
  useEffect(() => {
    if (!tracking || ex.state.scenario.mode !== 'LIVE') return;
    if (!navigator.geolocation || !isSecureContext) { setNotice('GPS benötigt HTTPS und Standortfreigabe.'); setTracking(false); return; }
    const watch = navigator.geolocation.watchPosition(p => {
      const sample = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, timestamp: p.timestamp };
      queue.current = [...queue.current, sample].slice(-120);
      try { localStorage.setItem(storageKey, JSON.stringify(queue.current)); } catch { /* bounded memory fallback */ }
    }, e => { setNotice(e.message); if (e.code === 1) setTracking(false); }, { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 });
    return () => navigator.geolocation.clearWatch(watch);
  }, [tracking, ex.state.scenario.mode, storageKey]);
  useEffect(() => {
    if (!ex.online) return;
    const flush = () => { if (queue.current.length && ex.send({ type: 'gps', samples: queue.current })) { queue.current = []; try { localStorage.removeItem(storageKey); } catch { /* noop */ } } };
    const timer = setInterval(flush, 2000); flush(); return () => clearInterval(timer);
  }, [ex.online, ex.send, storageKey]);
  useEffect(() => {
    if (!awake) return;
    let lock: WakeLockSentinel | undefined, stopped = false;
    const acquire = async () => { if (document.visibilityState !== 'visible') return; try { const acquired = await navigator.wakeLock.request('screen'); if (stopped) await acquired.release(); else lock = acquired; } catch { setNotice('Bildschirm-Wachhalten wird von diesem Gerät nicht erlaubt.'); } };
    void acquire(); document.addEventListener('visibilitychange', acquire);
    return () => { stopped = true; void lock?.release(); document.removeEventListener('visibilitychange', acquire); };
  }, [awake]);
  return <details className="device-tools"><summary>Gerät · {ex.online ? 'verbunden' : 'offline'}</summary><div>{st?.player && ex.state.scenario.mode === 'LIVE' && <button onClick={() => { setTracking(!tracking); setNotice(''); }}>{tracking ? 'Standortfreigabe stoppen' : 'Standort teilen'}</button>}<button onClick={() => { if (!navigator.wakeLock) setNotice('Wake Lock nicht verfügbar.'); else setAwake(!awake); }}>{awake ? 'Display normal' : 'Display wach halten'}</button><button onClick={() => void document.documentElement.requestFullscreen?.().catch(() => setNotice('Vollbild nicht verfügbar.'))}>Vollbild</button><p>GPS läuft nur bei aktiver App zuverlässig. Zum Sperren des Geräts Geführten Zugriff (iOS) oder den Kioskmodus des Betriebssystems verwenden.</p>{notice && <p role="status">{notice}</p>}<button onClick={() => ex.logout()}>Zuweisung auf diesem Gerät entfernen</button></div></details>;
}
