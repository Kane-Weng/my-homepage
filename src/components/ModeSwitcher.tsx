import { useStore } from "../store/useStore";
import type { LinkMode } from "../store/types";

const MODES: { id: LinkMode; label: string }[] = [
  { id: "all", label: "All" },
  { id: "work", label: "Work" },
  { id: "relax", label: "Relax" },
];

/** Segmented control that sets the active link mode. */
export default function ModeSwitcher() {
  const mode = useStore((s) => s.settings.mode);
  const setMode = useStore((s) => s.setMode);

  return (
    <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            mode === m.id
              ? "bg-surface-2 text-fg"
              : "text-muted hover:text-fg"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
