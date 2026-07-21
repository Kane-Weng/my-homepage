import { addDays, format, startOfDay, subDays } from "date-fns";
import type { Completion, DateStr, Habit, Weekday } from "../store/types";

/** Canonical day-string used everywhere (local time). */
export const toDateStr = (d: Date): DateStr => format(d, "yyyy-MM-dd");

export const todayStr = (): DateStr => toDateStr(new Date());

/** A habit with an empty weekday list is treated as "every day". */
export const isScheduledOn = (habit: Habit, date: Date): boolean =>
  habit.weekdays.length === 0 ||
  habit.weekdays.includes(date.getDay() as Weekday);

/**
 * Current streak = number of consecutive *scheduled* days, counting back from
 * today, that were completed. Non-scheduled days are skipped (they don't break
 * the streak). If today is scheduled but not yet done, today is skipped so the
 * streak reflects the run up to (but not breaking on) an unfinished today.
 */
export function currentStreak(
  habit: Habit,
  completions: Record<string, Completion>,
  now = new Date(),
): number {
  const done = (d: Date) => !!completions[`${habit.id}|${toDateStr(d)}`];
  let streak = 0;
  let cursor = startOfDay(now);

  // If today is scheduled but not done yet, don't count it as a break.
  if (isScheduledOn(habit, cursor) && !done(cursor)) {
    cursor = subDays(cursor, 1);
  }

  // Walk backwards over scheduled days; stop at the first missed one.
  for (let i = 0; i < 366; i++) {
    if (isScheduledOn(habit, cursor)) {
      if (done(cursor)) streak++;
      else break;
    }
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export interface HeatmapDay {
  date: DateStr;
  /** JS Date for tooltip/label use. */
  d: Date;
  count: number;
  /** True when the day falls outside the requested window (padding). */
  pad: boolean;
}

/**
 * Build a GitHub-style grid: columns are weeks (Sun→Sat rows), covering the
 * last `weeks` weeks up to today. `counts` maps a DateStr to completions that
 * day. Returns weeks[] of 7 days each.
 */
export function buildHeatmap(
  counts: Record<DateStr, number>,
  weeks = 13,
  now = new Date(),
): HeatmapDay[][] {
  const today = startOfDay(now);
  // End on the Saturday of this week so the last column is full.
  const endOfWeek = addDays(today, 6 - today.getDay());
  const start = subDays(endOfWeek, weeks * 7 - 1);

  const cols: HeatmapDay[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: HeatmapDay[] = [];
    for (let day = 0; day < 7; day++) {
      const d = addDays(start, w * 7 + day);
      const date = toDateStr(d);
      col.push({ date, d, count: counts[date] ?? 0, pad: d > today });
    }
    cols.push(col);
  }
  return cols;
}
