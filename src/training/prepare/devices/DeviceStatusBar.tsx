import type { Finding } from "../../../core/missionLint";
import { t } from "../../../i18n";

// Status bar: actionable status only. Selection and preview state are already
// visible in the workspace, so they are not repeated here.
export function DeviceStatusBar({
  findings,
  unbound,
}: {
  findings: Finding[];
  unbound: number;
}) {
  return (
    <div className="sf-device-status">
      {findings.map((finding) => (
        <span
          key={finding.id}
          className={finding.severity === "error" ? "is-error" : "is-warning"}
        >
          {finding.message}
        </span>
      ))}
      {unbound > 0 && (
        <span className="is-warning">
          {t("prep.devices.unboundCount", { n: unbound })}
        </span>
      )}
    </div>
  );
}
