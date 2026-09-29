import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { newState, type TrainingState } from './training';
import type { Role } from './session';
export type Signal = { type: 'signal'; from: string; data: { type: string; sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit } };
type Invitation = { token: string; station: string; role: 'hq' | 'element'; expires: number };
export function useExercise(role: Role, room: string, station: string) {
  const key = `screenforge.session.${room}.${role}.${station}`;
  const [token, setToken] = useState(() => { try { return sessionStorage.getItem(key) || (role !== 'trainer' ? localStorage.getItem(key) : '') || ''; } catch { return ''; } });
  const [state, setState] = useState<TrainingState>(() => newState(room));
  const [online, setOnline] = useState(false), [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState(''), [invitation, setInvitation] = useState<Invitation | null>(null);
  const ws = useRef<WebSocket | null>(null), listeners = useRef(new Set<(signal: Signal) => void>());
  const invite = useRef(new URLSearchParams(location.hash.slice(1)).get('invite') || '');
  const login = useCallback((value: string) => { setError(''); try { sessionStorage.setItem(key, value); } catch { /* private browsing */ } setToken(value); }, [key]);
  useEffect(() => {
    if (role === 'film' || (!token && !invite.current)) return;
    let disposed = false, retry: ReturnType<typeof setTimeout>, attempt = 0;
    const connect = () => {
      if (disposed) return;
      const sock = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/exercise`);
      ws.current = sock;
      sock.onopen = () => sock.send(JSON.stringify({ type: 'hello', role, room, station, token: invite.current || token, invite: !!invite.current }));
      sock.onmessage = e => {
        if (disposed) return;
        try {
          const msg = JSON.parse(String(e.data));
          if (msg.type === 'credential') {
            invite.current = ''; history.replaceState(null, '', location.pathname + location.search);
            try { localStorage.setItem(key, msg.token); sessionStorage.setItem(key, msg.token); } catch { /* keep current connection */ }
            setToken(msg.token);
          }
          if (msg.type === 'ready') { setOnline(true); setAuthenticated(true); setError(''); attempt = 0; }
          if (msg.type === 'state') setState(msg.state);
          if (msg.type === 'error') setError(msg.message);
          if (msg.type === 'invitation') setInvitation(msg);
          if (msg.type === 'signal') listeners.current.forEach(fn => fn(msg));
        } catch { setError('Ungültige Serverantwort'); }
      };
      sock.onclose = e => {
        if (disposed) return;
        setOnline(false);
        if (e.code === 4003 || e.code === 4001) { setAuthenticated(false); setError(e.reason || 'Zugang abgelaufen. Neuen QR-Code anfordern.'); return; }
        retry = setTimeout(connect, Math.min(15000, 1000 * 2 ** attempt++));
      };
      sock.onerror = () => { if (!disposed) setError('Server nicht erreichbar. Verbindung wird erneut versucht.'); };
    };
    connect();
    return () => { disposed = true; clearTimeout(retry); ws.current?.close(); ws.current = null; setOnline(false); };
  }, [role, room, station, token, key]);
  const send = useCallback((msg: Record<string, unknown>) => {
    if (ws.current?.readyState !== WebSocket.OPEN) { setError('Nicht verbunden. Änderung wurde nicht gesendet.'); return false; }
    ws.current.send(JSON.stringify(msg)); return true;
  }, []);
  const subscribe = useCallback((fn: (signal: Signal) => void) => { listeners.current.add(fn); return () => { listeners.current.delete(fn); }; }, []);
  const logout = () => { try { localStorage.removeItem(key); sessionStorage.removeItem(key); } catch { /* noop */ } ws.current?.close(); setToken(''); setAuthenticated(false); };
  return { state, online, authenticated, error, setError, send, login, logout, invitation, subscribe, role, station, room };
}
const ExerciseCtx = createContext<ReturnType<typeof useExercise> | null>(null);
export function ExerciseProvider({ role, room, station, children }: { role: Role; room: string; station: string; children: ReactNode }) {
  const value = useExercise(role, room, station);
  return <ExerciseCtx.Provider value={value}>{children}</ExerciseCtx.Provider>;
}
export function useExerciseMaybe() { return useContext(ExerciseCtx); }
export function useTraining() { const ctx = useExerciseMaybe(); if (!ctx) throw new Error('ExerciseProvider required'); return ctx; }
