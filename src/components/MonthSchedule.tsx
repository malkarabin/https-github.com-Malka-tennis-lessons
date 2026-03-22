"use client";

import { useEffect, useMemo, useState } from "react";
import { getMonthBounds, getCalendarWeekStart, isMonthInAllowedRange } from "@/lib/calendar";

type Lesson = {
  id: string;
  coachId: string;
  playerId: string;
  start: string;
  durationMinutes: number;
};

const DAY_LABELS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"]; // Sun–Sat short

function getWeeksInMonth(year: number, month: number): Date[][] {
  const { start } = getMonthBounds(year, month);
  const firstWeekStart = getCalendarWeekStart(start);
  const weeks: Date[][] = [];
  let rowStart = new Date(firstWeekStart);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  while (rowStart.getTime() <= end.getTime() || weeks.length < 5) {
    const row: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(rowStart);
      d.setDate(rowStart.getDate() + i);
      row.push(d);
    }
    weeks.push(row);
    rowStart.setDate(rowStart.getDate() + 7);
    if (weeks.length >= 6) break;
  }
  return weeks;
}

function isInViewedMonth(d: Date, year: number, month: number): boolean {
  return d.getFullYear() === year && d.getMonth() === month;
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return hex;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isDark(hex: string): boolean {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return false;
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return y < 0.5;
}

export default function MonthSchedule({
  coachId,
  players,
  scheduleRefreshKey,
}: {
  coachId: string;
  players: { id: string; name: string; color?: string }[];
  scheduleRefreshKey?: number;
}) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => getMonthBounds(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  useEffect(() => {
    const start = rangeStart.toISOString();
    const end = rangeEnd.toISOString();
    fetch(`/api/lessons?coachId=${coachId}&start=${start}&end=${end}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data) => setLessons(Array.isArray(data) ? data : []));
  }, [coachId, rangeStart, rangeEnd, scheduleRefreshKey]);

  const visibleLessons = lessons.filter((l) =>
    players.some((p) => p.id === l.playerId)
  );

  const getLessonsForDay = (d: Date) => {
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);
    const startT = dayStart.getTime();
    const endT = dayEnd.getTime();
    return visibleLessons.filter((l) => {
      const t = new Date(l.start).getTime();
      return t >= startT && t <= endT;
    });
  };

  const canPrev = isMonthInAllowedRange(
    viewMonth === 0 ? viewYear - 1 : viewYear,
    viewMonth === 0 ? 11 : viewMonth - 1
  );
  const canNext = isMonthInAllowedRange(
    viewMonth === 11 ? viewYear + 1 : viewYear,
    viewMonth === 11 ? 0 : viewMonth + 1
  );

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };
  const goNext = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  };

  const goToToday = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("he-IL", {
    month: "long",
    year: "numeric",
  });
  const weeks = getWeeksInMonth(viewYear, viewMonth);

  const isToday = (d: Date) => {
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const getPlayerColor = (playerId: string) =>
    players.find((p) => p.id === playerId)?.color ?? "#bdbdbd";

  return (
    <div className="month-schedule">
      <div className="week-nav">
        <button
          type="button"
          className="btn btn-sm"
          disabled={!canPrev}
          onClick={goPrev}
        >
          חודש קודם
        </button>
        <strong className="week-label">{monthLabel}</strong>
        <button
          type="button"
          className="btn btn-sm"
          disabled={!canNext}
          onClick={goNext}
        >
          חודש הבא
        </button>
        <button type="button" className="btn btn-sm btn-today" onClick={goToToday}>
          היום
        </button>
      </div>
      <div className="month-grid-wrap">
        <table className="month-table">
          <thead>
            <tr>
              {DAY_LABELS.map((label, i) => (
                <th key={i}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((d, colIdx) => {
                  const inMonth = isInViewedMonth(d, viewYear, viewMonth);
                  const dayLessons = getLessonsForDay(d);
                  const dayKey = d.toISOString().slice(0, 10);
                  const isExpanded = expandedDay === dayKey && dayLessons.length > 3;
                  return (
                    <td
                      key={colIdx}
                      className={`month-day ${inMonth ? "month-day-in" : "month-day-out"} ${isToday(d) ? "month-day-today" : ""}`}
                      style={{ position: "relative" }}
                      onMouseEnter={() => { if (inMonth && dayLessons.length > 3) setExpandedDay(dayKey); }}
                      onMouseLeave={() => setExpandedDay(null)}
                    >
                      <span className="month-day-num">{d.getDate()}</span>
                      {inMonth && dayLessons.length > 0 && (
                        <ul className="month-day-lessons">
                          {dayLessons.slice(0, 3).map((l) => {
                            const name =
                              players.find((p) => p.id === l.playerId)?.name ??
                              l.playerId.slice(0, 6);
                            const hour = new Date(l.start).getHours();
                            const playerColor = getPlayerColor(l.playerId);
                            return (
                              <li
                                key={l.id}
                                className="month-lesson-item"
                                style={{
                                  backgroundColor: hexToRgba(playerColor, 0.5),
                                  color: isDark(playerColor) ? "#fff" : "#1a1a1a",
                                }}
                              >
                                {name} {hour}:00
                              </li>
                            );
                          })}
                          {dayLessons.length > 3 && (
                            <li className="month-lesson-more">
                              +{dayLessons.length - 3}
                            </li>
                          )}
                        </ul>
                      )}
                      {isExpanded && (
                        <div className="month-day-expand">
                          <strong className="month-day-expand-title">{d.getDate()} — כל השיעורים</strong>
                          <ul className="month-day-expand-list">
                            {dayLessons.map((l) => {
                              const name = players.find((p) => p.id === l.playerId)?.name ?? l.playerId.slice(0, 6);
                              const hour = new Date(l.start).getHours();
                              const playerColor = getPlayerColor(l.playerId);
                              return (
                                <li
                                  key={l.id}
                                  className="month-lesson-item"
                                  style={{
                                    backgroundColor: hexToRgba(playerColor, 0.5),
                                    color: isDark(playerColor) ? "#fff" : "#1a1a1a",
                                  }}
                                >
                                  {name} {hour}:00
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
