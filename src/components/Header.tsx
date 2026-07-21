import { useEffect, useState } from "react";

function greeting(h: number): string {
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Header({ name = "Kane" }: { name?: string }) {
  const [hour, setHour] = useState(() => new Date().getHours());

  useEffect(() => {
    const id = setInterval(() => setHour(new Date().getHours()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="mb-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        {greeting(hour)}, {name}.
      </h1>
      <p className="text-sm text-muted">
        Press{" "}
        <kbd className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">⌘K</kbd> for
        the command palette.
      </p>
    </header>
  );
}
