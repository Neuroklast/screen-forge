import { QRCodeSVG } from "qrcode.react";
import type { Scenario } from "../../../core/training";
import { t } from "../../../i18n";
import { Term } from "../../../ui/terminology/Term";
import { presetLabel } from "../devicePresets";

// Secondary workspace tool: provisioning. It is not persistent page content; the
// user switches to it from the workspace toolbar and stays in the same editor.
export function ProvisioningPanel({
  draft,
  presence,
  online,
  invitation,
  onProvision,
  onRevoke,
  publicOrigin,
  setPublicOrigin,
  invitationUrl,
  onNotice,
}: {
  draft: Scenario;
  presence: Record<string, { online: boolean; lastSeen: number }>;
  online: boolean;
  invitation: {
    token: string;
    station: string;
    role: "hq" | "element";
    expires: number;
  } | null;
  onProvision: (station: string) => void;
  onRevoke: (station: string) => void;
  publicOrigin: string;
  setPublicOrigin: (value: string) => void;
  invitationUrl: string;
  onNotice: (message: string) => void;
}) {
  return (
    <div className="device-provision">
      <h3>{t("prep.devices.tool.provision")}</h3>
      <p className="prepare-hint">{t("trainer.qrNote")}</p>
      <label>
        {t("trainer.address")}
        <input
          value={publicOrigin}
          onChange={(event) => setPublicOrigin(event.target.value)}
        />
      </label>
      <p className="muted">{t("trainer.httpsNote")}</p>
      <div className="device-grid">
        {draft.stations.map((station) => (
          <article key={station.id} className="device-card">
            <span className="eyebrow">
              {station.role === "hq"
                ? t("prep.devices.roleHq")
                : t("prep.devices.roleField")}{" "}
              / {t(presetLabel(station.module))}
            </span>
            <h3>{station.name}</h3>
            <p>
              {presence[station.id]?.online ? (
                <Term id="connected" />
              ) : (
                t("trainer.notConnected")
              )}{" "}
              · {station.team || t("prep.devices.unassigned")}
            </p>
            <small>
              {station.bindings.patient
                ? `${t("trainer.dataSource")}: ${station.bindings.patient}`
                : station.id}
            </small>
            <div className="button-row">
              <button disabled={!online} onClick={() => onProvision(station.id)}>
                {t("trainer.showQr")}
              </button>
              <button disabled={!online} onClick={() => onRevoke(station.id)}>
                {t("trainer.revoke")}
              </button>
            </div>
          </article>
        ))}
      </div>
      {invitation && invitationUrl && (
        <section className="qr-panel" aria-label={t("trainer.assignment")}>
          <h3>
            {draft.stations.find((station) => station.id === invitation.station)
              ?.name}
          </h3>
          <QRCodeSVG value={invitationUrl} size={240} marginSize={4} level="M" />
          <p>
            {t("trainer.validUntil")}{" "}
            {new Date(invitation.expires).toLocaleTimeString()}
          </p>
          <a href={invitationUrl} target="_blank" rel="noreferrer">
            {t("trainer.openLink")}
          </a>
          <button
            onClick={() =>
              void navigator.clipboard
                .writeText(invitationUrl)
                .then(() => onNotice(t("trainer.linkCopied")))
                .catch(() => onNotice(invitationUrl))
            }
          >
            {t("trainer.copyLink")}
          </button>
        </section>
      )}
    </div>
  );
}
