import type { PhraseParams } from "../../core/terminology/types";
import { useTerminologyContext } from "./TerminologyProvider";

// Renders a parameterized phrase template through the active profile.
export function Phrase({
  id,
  params,
}: {
  id: string;
  params?: PhraseParams;
}) {
  const { termPhrase } = useTerminologyContext();
  return <>{termPhrase(id, params)}</>;
}
