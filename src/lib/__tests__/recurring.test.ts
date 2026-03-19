import { expandSeries } from "../recurring";
import type { RecurringSeries } from "../types";

describe("expandSeries", () => {
  const base: RecurringSeries = {
    id: "r1",
    coachId: "c1",
    playerId: "p1",
    weekday: 3, // Wednesday
    hour: 10,
    endConditionType: "afterN",
    endConditionValue: 4,
  };

  it("returns up to N instances for afterN", () => {
    const lessons = expandSeries(base);
    expect(lessons.length).toBeLessThanOrEqual(4);
    expect(lessons.every((l) => l.coachId === "c1" && l.playerId === "p1" && l.durationMinutes === 60)).toBe(true);
    const starts = lessons.map((l) => new Date(l.start).getTime());
    const unique = new Set(starts);
    expect(unique.size).toBe(lessons.length);
  });

  it("throughMonth current returns instances in current month only", () => {
    const series: RecurringSeries = { ...base, endConditionType: "throughMonth", endConditionValue: "current" };
    const lessons = expandSeries(series);
    const now = new Date();
    const curEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const curStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    for (const l of lessons) {
      const t = new Date(l.start).getTime();
      expect(t >= curStart.getTime() && t <= curEnd.getTime()).toBe(true);
    }
  });

  it("throughMonth next returns instances in next month only", () => {
    const series: RecurringSeries = { ...base, endConditionType: "throughMonth", endConditionValue: "next" };
    const lessons = expandSeries(series);
    const now = new Date();
    const nextStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    const nextEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999);
    for (const l of lessons) {
      const t = new Date(l.start).getTime();
      expect(t >= nextStart.getTime() && t <= nextEnd.getTime()).toBe(true);
    }
  });

  it("each instance is on the same weekday and hour", () => {
    const lessons = expandSeries(base);
    for (const l of lessons) {
      const d = new Date(l.start);
      expect(d.getDay()).toBe(3);
      expect(d.getHours()).toBe(10);
    }
  });
});
