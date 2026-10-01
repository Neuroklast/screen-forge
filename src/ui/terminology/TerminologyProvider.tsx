import { createContext, useContext, type ReactNode } from "react";
import {
  useTerminology,
  type TerminologyContextValue,
} from "./useTerminology";

// Provides one terminology subscription for a subtree. Components may also call
// useTerminology directly; both paths re-render on locale/profile/density change.
const TerminologyContext = createContext<TerminologyContextValue | null>(null);

export function TerminologyProvider({ children }: { children: ReactNode }) {
  const value = useTerminology();
  return (
    <TerminologyContext.Provider value={value}>
      {children}
    </TerminologyContext.Provider>
  );
}

export function useTerminologyContext(): TerminologyContextValue {
  const context = useContext(TerminologyContext);
  if (!context)
    throw new Error(
      "useTerminologyContext must be used inside <TerminologyProvider>.",
    );
  return context;
}
