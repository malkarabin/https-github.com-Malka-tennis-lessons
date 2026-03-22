/**
 * Phase 2: expand recurring series into concrete lesson instances.
 * Window = current + next calendar month, extended to include request range when provided.
 */

import type { RecurringSeries, Lesson } from "./types";
import { getCurrentMonthBounds, getNextMonthBounds, getExpansionWindow } from "./calendar";

function getWindowBounds(): { start: Date; end: Date } {
  const cur = getCurrentMonthBounds();
  const next = getNextMonthBounds();
  return { start: cur.start, end: next.end };
}

/** Find first date in [windowStart, windowEnd] that has getDay() === weekday. */
function firstOccurrenceInWindow(weekday: number, windowStart: Date, windowEnd: Date): Date | null {
  const d = new Date(windowStart);
  d.setHours(0, 0, 0, 0);
  while (d.getTime() <= windowEnd.getTime()) {
    if (d.getDay() === weekday) return d;
    d.setDate(d.getDate() + 1);
  }
  return null;
}

function addWeek(d: Date): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + 7);
  return out;
}

/** Generate lesson instance for a given date (same hour as series). Returns null if occurrence is canceled. */
function instanceAt(series: RecurringSeries, date: Date): Lesson | null {
  const start = new Date(date);
  start.setHours(series.hour, 0, 0, 0);
  if (series.canceledOccurrences?.includes(start.getTime())) return null;
  return {
    id: `rec-${series.id}-${start.getTime()}`,
    coachId: series.coachId,
    playerId: series.playerId,
    start: start.toISOString(),
    durationMinutes: 60,
  };
}

/** Start of today (00:00:00). */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * First timestamp from which recurring instances are allowed.
 * When series.startDate is set, use start of that date; else when requestRange is provided
 * use that week start (or today if later); else today.
 */
function getFirstAllowedTime(
  series: RecurringSeries,
  requestRange?: { start: Date; end: Date }
): number {
  if (series.startDate) {
    const d = new Date(series.startDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  const today = startOfToday().getTime();
  if (!requestRange) return today;
  const rangeStart = requestRange.start.getTime();
  return Math.max(today, rangeStart);
}

/**
 * Expand one recurring series into lesson instances within the current and next calendar month.
 * Instances start from the displayed week when requestRange is provided (so if the coach views
 * week 22–28.3 and adds 3× Tuesday 10:00, the first instance is 24.3); otherwise from today.
 * - afterN: up to N instances from firstAllowed onward, within window.
 * - throughMonth: all instances in the chosen month(s) on or after firstAllowed.
 */
export function expandSeries(
  series: RecurringSeries,
  requestRange?: { start: Date; end: Date }
): Lesson[] {
  const { start: windowStart, end: windowEnd } =
    requestRange ? getExpansionWindow(requestRange.start, requestRange.end) : getWindowBounds();
  const firstAllowed = getFirstAllowedTime(series, requestRange);
  let first = firstOccurrenceInWindow(series.weekday, windowStart, windowEnd);
  if (!first) return [];

  const result: Lesson[] = [];

  if (series.endConditionType === "afterN") {
    const N = typeof series.endConditionValue === "number" ? series.endConditionValue : 0;
    let d = new Date(first);
    d.setHours(series.hour, 0, 0, 0);
    while (d.getTime() < firstAllowed && d.getTime() <= windowEnd.getTime()) {
      d = addWeek(d);
      d.setHours(series.hour, 0, 0, 0);
    }
    if (d.getTime() > windowEnd.getTime()) return result;
    for (let i = 0; i < N && d.getTime() <= windowEnd.getTime(); i++) {
      if (d.getTime() >= windowStart.getTime()) {
        const inst = instanceAt(series, d);
        if (inst) result.push(inst);
      }
      d = addWeek(d);
      d.setHours(series.hour, 0, 0, 0);
    }
    return result;
  }

  if (series.endConditionType === "throughMonth") {
    const cur = getCurrentMonthBounds();
    const next = getNextMonthBounds();
    const months: { start: Date; end: Date }[] =
      series.endConditionValue === "both"
        ? [cur, next]
        : series.endConditionValue === "next"
          ? [next]
          : [cur];
    for (const { start: monthStart, end: monthEnd } of months) {
      const firstInMonth = firstOccurrenceInWindow(series.weekday, monthStart, monthEnd);
      if (!firstInMonth) continue;
      let d = new Date(firstInMonth);
      d.setHours(series.hour, 0, 0, 0);
      while (d.getTime() <= monthEnd.getTime()) {
        const inst = instanceAt(series, d);
        if (inst && new Date(inst.start).getTime() >= firstAllowed) result.push(inst);
        d = addWeek(d);
        d.setHours(series.hour, 0, 0, 0);
      }
    }
    return result;
  }

  return result;
}
