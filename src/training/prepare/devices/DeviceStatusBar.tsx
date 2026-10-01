import { t } from "../../../i18n";
import type { PreviewState } from "./preview";

// Status bar: selection, device state and the active preview state. Status only,
// never controls.
export function DeviceStatusBar({
  count,
  selectionLabel,
  preview,
}: {
  count: number;
  selectionLabel: string;
  preview: PreviewState;
}) {
  return (
    <div className="device-status">
      <span>{t("prep.devices.deviceCount", { n: count })}</span>
      <span>
        {t("prep.devices.selected")}:{" "}
        {selectionLabel || t("prep.devices.noSelection")}
      </span>
      <span>
        {t("prep.devices.previewState")}: {t(`prep.devices.state.${preview}`)}
      </span>
    </div>
  );
}
