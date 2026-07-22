import { useState } from "react";
import HabitTracker from "./habits/HabitTracker";
import TodoList from "./todos/TodoList";

type Tab = "habits" | "todos";

const TABS: { id: Tab; label: string }[] = [
  { id: "habits", label: "Habits" },
  { id: "todos", label: "To-dos" },
];

export default function TrackerPanel() {
  const [tab, setTab] = useState<Tab>("habits");

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex gap-1 self-start rounded-lg bg-surface-2 p-1 text-sm">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              tab === t.id
                ? "bg-surface text-fg shadow-sm"
                : "text-muted hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        {tab === "habits" ? <HabitTracker /> : <TodoList />}
      </div>
    </div>
  );
}
