import { useStore } from "../../store/useStore";
import { currentStreak, todayStr } from "../../lib/dates";
import type { Category, Habit } from "../../store/types";

interface Props {
  habit: Habit;
  category?: Category;
}

export default function HabitItem({ habit, category }: Props) {
  const completions = useStore((s) => s.completions);
  const toggle = useStore((s) => s.toggleCompletion);
  const removeHabit = useStore((s) => s.removeHabit);

  const today = todayStr();
  const done = !!completions[`${habit.id}|${today}`];
  const streak = currentStreak(habit, completions);
  const accent = category?.color ?? "var(--color-muted)";

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
