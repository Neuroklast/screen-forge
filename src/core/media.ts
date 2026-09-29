import { useEffect, useState } from "react";
export type MediaAsset = {
  id: string;
  name: string;
  folder: string;
  type: string;
  blob: Blob;
};
export type MediaView = Omit<MediaAsset, "blob"> & { url: string };
const DB = "screenforge-media-v1";
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("assets", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function transact<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("assets", mode),
      request = operation(tx.objectStore("assets"));
    let result: T;
    request.onsuccess = () => {
      result = request.result;
    };
    tx.oncomplete = () => {
      db.close();
      resolve(result);
      window.dispatchEvent(new Event("screenforge:media"));
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export async function listMedia(): Promise<MediaAsset[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const r = db
      .transaction("assets", "readonly")
      .objectStore("assets")
      .getAll();
    r.onsuccess = () => {
      db.close();
      resolve(r.result);
    };
    r.onerror = () => {
      db.close();
      reject(r.error);
    };
  });
}
export const saveMedia = (asset: MediaAsset) =>
  transact("readwrite", (store) => store.put(asset));
export const deleteMedia = (id: string) =>
  transact("readwrite", (store) => store.delete(id));
export function useMedia() {
  const [assets, setAssets] = useState<MediaView[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true,
      urls: string[] = [];
    let generation = 0;
    const refresh = async () => {
      const ticket = ++generation;
      try {
        const rows = await listMedia();
        if (!alive || ticket !== generation) return;
        urls.forEach(URL.revokeObjectURL);
        const next = rows.map(({ blob, ...a }) => ({
          ...a,
          url: URL.createObjectURL(blob),
        }));
        urls = next.map((a) => a.url);
        setAssets(next);
        setError("");
      } catch {
        setError("Lokaler Medienspeicher nicht verfügbar.");
      }
    };
    void refresh();
    window.addEventListener("screenforge:media", refresh);
    return () => {
      alive = false;
      window.removeEventListener("screenforge:media", refresh);
      urls.forEach(URL.revokeObjectURL);
    };
  }, []);
  return { assets, error };
}
