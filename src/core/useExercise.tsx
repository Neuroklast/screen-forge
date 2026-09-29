import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  applyExercise,
  createRoom,
  type ExerciseMsg,
  type RoomState,
} from "./exercise";
import type { Role } from "./session";

export function useExercise(role: Role, room: string, station: string) {
  const [state, setState] = useState<RoomState>(() => createRoom(room));
  const [online, setOnline] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  useEffect(() => {
    if (role === "film") return;
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${location.hostname}:8787`;
    let sock: WebSocket;
    try {
      sock = new WebSocket(url);
    } catch {
      return;
    }
    ws.current = sock;
    sock.onopen = () => {
      setOnline(true);
      sock.send(
        JSON.stringify({
          type: "hello",
          role,
          station,
          room,
        } satisfies ExerciseMsg),
      );
    };
    sock.onmessage = (e) => {
      try {
        const msg = JSON.parse(String(e.data)) as ExerciseMsg;
        if (msg.type === "state") setState(msg.state);
      } catch {
        /* ignore */
      }
    };
    sock.onclose = () => setOnline(false);
    return () => {
      sock.close();
      ws.current = null;
    };
  }, [role, room, station]);
  const send = (msg: ExerciseMsg) => {
    setState((s) => applyExercise(s, msg));
    if (ws.current?.readyState === WebSocket.OPEN)
      ws.current.send(JSON.stringify(msg));
  };
  return { state, online, send };
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
  return (
    <ExerciseCtx.Provider value={value}>{children}</ExerciseCtx.Provider>
  );
}
export function useExerciseMaybe() {
  return useContext(ExerciseCtx);
}
