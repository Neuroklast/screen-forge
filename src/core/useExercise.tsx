import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { newState, type TrainingState } from "./training";
import { applyEvent, domainEventSchema, type DomainEvent } from "./events";
import { isCommandType, newEventId, PROTOCOL } from "./protocol";
import { buildInfo, buildsCompatible } from "./build";
import { ServerClock } from "./clock";
import { TelemetryStore } from "./telemetry";
import * as outbox from "./outbox";
import { t } from "../i18n";
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
  const [clockRevision, setClockRevision] = useState(0);
  const [serverBuild, setServerBuild] = useState<string | null>(null);
  const [serverProtocol, setServerProtocol] = useState<number | null>(null);
  const lastSeq = useRef(0);
  const clockRef = useRef(new ServerClock());
  const telemetryRef = useRef(new TelemetryStore());
  const [online, setOnline] = useState(false),
    [authenticated, setAuthenticated] = useState(false);
  const [diagnostic, setDiagnostic] = useState<{
    code: string;
    station: string;
  } | null>(null);
  const [error, setError] = useState(""),
    [invitation, setInvitation] = useState<Invitation | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const device = useRef(outbox.deviceId());
  const deviceSeq = useRef(0);
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
  const flushOutbox = useCallback(async () => {
    const list = outbox.pending(await outbox.entries(), room, device.current);
    for (const entry of list) {
      if (ws.current?.readyState !== WebSocket.OPEN) break;
      ws.current.send(JSON.stringify(entry.message));
      await outbox.update(entry.eventId, "sent");
    }
    const rest = await outbox.entries();
    setPendingCount(outbox.pending(rest, room, device.current).length);
    for (const id of outbox.pruneAcked(rest)) await outbox.remove(id);
  }, [room]);
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
            setServerBuild(typeof msg.build === "string" ? msg.build : null);
            setServerProtocol(
              typeof msg.protocol === "number" ? msg.protocol : null,
            );
            clockRef.current.observe(Number(msg.serverNow));
            setClockRevision(Number(msg.clockRevision) || 0);
            void flushOutbox();
          }
          if (
            (msg.type === "ack" || msg.type === "rejected") &&
            typeof msg.eventId === "string"
          )
            void outbox.update(
              msg.eventId,
              msg.type === "ack" ? "acked" : "rejected",
            );
          if (msg.type === "ack") {
            const seq = Number(msg.serverSeq) || 0;
            if (seq > lastSeq.current) {
              lastSeq.current = seq;
              setServerSeq(seq);
            }
          }
          if (msg.type === "rejected") setError(msg.reason || t("app.commandRejected"));
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
          if (msg.type === "tick") {
            const at = Number(msg.serverNow) || Date.now();
            telemetryRef.current.push("clock", at, Number(msg.clock) || 0);
            if (msg.positions && typeof msg.positions === "object")
              for (const [id, pos] of Object.entries(msg.positions))
                telemetryRef.current.push(
                  `pos:${id}`,
                  at,
                  Number((pos as { lat?: number }).lat) || 0,
                );
            setState((old) => ({
              ...old,
              clock: msg.clock,
              frozen: msg.frozen,
              positions: msg.positions,
            }));
          }
          if (msg.type === "tick" || msg.type === "ack")
            clockRef.current.observe(Number(msg.serverNow));
          if (msg.type === "tick" && typeof msg.clockRevision === "number")
            setClockRevision(msg.clockRevision);
          if (msg.type === "gps-ack") setGpsAck(msg.timestamp);
          if (msg.type === "saved") setSavedRevision(msg.revision);
          if (msg.type === "error") setError(msg.message);
          if (msg.type === "diagnostic") setDiagnostic(msg);
          if (msg.type === "invitation") setInvitation(msg);
          if (msg.type === "signal") listeners.current.forEach((fn) => fn(msg));
        } catch {
          setError(t("app.invalidResponse"));
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
              t("app.sessionExpired"),
          );
          return;
        }
        retry = setTimeout(connect, Math.min(15000, 1000 * 2 ** attempt++));
      };
      sock.onerror = () => {
        if (!disposed)
          setError(t("app.serverUnreachable"));
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
  const send = useCallback(
    (msg: Record<string, unknown>) => {
      const isCommand =
        typeof msg.type === "string" && isCommandType(msg.type);
      if (!isCommand) {
        if (ws.current?.readyState !== WebSocket.OPEN) {
          setError(t("app.notConnected"));
          return false;
        }
        ws.current.send(JSON.stringify(msg));
        return true;
      }
      const eventId =
        typeof msg.eventId === "string" && msg.eventId
          ? msg.eventId
          : newEventId();
      const message = {
        ...msg,
        eventId,
        deviceId: device.current,
        deviceSeq: ++deviceSeq.current,
      };
      const entry: outbox.OutboxEntry = {
        eventId,
        room,
        deviceId: device.current,
        deviceSeq: deviceSeq.current,
        message,
        state: "queued",
        createdAt: Date.now(),
      };
      void outbox.put(entry);
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify(message));
        void outbox.update(eventId, "sent");
      } else {
        setPendingCount((count) => count + 1);
      }
      return true;
    },
    [room],
  );
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
  const buildMismatch = !buildsCompatible(buildInfo, {
    id: serverBuild,
    protocol: serverProtocol,
  });
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
    clockRevision,
    serverBuild,
    buildMismatch,
    serverNow: () => clockRef.current.now(),
    telemetry: telemetryRef.current,
    pendingCount,
    subscribe,
    role,
    station,
    room,
  };
}
export type ExerciseValue = ReturnType<typeof useExercise>;
const ExerciseCtx = createContext<ExerciseValue | null>(null);
export function useTelemetryVersion(store: TelemetryStore): number {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
// Additive: lets the editor preview feed the real module components a synthetic,
// inert sandbox value instead of a live exercise connection
// (docs/architecture/previews.md).
export function ExerciseValueProvider({
  value,
  children,
}: {
  value: ExerciseValue;
  children: ReactNode;
}) {
  return <ExerciseCtx.Provider value={value}>{children}</ExerciseCtx.Provider>;
}
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
