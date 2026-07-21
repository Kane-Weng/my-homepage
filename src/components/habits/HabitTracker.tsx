import { useMemo } from "react";
import { useStore } from "../../store/useStore";
import { useUI } from "../../store/useUI";
import { isScheduledOn, todayStr } from "../../lib/dates";
import HabitItem from "./HabitItem";
import ProgressRing from "./ProgressRing";
import AddHabit from "./AddHabit";
import Heatmap from "./Heatmap";
import type { Habit } from "../../store/types";

export default function HabitTracker() {
  const habits = useStore((s) => s.habits);
  const categories = useStore((s) => s.categories);
  const completions = useStore((s) => s.completions);
  const addHabitOpen = useUI((s) => s.addHabitOpen);
  const setAddHabitOpen = useUI((s) => s.setAddHabitOpen);

  const today = todayStr();
  const now = useMemo(() => new Date(), []);

  // Only habits scheduled today, grouped by category (preserving category order).
  const groups = useMemo(() => {
    const todays = habits.filter((h) => isScheduledOn(h, now));
    const byCat = new Map<string, Habit[]>();
    for (const h of todays) {
      const arr = byCat.get(h.categoryId) ?? [];
      arr.push(h);
      byCat.set(h.categoryId, arr);
    }
    const ordered = categories
      .map((c) => ({ category: c, items: byCat.get(c.id) ?? [] }))
      .filter((g) => g.items.length > 0);
    // Uncategorized / orphaned habits, if any.
    const orphans = todays.filter(
      (h) => !categories.some((c) => c.id === h.categoryId),
    );
    if (orphans.length) {
      ordered.push({
        category: { id: "", name: "Uncategorized", color: "#8b98a5" },
        items: orphans,
      });
    }
    return { ordered, total: todays.length };
  }, [habits, categories, now]);

  const doneCount = useMemo(
    () =>
      habits.filter(
        (h) => isScheduledOn(h, now) && completions[`${h.id}|${today}`],
      ).length,
    [habits, completions, today, now],
  );

  return (
    <section className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-4">
        <ProgressRing done={doneCount} total={groups.total} />
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Today's habits</h2>
          <p className="text-sm text-muted">
            {groups.total === 0
              ? "No habits yet — add your first."
              : doneCount === groups.total
                ? "All done. Nice work. 🎉"
                : `${groups.total - doneCount} left to go.`}
          </p>
        </div>
        <button
          onClick={() => setAddHabitOpen(true)}
          className="rounded-lg bg-accent-2 px-3 py-2 text-sm font-medium text-bg hover:opacity-90"
        >
          + Add
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {groups.ordered.map(({ category, items }) => (
          <div key={category.id || "orphan"}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: category.color }}
              />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                {category.name}
              </h3>
            </div>
            <div className="space-y-1.5">
              {items.map((h) => (
                <HabitItem key={h.id} habit={h} category={category} />
              ))}
            </div>
          </div>
        ))}

        {groups.total === 0 && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
            Track things you want to do daily — LeetCode, reading papers, job
            applications. Streaks build as you keep at it.
          </div>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <Heatmap />
      </div>

      <AddHabit open={addHabitOpen} onClose={() => setAddHabitOpen(false)} />
    </section>
  );
}
