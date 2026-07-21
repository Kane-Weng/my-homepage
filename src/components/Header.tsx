import { useEffect, useState } from "react";
import ModeSwitcher from "./ModeSwitcher";
import Settings from "./Settings";
import AccountButton from "./AccountButton";

function greeting(h: number): string {
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Header({ name = "Kane" }: { name?: string }) {
  const [hour, setHour] = useState(() => new Date().getHours());
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setHour(new Date().getHours()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="mb-2 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting(hour)}, {name}.
        </h1>
        <p className="text-sm text-muted">
          Press{" "}
          <kbd className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">⌘K</kbd>{" "}
          for the command palette.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <AccountButton />
        <ModeSwitcher />
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
          className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-muted hover:text-fg"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        </button>
      </div>

      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}
