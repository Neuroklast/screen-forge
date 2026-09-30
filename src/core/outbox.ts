import { newEventId } from "./protocol";

export type OutboxState = "queued" | "sent" | "acked" | "rejected" | "superseded";

export type OutboxEntry = {
  eventId: string;
  room: string;
  deviceId: string;
  deviceSeq: number;
  message: Record<string, unknown>;
  state: OutboxState;
  createdAt: number;
};

const DB = "screenforge-outbox";
const STORE = "commands";

// In-memory mirror keeps behaviour identical where IndexedDB is unavailable
// (Node tests, private browsing) and lets callers read synchronously-ish.
const memory = new Map<string, OutboxEntry>();

function open(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE))
          db.createObjectStore(STORE, { keyPath: "eventId" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function request<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest,
): Promise<T | null> {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => resolve(null);
  });
}

export async function put(entry: OutboxEntry): Promise<void> {
  memory.set(entry.eventId, entry);
  const db = await open();
  if (db) await request(db, "readwrite", (s) => s.put(entry));
}

export async function update(
  eventId: string,
  state: OutboxState,
): Promise<void> {
  const existing = memory.get(eventId);
  if (existing) memory.set(eventId, { ...existing, state });
  const db = await open();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.get(eventId);
    req.onsuccess = () => {
      if (req.result) store.put({ ...req.result, state });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function remove(eventId: string): Promise<void> {
  memory.delete(eventId);
  const db = await open();
  if (db) await request(db, "readwrite", (s) => s.delete(eventId));
}

export async function entries(): Promise<OutboxEntry[]> {
  const db = await open();
  if (!db) return [...memory.values()];
  const list = await request<OutboxEntry[]>(db, "readonly", (s) => s.getAll());
  return list ?? [...memory.values()];
}

// Ordered pending commands to replay on reconnect; never a blind FIFO, the
// server re-validates each command against the current state. Scoped to the
// active room and device so commands from another session are never replayed.
export function pending(
  list: OutboxEntry[],
  room: string,
  deviceId: string,
): OutboxEntry[] {
  return list
    .filter(
      (e) =>
        e.room === room &&
        e.deviceId === deviceId &&
        (e.state === "queued" || e.state === "sent"),
    )
    .sort((a, b) => a.deviceSeq - b.deviceSeq);
}

// Keep a short history of settled commands for diagnostics/AAR; drop the rest.
export function pruneAcked(list: OutboxEntry[], keep = 20): string[] {
  const settled = list
    .filter((e) => e.state === "acked" || e.state === "rejected")
    .sort((a, b) => b.deviceSeq - a.deviceSeq);
  return settled.slice(keep).map((e) => e.eventId);
}

export function deviceId(): string {
  try {
    const key = "screenforge.deviceId";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = newEventId();
    localStorage.setItem(key, id);
    return id;
  } catch {
    return newEventId();
  }
}

export function clearMemory(): void {
  memory.clear();
}
