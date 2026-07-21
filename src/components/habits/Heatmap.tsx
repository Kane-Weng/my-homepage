import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useStore } from "../../store/useStore";
import { buildHeatmap, isScheduledOn, toDateStr } from "../../lib/dates";
import type { DateStr } from "../../store/types";

/** Opacity ramp for 0..4+ completions on a day. */
function levelStyle(count: number, max: number): React.CSSProperties {
  if (count === 0) return { background: "var(--color-surface-2)" };
  const t = Math.min(1, count / Math.max(1, max));
  return { background: "var(--color-accent)", opacity: 0.35 + 0.65 * t };
}

export default function Heatmap() {
  const habits = useStore((s) => s.habits);
  const completions = useStore((s) => s.completions);
  const categories = useStore((s) => s.categories);
  const [catFilter, setCatFilter] = useState<string>("all");

  const { weeks, max } = useMemo(() => {
    const habitIds = new Set(
      habits
        .filter((h) => catFilter === "all" || h.categoryId === catFilter)
        .map((h) => h.id),
    );
    const counts: Record<DateStr, number> = {};
    for (const comp of Object.values(completions)) {
      if (habitIds.has(comp.habitId)) {
        counts[comp.date] = (counts[comp.date] ?? 0) + 1;
      }
    }
    const grid = buildHeatmap(counts, 13);
    const max = Math.max(1, ...Object.values(counts));
    return { weeks: grid, max };
  }, [habits, completions, catFilter]);

  // How many habits are scheduled on a given day (the day's denominator).
  const scheduledCount = (d: Date) =>
    habits.filter(
      (h) =>
        (catFilter === "all" || h.categoryId === catFilter) &&
        isScheduledOn(h, d),
    ).length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted">Activity</h3>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="rounded bg-surface-2 px-2 py-1 text-xs text-fg outline-none"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((col, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {col.map((day) => {
              const sched = scheduledCount(day.d);
              const title = day.pad
                ? ""
                : `${format(day.d, "EEE, MMM d")} — ${day.count}${
                    sched ? `/${sched}` : ""
                  } done`;
              return (
                <div
                  key={day.date}
                  title={title}
                  className="h-[11px] w-[11px] rounded-[2px]"
                  style={{
                    ...levelStyle(day.count, max),
                    visibility: day.pad ? "hidden" : "visible",
                    outline:
                      day.date === toDateStr(new Date())
                        ? "1px solid var(--color-accent-2)"
                        : undefined,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
