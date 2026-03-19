/**
 * Calendar rules: week = Sunday–Saturday, month = calendar month.
 * Bookable range = current calendar month + next calendar month.
 */

export function getCalendarWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getCalendarWeekEnd(date: Date): Date {
  const start = getCalendarWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getCurrentMonthBounds(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function getNextMonthBounds(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999);
  return { start, end };
}

export function isWithinBookingWindow(date: Date): boolean {
  const { start: curStart, end: curEnd } = getCurrentMonthBounds();
  const { start: nextStart, end: nextEnd } = getNextMonthBounds();
  const t = date.getTime();
  return (t >= curStart.getTime() && t <= curEnd.getTime()) ||
    (t >= nextStart.getTime() && t <= nextEnd.getTime());
}

export function getDaysInCalendarWeek(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(d);
  }
  return days;
}

export function isWeekInAllowedRange(weekStart: Date): boolean {
  const weekEnd = getCalendarWeekEnd(weekStart);
  const { end: curEnd } = getCurrentMonthBounds();
  const { end: nextEnd } = getNextMonthBounds();
  const t = weekStart.getTime();
  const endT = weekEnd.getTime();
  return (t <= curEnd.getTime() && endT >= getCurrentMonthBounds().start.getTime()) ||
    (t <= nextEnd.getTime() && endT >= getNextMonthBounds().start.getTime());
}

export function addWeeks(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

/** Bounds for a given calendar month (1st 00:00 through last day 23:59). */
export function getMonthBounds(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/** True if (year, month) is the current or next calendar month. */
export function isMonthInAllowedRange(year: number, month: number): boolean {
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth();
  if (year === curY && month === curM) return true;
  const nextM = curM === 11 ? 0 : curM + 1;
  const nextY = curM === 11 ? curY + 1 : curY;
  return year === nextY && month === nextM;
}

/**
 * Expansion window for recurring: current + next month, extended to include
 * the full month(s) that [requestStart, requestEnd] falls in.
 * Fixes the case where "current week" spans two months (e.g. end of April + start of May).
 */
export function getExpansionWindow(requestStart: Date, requestEnd: Date): { start: Date; end: Date } {
  const cur = getCurrentMonthBounds();
  const next = getNextMonthBounds();
  const reqStartMonth = new Date(requestStart.getFullYear(), requestStart.getMonth(), 1, 0, 0, 0, 0);
  const reqEndMonth = new Date(requestEnd.getFullYear(), requestEnd.getMonth() + 1, 0, 23, 59, 59, 999);
  return {
    start: new Date(Math.min(cur.start.getTime(), reqStartMonth.getTime())),
    end: new Date(Math.max(next.end.getTime(), reqEndMonth.getTime())),
  };
}
