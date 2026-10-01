import { t } from "../../../i18n";
import type { PreviewState } from "./preview";

export function DeviceStatusBar({
  count,
  selectedName,
  preview,
}: {
  count: number;
  selectedName: string;
  preview: PreviewState;
}) {
  return (
    <div className="device-status">
      <span>{t("prep.devices.deviceCount", { n: count })}</span>
      <span>
        {t("prep.devices.selected")}:{" "}
        {selectedName || t("prep.devices.noSelection")}
      </span>
      <span>
        {t("prep.devices.previewState")}: {t(`prep.devices.state.${preview}`)}
      </span>
    </div>
  );
}
