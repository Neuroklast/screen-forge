import type { OrdnanceType } from "../core/ordnance";
import { resolveOrdnanceType } from "../core/ordnance";
import "./device.css";

// English element content, rendered from the mission's ordnance catalogue so the
// data sheet and the ordnance console never diverge.
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
        <p className="device-note">
          No datasheet loaded. Assign an ordnance type to the bound prop.
        </p>
      </section>
    );
  return (
    <section className="device-panel">
      <header className="device-head">
        <h2>{entry.designation}</h2>
        <span className="device-state">{entry.datasheetId || entry.category}</span>
      </header>
      {entry.summary && <p className="device-note">{entry.summary}</p>}
      <h3>Type</h3>
      <p className="device-note">{entry.category}</p>
      <h3>Stages</h3>
      <ol className="device-stages">
        {entry.stages.map((stage) => (
          <li key={stage}>{stage}</li>
        ))}
      </ol>
      <h3>Disposal methods</h3>
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
      <h3>Failure modes</h3>
      <table>
        <thead>
          <tr>
            <th>Failure</th>
            <th>Trigger</th>
            <th>Outcome</th>
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
