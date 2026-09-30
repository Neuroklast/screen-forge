import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

// Shared message-viewer capability (SSOT: never two). Used by the OS Messages
// app and by the workflow message surface; element content is English.
export type ViewerMessage = {
  id: string;
  sender: string;
  subject: string;
  body: string;
  attachment?: string;
  action?: string;
};

export function MessageViewer({
  messages,
  onAction,
  disabled = false,
}: {
  messages: ViewerMessage[];
  onAction?: (id: string) => void;
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const current = messages[selected] ?? messages[0];
  if (!current) return <p className="message-body">No messages.</p>;
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
          {messages.map((row, i) => (
            <button
              key={row.id}
              className={i === selected ? "active" : ""}
              onClick={() => setSelected(i)}
            >
              <small>
                {row.sender} / 06:4{i}:17
              </small>
              <strong>{row.subject}</strong>
              <span>
                {reviewed.includes(row.id) ? "REVIEWED" : "NEW RECORD"}
              </span>
            </button>
          ))}
        </nav>
        <AnimatePresence mode="wait">
          <motion.article
            key={current.id}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
          >
            <span className="os-kicker">
              ENCRYPTED ARCHIVE / RECORD 0{selected + 1}
            </span>
            <h3>{current.subject}</h3>
            <p className="message-sender">
              FROM {current.sender} / AUTHENTICATED LOCAL SIGNATURE
            </p>
            <p className="message-body">{current.body}</p>
            {current.attachment && (
              <div className="message-attachment">
                ATTACHED RESOURCE
                <br />
                <strong>{current.attachment}</strong>
              </div>
            )}
            <div className="os-inline-actions">
              {current.action && onAction && (
                <button
                  className="os-button"
                  disabled={disabled}
                  onClick={() => onAction(current.id)}
                >
                  {current.action}
                </button>
              )}
              <button
                className="os-button"
                disabled={disabled || reviewed.includes(current.id)}
                onClick={() => setReviewed((v) => [...v, current.id])}
              >
                {reviewed.includes(current.id)
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
