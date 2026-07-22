import { useStore } from "../store/useStore";

/** Everything worth backing up — the persisted data slices, no actions.
 *  (The uploaded background image lives in IndexedDB and is not included.) */
export interface BackupData {
  version: number;
  exportedAt: string;
  categories: unknown;
  habits: unknown;
  completions: unknown;
  notes: unknown;
  links: unknown;
  todos: unknown;
  settings: unknown;
}

export function snapshot(): BackupData {
  const s = useStore.getState();
  return {
    version: 4,
    exportedAt: new Date().toISOString(),
    categories: s.categories,
    habits: s.habits,
    completions: s.completions,
    notes: s.notes,
    links: s.links,
    todos: s.todos,
    settings: s.settings,
  };
}

/** Download the current data as a JSON file. */
export function exportData(): void {
  const blob = new Blob([JSON.stringify(snapshot(), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `homepage-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Replace the current data with the contents of a backup file. */
export async function importData(file: File): Promise<void> {
  const parsed = JSON.parse(await file.text());
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Not a valid backup file.");
  }
  const current = useStore.getState();
  useStore.setState({
    categories: parsed.categories ?? current.categories,
    habits: parsed.habits ?? current.habits,
    completions: parsed.completions ?? current.completions,
    notes: parsed.notes ?? current.notes,
    links: parsed.links ?? current.links,
    todos: parsed.todos ?? current.todos,
    settings: { ...current.settings, ...(parsed.settings ?? {}) },
  });
}
