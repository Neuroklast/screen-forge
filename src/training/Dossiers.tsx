import { useState } from "react";
import { exampleMedia } from "../core/exampleMedia";
import type { TrainingDossier } from "../core/training";
import { t } from "../i18n";
export function DossierCards({ dossiers }: { dossiers: TrainingDossier[] }) {
  const [selected, setSelected] = useState("");
  const d = dossiers.find((d) => d.id === selected) || dossiers[0];
  if (!d)
    return (
      <section className="panel">
        <h2>Personnel files</h2>
        <p>No files released.</p>
      </section>
    );
  return (
    <section className="panel dossier-reader">
      <h2>Personnel files</h2>
      <nav className="tab-bar">
        {dossiers.map((row) => (
          <button key={row.id} onClick={() => setSelected(row.id)}>
            {row.name}
          </button>
        ))}
      </nav>
      <div className="dossier-body">
        {d.photo && <img src={d.photo} alt={`Portrait ${d.name}`} />}
        <div>
          <span className="eyebrow">
            {d.id} · {d.status}
          </span>
          <h3>{d.name}</h3>
          <dl>
            {[
              ["Role", d.role],
              ["Blood", d.blood],
              ["Allergies", d.allergies],
              ["Clearance", d.clearance],
              ["Facility", d.facility],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v || "—"}</dd>
              </div>
            ))}
          </dl>
          <p>{d.notes}</p>
          <ul>
            {d.events.map((event, i) => (
              <li key={i}>{event}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
async function photoData(file: File) {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 10000000
  )
    throw new Error(t("dossier.photoError"));
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas"),
    ratio = Math.min(1, 480 / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.78);
}
const FIELD_LABEL: Record<string, string> = {
  name: "dossier.name",
  role: "dossier.role",
  blood: "dossier.blood",
  allergies: "dossier.allergies",
  clearance: "dossier.clearance",
  status: "dossier.status",
  facility: "dossier.facility",
};
export function DossierEditor({
  dossiers,
  onChange,
}: {
  dossiers: TrainingDossier[];
  onChange: (d: TrainingDossier[]) => void;
}) {
  const [id, setId] = useState(dossiers[0]?.id || ""),
    [error, setError] = useState("");
  const d = dossiers.find((row) => row.id === id) || dossiers[0];
  const update = (patch: Partial<TrainingDossier>) =>
    onChange(
      dossiers.map((row) => (row.id === d.id ? { ...row, ...patch } : row)),
    );
  return (
    <section className="panel">
      <h2>{t("dossier.edit")}</h2>
      <div className="tab-bar">
        {dossiers.map((row) => (
          <button key={row.id} onClick={() => setId(row.id)}>
            {row.name}
          </button>
        ))}
        <button
          onClick={() => {
            const id = `file-${crypto.randomUUID().slice(0, 8)}`;
            onChange([
              ...dossiers,
              {
                id,
                name: t("dossier.newPerson"),
                role: "",
                blood: "",
                allergies: "",
                clearance: "",
                status: "",
                facility: "",
                notes: "",
                events: [],
                photo: "",
                released: false,
              },
            ]);
            setId(id);
          }}
        >
          {t("dossier.new")}
        </button>
      </div>
      {d && (
        <>
          <div className="form-grid">
            {(
              [
                "name",
                "role",
                "blood",
                "allergies",
                "clearance",
                "status",
                "facility",
              ] as const
            ).map((k) => (
              <label key={k}>
                {t(FIELD_LABEL[k])}
                <input
                  value={d[k]}
                  onChange={(e) => update({ [k]: e.target.value })}
                />
              </label>
            ))}
            <label>
              {t("dossier.notes")}
              <textarea
                value={d.notes}
                onChange={(e) => update({ notes: e.target.value })}
              />
            </label>
            <label>
              {t("dossier.history")}
              <textarea
                value={d.events.join("\n")}
                onChange={(e) => update({ events: e.target.value.split("\n") })}
              />
            </label>
            <label>
              {t("dossier.examplePortrait")}
              <select
                value={d.photo.startsWith("/media/") ? d.photo : ""}
                onChange={(e) => update({ photo: e.target.value })}
              >
                <option value="">{t("dossier.noExample")}</option>
                {exampleMedia
                  .filter((m) => m.folder.includes("portraits"))
                  .map((m) => (
                    <option key={m.id} value={m.src}>
                      {m.name.replace(/_2K_.*/, "").replaceAll("_", " ")}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              {t("dossier.uploadPhoto")}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0],
                    target = d.id;
                  if (file)
                    void photoData(file)
                      .then((photo) =>
                        onChange(
                          dossiers.map((row) =>
                            row.id === target ? { ...row, photo } : row,
                          ),
                        ),
                      )
                      .catch((e) => setError(e.message));
                }}
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={d.released}
                onChange={(e) => update({ released: e.target.checked })}
              />
              {t("dossier.released")}
            </label>
          </div>
          {d.photo && (
            <img
              className="portrait-preview"
              src={d.photo}
              alt={t("dossier.portraitAlt")}
            />
          )}
          <button
            onClick={() => onChange(dossiers.filter((row) => row.id !== d.id))}
          >
            {t("dossier.delete")}
          </button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
