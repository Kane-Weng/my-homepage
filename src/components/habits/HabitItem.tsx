import { useStore } from "../../store/useStore";
import { currentStreak, todayStr } from "../../lib/dates";
import type { Category, Habit } from "../../store/types";

interface Props {
  habit: Habit;
  category?: Category;
  editing?: boolean;
  categories?: Category[];
}

export default function HabitItem({ habit, category, editing, categories }: Props) {
  const completions = useStore((s) => s.completions);
  const toggle = useStore((s) => s.toggleCompletion);
  const removeHabit = useStore((s) => s.removeHabit);
  const updateHabit = useStore((s) => s.updateHabit);

  const today = todayStr();
  const done = !!completions[`${habit.id}|${today}`];
  const streak = currentStreak(habit, completions);
  const accent = category?.color ?? "var(--color-muted)";

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <input
          defaultValue={habit.title}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== habit.title) updateHabit(habit.id, { title: v });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          aria-label={`Edit habit name for ${habit.title}`}
          className="min-w-0 flex-1 rounded-md bg-surface-2 px-2 py-1 text-sm outline-none ring-accent-2/50 focus:ring-2"
        />
        <select
          value={habit.categoryId}
          onChange={(e) => updateHabit(habit.id, { categoryId: e.target.value })}
          aria-label={`Category for ${habit.title}`}
          className="shrink-0 rounded-md bg-surface-2 px-2 py-1 text-xs text-muted outline-none ring-accent-2/50 focus:ring-2"
        >
          {!categories?.some((c) => c.id === habit.categoryId) && (
            <option value={habit.categoryId}>Uncategorized</option>
          )}
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => removeHabit(habit.id)}
          aria-label={`Delete ${habit.title}`}
          className="shrink-0 text-muted hover:text-rose-400"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-3 rounded-lg border border-border px-3 py-2 transition-colors ${
        done ? "bg-surface-2/60" : "bg-surface hover:border-border/80"
      }`}
    >
      <button
        onClick={() => toggle(habit.id, today)}
        aria-pressed={done}
        aria-label={done ? `Mark ${habit.title} not done` : `Mark ${habit.title} done`}
        className="grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition-colors"
        style={{
          borderColor: accent,
          background: done ? accent : "transparent",
        }}
      >
        {done && (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="#0b0f14"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <span
        className={`flex-1 truncate text-sm ${
          done ? "text-muted line-through" : "text-fg"
        }`}
      >
        {habit.title}
      </span>

      {streak > 0 && (
        <span
          className="shrink-0 text-xs font-medium tabular-nums text-muted"
          title={`${streak}-day streak`}
        >
          🔥 {streak}
        </span>
      )}

      <button
        onClick={() => removeHabit(habit.id)}
        aria-label={`Delete ${habit.title}`}
        className="shrink-0 text-muted opacity-0 transition-opacity hover:text-fg group-hover:opacity-100"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
