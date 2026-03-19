/**
 * Tests for coach-scoped players and lesson booking window.
 * Uses in-memory-like behavior; we test the logic by mocking or using a temp dir.
 * Since store uses fs, we test the calendar window logic and the public API contract.
 */
import { isWithinBookingWindow, getCurrentMonthBounds, getNextMonthBounds } from "../calendar";

describe("booking window", () => {
  it("rejects lesson date outside current and next calendar month", () => {
    const now = new Date();
    const twoMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 2, 15, 10, 0, 0, 0);
    expect(isWithinBookingWindow(twoMonthsAhead)).toBe(false);
  });

  it("accepts lesson date in current month", () => {
    const { start, end } = getCurrentMonthBounds();
    const mid = new Date((start.getTime() + end.getTime()) / 2);
    expect(isWithinBookingWindow(mid)).toBe(true);
  });

  it("accepts lesson date in next month", () => {
    const { start } = getNextMonthBounds();
    const midMonth = new Date(start.getFullYear(), start.getMonth(), 15, 12, 0, 0, 0);
    expect(isWithinBookingWindow(midMonth)).toBe(true);
  });
});

describe("calendar month bounds", () => {
  it("current month end is last day of current month", () => {
    const now = new Date();
    const { end } = getCurrentMonthBounds();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    expect(end.getDate()).toBe(lastDay.getDate());
    expect(end.getMonth()).toBe(now.getMonth());
  });

  it("next month is adjacent calendar month", () => {
    const now = new Date();
    const { start: nextStart } = getNextMonthBounds();
    expect(nextStart.getMonth()).toBe((now.getMonth() + 1) % 12);
  });
});
