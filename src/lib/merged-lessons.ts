/**
 * Merged lessons (one-off + expanded recurring) for conflict checks and schedule.
 */

import type { Lesson } from "./types";
import { listLessonsByCoach, listRecurringByCoach } from "./store";
import { expandSeries } from "./recurring";

/** Merged one-off + expanded recurring for a coach in [start, end]. Optionally exclude one recurring series (for conflict check before adding it). */
export function getMergedLessons(
  coachId: string,
  start: Date,
  end: Date,
  excludeRecurringId?: string
): Lesson[] {
  const oneOff = listLessonsByCoach(coachId, start, end);
  const seriesList = listRecurringByCoach(coachId).filter(
    (s) => !excludeRecurringId || s.id !== excludeRecurringId
  );
  const expanded = seriesList.flatMap((s) => expandSeries(s, { start, end }));
  const startT = start.getTime();
  const endT = end.getTime();
  const inRange = expanded.filter((l) => {
    const t = new Date(l.start).getTime();
    return t >= startT && t <= endT;
  });
  const seen = new Set<string>();
  const merged: Lesson[] = [];
  for (const l of oneOff) {
    const key = `${l.coachId}:${l.playerId}:${l.start}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(l);
    }
  }
  for (const l of inRange) {
    const key = `${l.coachId}:${l.playerId}:${l.start}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(l);
    }
  }
  merged.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return merged;
}
