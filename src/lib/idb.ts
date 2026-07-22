/**
 * Tiny promise wrapper over a single IndexedDB key/value store.
 * Used for the uploaded background image, which is too large to keep in the
 * localStorage blob that Zustand persists.
 */
const DB_NAME = "my-homepage";
const STORE = "kv";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = run(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export const idbSet = (key: string, value: Blob): Promise<IDBValidKey> =>
  tx("readwrite", (s) => s.put(value, key));

export const idbGet = (key: string): Promise<Blob | undefined> =>
  tx<Blob | undefined>("readonly", (s) => s.get(key));

export const idbDel = (key: string): Promise<undefined> =>
  tx<undefined>("readwrite", (s) => s.delete(key));

/** Fixed key for the legacy single custom background image. */
export const BG_IMAGE_KEY = "bg-image";

/** IDB key for a background-library image blob. */
export const bgKey = (id: string): string => `bg-${id}`;
