import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { newState, type TrainingState } from "./training";
import { applyEvent, domainEventSchema, type DomainEvent } from "./events";
import { isCommandType, newEventId, PROTOCOL } from "./protocol";
import type { Role } from "./session";
export type Signal = {
  type: "signal";
  from: string;
  data: {
    type: string;
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
  };
};
type Invitation = {
  token: string;
  station: string;
  role: "hq" | "element";
  expires: number;
};
export function useExercise(role: Role, room: string, station: string) {
  const key = `screenforge.session.${room}.${role}.${station}`;
  const [loginAttempt, setLoginAttempt] = useState(0),
    [gpsAck, setGpsAck] = useState(0),
    [savedRevision, setSavedRevision] = useState(-1);
  const [token, setToken] = useState(() => {
    try {
      return (
        sessionStorage.getItem(key) ||
        (role !== "trainer" ? localStorage.getItem(key) : "") ||
        ""
      );
    } catch {
      return "";
    }
  });
  const [state, setState] = useState<TrainingState>(() => newState(room));
  const [serverSeq, setServerSeq] = useState(0);
  const lastSeq = useRef(0);
  const [online, setOnline] = useState(false),
    [authenticated, setAuthenticated] = useState(false);
  const [diagnostic, setDiagnostic] = useState<{
    code: string;
    station: string;
  } | null>(null);
  const [error, setError] = useState(""),
    [invitation, setInvitation] = useState<Invitation | null>(null);
  const ws = useRef<WebSocket | null>(null),
    listeners = useRef(new Set<(signal: Signal) => void>());
  const invite = useRef(
    new URLSearchParams(location.hash.slice(1)).get("invite") || "",
  );
  const login = useCallback(
    (value: string) => {
      setError("");
      try {
        sessionStorage.setItem(key, value);
      } catch {
        /* private browsing */
      }
      setToken(value);
      setLoginAttempt((v) => v + 1);
    },
    [key],
  );
  useEffect(() => {
    if (role === "film" || (!token && !invite.current)) return;
    let disposed = false,
      retry: ReturnType<typeof setTimeout>,
      attempt = 0;
    const connect = () => {
      if (disposed) return;
      const sock = new WebSocket(
        `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/exercise`,
      );
      ws.current = sock;
      sock.onopen = () =>
        sock.send(
          JSON.stringify({
            type: "hello",
            role,
            room,
            station,
            token: invite.current || token,
            invite: !!invite.current,
            protocol: PROTOCOL,
            lastServerSeq: lastSeq.current,
          }),
        );
      sock.onmessage = (e) => {
        if (disposed) return;
        try {
          const msg = JSON.parse(String(e.data));
          if (msg.type === "credential") {
            invite.current = "";
            history.replaceState(null, "", location.pathname + location.search);
            try {
              localStorage.setItem(key, msg.token);
              sessionStorage.setItem(key, msg.token);
            } catch {
              /* keep current connection */
            }
            setToken(msg.token);
          }
          if (msg.type === "ready") {
            setOnline(true);
            setError("");
            attempt = 0;
            lastSeq.current = Number(msg.serverSeq) || 0;
            setServerSeq(lastSeq.current);
          }
          if (msg.type === "ack") {
            const seq = Number(msg.serverSeq) || 0;
            if (seq > lastSeq.current) {
              lastSeq.current = seq;
              setServerSeq(seq);
            }
          }
          if (msg.type === "rejected") setError(msg.reason || "Befehl abgelehnt");
          if (msg.type === "resumed") {
            const seq = Number(msg.serverSeq) || 0;
            if (seq > lastSeq.current) {
              lastSeq.current = seq;
              setServerSeq(seq);
            }
          }
          if (msg.type === "events" && Array.isArray(msg.events)) {
            const parsed: DomainEvent[] = [];
            for (const raw of msg.events) {
              const result = domainEventSchema.safeParse(raw);
              if (result.success) parsed.push(result.data);
            }
            setState((old) => {
              const next = structuredClone(old);
              for (const event of parsed) applyEvent(next, event);
              return next;
            });
            const seq = Number(msg.serverSeq) || 0;
            if (seq > lastSeq.current) {
              lastSeq.current = seq;
              setServerSeq(seq);
            }
          }
          if (msg.type === "state") {
            setState(msg.state);
            setAuthenticated(true);
          }
          if (msg.type === "tick")
            setState((old) => ({
              ...old,
              clock: msg.clock,
              frozen: msg.frozen,
              positions: msg.positions,
            }));
          if (msg.type === "gps-ack") setGpsAck(msg.timestamp);
          if (msg.type === "saved") setSavedRevision(msg.revision);
          if (msg.type === "error") setError(msg.message);
          if (msg.type === "diagnostic") setDiagnostic(msg);
          if (msg.type === "invitation") setInvitation(msg);
          if (msg.type === "signal") listeners.current.forEach((fn) => fn(msg));
        } catch {
          setError("Ungültige Serverantwort");
        }
      };
      sock.onclose = (e) => {
        if (disposed) return;
        setOnline(false);
        if (e.code === 4003 || e.code === 4001) {
          setAuthenticated(false);
          setError(
            (current) =>
              current ||
              e.reason ||
              "Zugang abgelaufen. Neuen QR-Code anfordern.",
          );
          return;
        }
        retry = setTimeout(connect, Math.min(15000, 1000 * 2 ** attempt++));
      };
      sock.onerror = () => {
        if (!disposed)
          setError("Server nicht erreichbar. Verbindung wird erneut versucht.");
      };
    };
    connect();
    return () => {
      disposed = true;
      clearTimeout(retry);
      ws.current?.close();
      ws.current = null;
      setOnline(false);
    };
  }, [role, room, station, token, key, loginAttempt]);
  const send = useCallback((msg: Record<string, unknown>) => {
    if (ws.current?.readyState !== WebSocket.OPEN) {
      setError("Nicht verbunden. Änderung wurde nicht gesendet.");
      return false;
    }
    const payload =
      typeof msg.type === "string" && isCommandType(msg.type) && !msg.eventId
        ? { ...msg, eventId: newEventId() }
        : msg;
    ws.current.send(JSON.stringify(payload));
    return true;
  }, []);
  const subscribe = useCallback((fn: (signal: Signal) => void) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);
  const logout = () => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      /* noop */
    }
    ws.current?.close();
    setToken("");
    setAuthenticated(false);
  };
  return {
    state,
    online,
    authenticated,
    error,
    setError,
    send,
    login,
    logout,
    invitation,
    diagnostic,
    gpsAck,
    savedRevision,
    serverSeq,
    subscribe,
    role,
    station,
    room,
  };
}
const ExerciseCtx = createContext<ReturnType<typeof useExercise> | null>(null);
export function ExerciseProvider({
  role,
  room,
  station,
  children,
}: {
  role: Role;
  room: string;
  station: string;
  children: ReactNode;
}) {
  const value = useExercise(role, room, station);
  return <ExerciseCtx.Provider value={value}>{children}</ExerciseCtx.Provider>;
}
export function useExerciseMaybe() {
  return useContext(ExerciseCtx);
}
export function useTraining() {
  const ctx = useExerciseMaybe();
  if (!ctx) throw new Error("ExerciseProvider required");
  return ctx;
}
