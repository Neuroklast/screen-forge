import type { OrdnanceType } from "../core/ordnance";
import { resolveOrdnanceType } from "../core/ordnance";
import { t } from "../i18n";
import "./device.css";

// Rendered from the mission's ordnance catalogue so the data sheet and the
// ordnance console never diverge; chrome labels follow the active locale.
export function OrdnanceDatasheet({
  ordnanceId,
  custom = [],
}: {
  ordnanceId: string;
  custom?: OrdnanceType[];
}) {
  const entry = resolveOrdnanceType(ordnanceId, custom);
  if (!entry)
    return (
      <section className="device-panel">
        <p className="device-note">{t("datasheet.none")}</p>
      </section>
    );
  return (
    <section className="device-panel">
      <header className="device-head">
        <h2>{entry.designation}</h2>
        <span className="device-state">{entry.datasheetId || entry.category}</span>
      </header>
      {entry.summary && <p className="device-note">{entry.summary}</p>}
      <h3>{t("datasheet.type")}</h3>
      <p className="device-note">{entry.category}</p>
      <h3>{t("datasheet.stages")}</h3>
      <ol className="device-stages">
        {entry.stages.map((stage) => (
          <li key={stage}>{stage}</li>
        ))}
      </ol>
      <h3>{t("datasheet.disposalMethods")}</h3>
      {entry.methods.map((method) => (
        <div key={method.id}>
          <b>{method.name}</b>
          <ol className="device-steps">
            {method.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      ))}
      <h3>{t("ordnance.failureModes")}</h3>
      <table>
        <thead>
          <tr>
            <th>{t("datasheet.failure")}</th>
            <th>{t("datasheet.trigger")}</th>
            <th>{t("datasheet.outcome")}</th>
          </tr>
        </thead>
        <tbody>
          {entry.failures.map((failure) => (
            <tr key={failure.id}>
              <td>{failure.name}</td>
              <td>{failure.trigger}</td>
              <td>{failure.outcome}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
