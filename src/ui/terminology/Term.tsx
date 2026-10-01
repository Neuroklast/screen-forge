import type { TermForm } from "../../core/terminology/types";
import { useTerminologyContext } from "./TerminologyProvider";

// Renders a semantic term. Never hardcode a tactical label in a migrated surface.
export function Term({
  id,
  form = "short",
}: {
  id: string;
  form?: TermForm;
}) {
  const { term } = useTerminologyContext();
  return <>{term(id, { form })}</>;
}
