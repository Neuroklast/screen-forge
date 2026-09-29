import { useState } from "react";
import { deleteMedia, saveMedia, useMedia } from "../core/media";
import type { Config } from "../core/config";
import { isModelAsset } from "../scenes/shared/ModelViewport";
export function MediaManager({
  config,
  onChange,
}: {
  config: Config;
  onChange: (c: Config) => void;
}) {
  const { assets, error } = useMedia();
  const [savedFolders,setSavedFolders]=useState<string[]>(()=>{try{const value=JSON.parse(localStorage.getItem('screenforge.folders.v1')||'["/"]');return Array.isArray(value)?value.filter(v=>typeof v==='string'&&v.startsWith('/')):['/'];}catch{return ['/'];}});
  const [folder, setFolder] = useState("/"),
    [newFolder, setNewFolder] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(0);
  const folders = Array.from(
    new Set(["/", ...savedFolders,...assets.map((a) => a.folder), folder]),
  );
  const visible = assets.filter((a) => a.folder === folder);
  const selected = config.mediaIds ?? [];
  return (
    <div className="media-manager">
      <nav className="media-folders">
        {folders.map((f) => (
          <button
            key={f}
            className={folder === f ? "active" : ""}
            onClick={() => {
              setFolder(f);
              setPage(0);
            }}
          >
            {f}
          </button>
        ))}
      </nav>
      <div className="media-tools">
        <input
          aria-label="Neuer Medienordner"
          placeholder="/corporation/portraits"
          value={newFolder}
          onChange={(e) => setNewFolder(e.target.value)}
        />
        <button
          onClick={() => {
            const path = "/" + newFolder.split("/").filter(Boolean).join("/");
            if (path.length > 100) return;
            const next=Array.from(new Set([...savedFolders,path]));
            try{localStorage.setItem('screenforge.folders.v1',JSON.stringify(next));setSavedFolders(next);}catch{setStatus('Ordner konnte nicht gespeichert werden.');return;}
            setFolder(path);
            setNewFolder("");
            setPage(0);
          }}
        >
          Ordner öffnen / erstellen
        </button>
        <label>
          Bilder hochladen
          <input
            aria-label="Medien hochladen"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,.glb,.gltf,model/gltf-binary,model/gltf+json"
            multiple
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              try {
                for (const file of files) {
                  const model = /\.(glb|gltf)$/i.test(file.name);
                  if (
                    file.size > 12_000_000 ||
                    !(
                      /^image\/(png|jpeg|webp|gif)$/.test(file.type) ||
                      model
                    )
                  )
                    throw Error(
                      "PNG, JPEG, WebP, GIF oder GLB/GLTF bis 12 MB verwenden.",
                    );
                  await saveMedia({
                    id: crypto.randomUUID(),
                    name: file.name,
                    folder,
                    type: file.type,
                    blob: file,
                  });
                }
                setStatus(`${files.length} Dateien gespeichert.`);
              } catch (e) {
                setStatus(
                  e instanceof Error ? e.message : "Upload fehlgeschlagen.",
                );
              }
            }}
          />
        </label>
      </div>
      <div className="media-grid">
        {visible.slice(page * 6, page * 6 + 6).map((a) => (
          <article key={a.id}>
            {isModelAsset(a) ? (
              <div className="media-model-slot" aria-label={a.name}>
                3D
              </div>
            ) : (
              <img src={a.url} alt={a.name} />
            )}
            <input
              aria-label={`Dateiname ${a.name}`}
              defaultValue={a.name}
              onBlur={async (e) => {
                if (!e.target.value.trim()) return;
                const rows = await import("../core/media").then((m) =>
                  m.listMedia(),
                );
                const row = rows.find((r) => r.id === a.id);
                if (row)
                  await saveMedia({ ...row, name: e.target.value.trim() });
              }}
            />
            <select
              aria-label={`Ordner ${a.name}`}
              value={a.folder}
              onChange={async (e) => {
                const rows = await import("../core/media").then((m) =>
                  m.listMedia(),
                );
                const row = rows.find((r) => r.id === a.id);
                if (row) await saveMedia({ ...row, folder: e.target.value });
              }}
            >
              {folders.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
            <button
              className={selected.includes(a.id) ? "active" : ""}
              onClick={() =>
                onChange({
                  ...config,
                  mediaIds: selected.includes(a.id)
                    ? selected.filter((id) => id !== a.id)
                    : [...selected, a.id],
                })
              }
            >
              {selected.includes(a.id) ? "In Bildfolge" : "Zur Bildfolge"}
            </button>
            <button
              onClick={async () => {
                await deleteMedia(a.id);
                onChange({
                  ...config,
                  mediaIds: selected.filter((id) => id !== a.id),
                });
              }}
            >
              Löschen
            </button>
          </article>
        ))}
      </div>
      <div className="media-pagination">
        <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          Zurück
        </button>
        <span>
          {page + 1} / {Math.max(1, Math.ceil(visible.length / 6))}
        </span>
        <button
          disabled={(page + 1) * 6 >= visible.length}
          onClick={() => setPage((p) => p + 1)}
        >
          Weiter
        </button>
      </div>
      <p>
        {status ||
          error ||
          `${selected.length} Medien in der Bildfolge. GLB/GLTF erscheinen im Analysetisch.`}
      </p>
    </div>
  );
}
