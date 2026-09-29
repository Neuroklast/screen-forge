export function StageKeys({
  onKey,
  disabled,
}: {
  onKey: (key: string) => void;
  disabled?: boolean;
}) {
  const rows = ["1234567890", "QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM-."];
  return (
    <div className="stage-keys" aria-label="Bühnen-Tastatur">
      {rows.map((row) => (
        <div key={row}>
          {[...row].map((k) => (
            <button
              type="button"
              key={k}
              disabled={disabled}
              onClick={() => onKey(k)}
            >
              {k}
            </button>
          ))}
        </div>
      ))}
      <div>
        <button type="button" disabled={disabled} onClick={() => onKey(" ")}>
          SPC
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onKey("Backspace")}
        >
          DEL
        </button>
        <button type="button" disabled={disabled} onClick={() => onKey("Enter")}>
          RET
        </button>
      </div>
    </div>
  );
}
