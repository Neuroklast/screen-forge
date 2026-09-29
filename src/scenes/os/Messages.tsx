import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
const messages = [
  {
    sender: "M. Vale",
    subject: "Sector 07 / missing interval",
    body: "The relay archive contains a 1.894 second discontinuity. The sensor log is intact, but the personnel index references a missing fragment. Recover the archive before confirming the review.",
    attachment: "sector-07.fragment",
    action: "Recover attachment",
  },
  {
    sender: "E. Ward",
    subject: "Maintenance window confirmed",
    body: "The reference channel was rerouted at 06:42:17. I remained attached to Relay 12 throughout the handover. Compare my identity signature with the cached session chain.",
    attachment: "ward.record",
    action: "Open personnel",
  },
  {
    sender: "Archive service",
    subject: "Two manifests available",
    body: "The local mirror contains two signed manifests. Indexing has completed. Original fragments remain unchanged until a recovery operation produces a verified result.",
    attachment: "incident-041.manifest",
    action: "Browse archives",
  },
  {
    sender: "Geometry lab",
    subject: "Reconstruction request",
    body: "Seven spatial slices have been received. Reconstruct the dimensional model, compare the boundary surfaces and retain the report in the workspace.",
    attachment: "assembly-0041.model",
    action: "Reconstruct model",
  },
  {
    sender: "Operator control",
    subject: "Session protocol",
    body: "All findings must include a completed verification sequence. Aborted operations produce no verified report. Preserve the initial session before recording the next take.",
    attachment: "operator.notes",
    action: "Browse archives",
  },
];
export function Messages({ onAction }: { onAction: (index: number) => void }) {
  const [selected, setSelected] = useState(0),
    [reviewed, setReviewed] = useState<number[]>([]);
  const m = messages[selected];
  return (
    <>
      <div className="os-section-head">
        <div>
          <span className="os-kicker">SECURE MESSAGES / LOCAL CACHE</span>
          <h2>Communication archive.</h2>
        </div>
        <span>{messages.length - reviewed.length} PENDING REVIEW</span>
      </div>
      <div className="os-messages">
        <nav>
          {messages.map((m, i) => (
            <button
              key={m.subject}
              className={i === selected ? "active" : ""}
              onClick={() => setSelected(i)}
            >
              <small>
                {m.sender} / 06:4{i}:17
              </small>
              <strong>{m.subject}</strong>
              <span>{reviewed.includes(i) ? "REVIEWED" : "NEW RECORD"}</span>
            </button>
          ))}
        </nav>
        <AnimatePresence mode="wait">
          <motion.article
            key={selected}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
          >
            <span className="os-kicker">
              ENCRYPTED ARCHIVE / RECORD 0{selected + 1}
            </span>
            <h3>{m.subject}</h3>
            <p className="message-sender">
              FROM {m.sender} / AUTHENTICATED LOCAL SIGNATURE
            </p>
            <p className="message-body">{m.body}</p>
            <div className="message-attachment">
              ATTACHED RESOURCE
              <br />
              <strong>{m.attachment}</strong>
            </div>
            <div className="os-inline-actions">
              <button className="os-button" onClick={() => onAction(selected)}>
                {m.action}
              </button>
              <button
                className="os-button"
                disabled={reviewed.includes(selected)}
                onClick={() => setReviewed((v) => [...v, selected])}
              >
                {reviewed.includes(selected)
                  ? "Review recorded"
                  : "Mark reviewed"}
              </button>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </>
  );
}
