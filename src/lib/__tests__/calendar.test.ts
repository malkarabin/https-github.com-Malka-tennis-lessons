import {
  getCalendarWeekStart,
  getCalendarWeekEnd,
  getCurrentMonthBounds,
  getNextMonthBounds,
  isWithinBookingWindow,
  getDaysInCalendarWeek,
  isWeekInAllowedRange,
  addWeeks,
} from "../calendar";

describe("calendar", () => {
  describe("getCalendarWeekStart", () => {
    it("returns Sunday 00:00 for a date in the week", () => {
      const wed = new Date(2025, 2, 12, 14, 30);
      const start = getCalendarWeekStart(wed);
      expect(start.getDay()).toBe(0);
      expect(start.getDate()).toBe(9);
      expect(start.getMonth()).toBe(2);
      expect(start.getFullYear()).toBe(2025);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
    });
  });

  describe("getCalendarWeekEnd", () => {
    it("returns Saturday 23:59:59 of the same week", () => {
      const wed = new Date(2025, 2, 12);
      const end = getCalendarWeekEnd(wed);
      expect(end.getDay()).toBe(6);
      expect(end.getDate()).toBe(15);
      expect(end.getHours()).toBe(23);
      expect(end.getSeconds()).toBe(59);
    });
  });

  describe("getCurrentMonthBounds / getNextMonthBounds", () => {
    it("current month has start on 1st and end on last day", () => {
      const { start, end } = getCurrentMonthBounds();
      expect(start.getDate()).toBe(1);
      expect(end.getDate()).toBeGreaterThanOrEqual(28);
    });

    it("next month is the following calendar month", () => {
      const now = new Date();
      const { start: nextStart } = getNextMonthBounds();
      expect(nextStart.getMonth()).toBe((now.getMonth() + 1) % 12);
    });
  });

  describe("isWithinBookingWindow", () => {
    it("returns true for a date in current month", () => {
      const now = new Date();
      const inCurrent = new Date(now.getFullYear(), now.getMonth(), 15, 12, 0, 0, 0);
      expect(isWithinBookingWindow(inCurrent)).toBe(true);
    });

    it("returns true for a date in next month", () => {
      const now = new Date();
      const inNext = new Date(now.getFullYear(), now.getMonth() + 1, 10, 12, 0, 0, 0);
      expect(isWithinBookingWindow(inNext)).toBe(true);
    });

    it("returns false for a date two months ahead", () => {
      const now = new Date();
      const twoMonths = new Date(now.getFullYear(), now.getMonth() + 2, 1, 12, 0, 0, 0);
      expect(isWithinBookingWindow(twoMonths)).toBe(false);
    });
  });

  describe("getDaysInCalendarWeek", () => {
    it("returns 7 days starting with Sunday", () => {
      const sun = new Date(2025, 2, 9, 0, 0, 0, 0);
      const days = getDaysInCalendarWeek(sun);
      expect(days.length).toBe(7);
      expect(days[0].getDay()).toBe(0);
      expect(days[6].getDay()).toBe(6);
    });
  });

  describe("isWeekInAllowedRange", () => {
    it("returns true for a week that overlaps current or next month", () => {
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), 1);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      expect(isWeekInAllowedRange(weekStart)).toBe(true);
    });
  });

  describe("addWeeks", () => {
    it("adds 7 days per week", () => {
      const d = new Date(2025, 2, 9);
      const plus2 = addWeeks(d, 2);
      expect(plus2.getDate()).toBe(23);
    });
  });
});
