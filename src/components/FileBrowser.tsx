import { useState } from "react";

// Shared file-browser capability (SSOT: never two). The field surface renders
// it; the OS archive pane predates it and its migration is tracked separately.
export type BrowserFile = { id: string; name: string; body?: string };

export function FileBrowser({
  title,
  files,
  onSelect,
  onComplete,
  disabled = false,
}: {
  title?: string;
  files: BrowserFile[];
  onSelect?: (id: string) => void;
  onComplete?: () => void;
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState(files[0]?.id ?? "");
  const current = files.find((file) => file.id === selected) ?? files[0];
  return (
    <div className="fb">
      <nav className="fb-list" aria-label={title || "Files"}>
        {files.map((file) => (
          <button
            key={file.id}
            className={file.id === selected ? "active" : ""}
            disabled={disabled}
            onClick={() => {
              setSelected(file.id);
              onSelect?.(file.id);
            }}
          >
            <strong>{file.name}</strong>
          </button>
        ))}
      </nav>
      <section className="fb-detail">
        {current ? (
          <>
            <h3>{current.name}</h3>
            {current.body && <p>{current.body}</p>}
          </>
        ) : (
          <p>No files.</p>
        )}
        <button
          className="wf-submit wf-wide"
          disabled={disabled || !current}
          onClick={() => onComplete?.()}
        >
          CONFIRM SELECTION
        </button>
      </section>
    </div>
  );
}
