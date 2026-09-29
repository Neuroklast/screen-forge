import type { SequenceId } from "./sequences";
export type AppId =
  | "messages"
  | "overview"
  | "terminal"
  | "files"
  | "personnel"
  | "clusters"
  | "dimension"
  | "sequences";
export type OsState = {
  app: AppId;
  locked: boolean;
  sequence: null | { id: SequenceId; startedAt: number; multiplier: number };
  history: SequenceId[];
};
export type OsAction =
  | { type: "open"; app: AppId }
  | { type: "lock" }
  | { type: "unlock" }
  | { type: "run"; id: SequenceId; time: number; multiplier: number }
  | { type: "closeSequence"; completed: boolean }
  | { type: "reset" };
export const initialOsState: OsState = {
  app: "overview",
  locked: false,
  sequence: null,
  history: [],
};
export function osReducer(state: OsState, action: OsAction): OsState {
  switch (action.type) {
    case "open":
      return { ...state, app: action.app };
    case "lock":
      return { ...state, locked: true };
    case "unlock":
      return { ...state, locked: false };
    case "run":
      return {
        ...state,
        sequence: {
          id: action.id,
          startedAt: action.time,
          multiplier: action.multiplier,
        },
      };
    case "closeSequence":
      return {
        ...state,
        sequence: null,
        history:
          action.completed && state.sequence
            ? [...state.history.slice(-7), state.sequence.id]
            : state.history,
      };
    case "reset":
      return initialOsState;
  }
}
