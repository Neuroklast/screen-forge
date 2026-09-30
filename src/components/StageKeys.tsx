import { t } from "../i18n";

export function StageKeys({
  onKey,
  disabled,
  active,
}: {
  onKey: (key: string) => void;
  disabled?: boolean;
  active?: string | null;
}) {
  const rows = ["1234567890", "QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM-."];
  const cls = (k: string) => (active === k ? "is-active" : "");
  return (
    <div className="stage-keys" aria-label={t("studio.stageKeyboard")}>
      {rows.map((row) => (
        <div key={row}>
          {[...row].map((k) => (
            <button
              type="button"
              key={k}
              disabled={disabled}
              className={cls(k)}
              onClick={() => onKey(k)}
            >
              {k}
            </button>
          ))}
        </div>
      ))}
      <div>
        <button
          type="button"
          disabled={disabled}
          className={cls(" ")}
          onClick={() => onKey(" ")}
        >
          SPC
        </button>
        <button
          type="button"
          disabled={disabled}
          className={cls("Backspace")}
          onClick={() => onKey("Backspace")}
        >
          DEL
        </button>
        <button
          type="button"
          disabled={disabled}
          className={cls("Enter")}
          onClick={() => onKey("Enter")}
        >
          RET
        </button>
      </div>
    </div>
  );
}
