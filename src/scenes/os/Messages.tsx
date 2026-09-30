import { MessageViewer, type ViewerMessage } from "../../components/MessageViewer";

const messages: ViewerMessage[] = [
  {
    id: "sector-07",
    sender: "M. Vale",
    subject: "Sector 07 / missing interval",
    body: "The relay archive contains a 1.894 second discontinuity. The sensor log is intact, but the personnel index references a missing fragment. Recover the archive before confirming the review.",
    attachment: "sector-07.fragment",
    action: "Recover attachment",
  },
  {
    id: "ward",
    sender: "E. Ward",
    subject: "Maintenance window confirmed",
    body: "The reference channel was rerouted at 06:42:17. I remained attached to Relay 12 throughout the handover. Compare my identity signature with the cached session chain.",
    attachment: "ward.record",
    action: "Open personnel",
  },
  {
    id: "manifests",
    sender: "Archive service",
    subject: "Two manifests available",
    body: "The local mirror contains two signed manifests. Indexing has completed. Original fragments remain unchanged until a recovery operation produces a verified result.",
    attachment: "incident-041.manifest",
    action: "Browse archives",
  },
  {
    id: "geometry",
    sender: "Geometry lab",
    subject: "Reconstruction request",
    body: "Seven spatial slices have been received. Reconstruct the dimensional model, compare the boundary surfaces and retain the report in the workspace.",
    attachment: "assembly-0041.model",
    action: "Reconstruct model",
  },
  {
    id: "protocol",
    sender: "Operator control",
    subject: "Session protocol",
    body: "All findings must include a completed verification sequence. Aborted operations produce no verified report. Preserve the initial session before recording the next take.",
    attachment: "operator.notes",
    action: "Browse archives",
  },
];

export function Messages({ onAction }: { onAction: (index: number) => void }) {
  return (
    <MessageViewer
      messages={messages}
      onAction={(id) => {
        const index = messages.findIndex((row) => row.id === id);
        if (index >= 0) onAction(index);
      }}
    />
  );
}
