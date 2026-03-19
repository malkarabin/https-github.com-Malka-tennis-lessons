"use client";

import { useEffect, useMemo, useState } from "react";

type Lesson = {
  id: string;
  coachId: string;
  playerId: string;
  start: string;
  durationMinutes: number;
};

const HOURS = 7;
const SLOT_MINUTES = 60;

function weekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addWeeks(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n * 7);
  return out;
}

function getCurrentMonthEnd(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}

function getNextMonthEnd(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999);
}

function isWeekInRange(weekStartDate: Date): boolean {
  const weekEnd = new Date(weekStartDate);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  const curEnd = getCurrentMonthEnd().getTime();
  const nextEnd = getNextMonthEnd().getTime();
  const startT = weekStartDate.getTime();
  const endT = weekEnd.getTime();
  return (endT >= getCurrentMonthBounds().start.getTime() && startT <= curEnd) ||
    (startT <= nextEnd && endT >= getNextMonthBounds().start.getTime());
}

function getCurrentMonthBounds(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
    end: getCurrentMonthEnd(),
  };
}

function getNextMonthBounds(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0),
    end: getNextMonthEnd(),
  };
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isDark(hex: string): boolean {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return false;
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return y < 0.5;
}

/** Hex to rgba with alpha for softer slot backgrounds */
function hexToRgba(hex: string, alpha: number): string {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return hex;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function WeeklySchedule({
  coachId,
  playerId,
  players,
  canAddLesson,
  scheduleRefreshKey,
}: {
  coachId: string;
  playerId?: string;
  players: { id: string; name: string; color?: string }[];
  canAddLesson: boolean;
  scheduleRefreshKey?: number;
}) {
  const [weekStartDate, setWeekStartDate] = useState(() => weekStart(new Date()));
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [adding, setAdding] = useState<{
    dayIndex: number;
    hour: number;
  } | null>(null);
  const [addPlayerId, setAddPlayerId] = useState("");
  const [addLessonError, setAddLessonError] = useState<string | null>(null);

  const rangeStart = useMemo(() => {
    const d = new Date(weekStartDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [weekStartDate]);
  const rangeEnd = useMemo(() => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [weekStartDate]);

  useEffect(() => {
    const start = rangeStart.toISOString();
    const end = rangeEnd.toISOString();
    fetch(`/api/lessons?coachId=${coachId}&start=${start}&end=${end}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data) => setLessons(Array.isArray(data) ? data : []));
  }, [coachId, rangeStart, rangeEnd, scheduleRefreshKey]);

  const canPrev = isWeekInRange(addWeeks(weekStartDate, -1));
  const canNext = isWeekInRange(addWeeks(weekStartDate, 1));

  // Only show lessons for players that still exist (avoids orphan slots if player was deleted before cascade ran)
  const visibleLessons = lessons.filter((l) => players.some((p) => p.id === l.playerId));

  const createLesson = () => {
    if (!adding || !addPlayerId) return;
    setAddLessonError(null);
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + adding.dayIndex);
    d.setHours(adding.hour, 0, 0, 0);
    const start = d.toISOString();
    fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: `l-${Date.now()}`,
        coachId,
        playerId: addPlayerId,
        start,
        durationMinutes: 60,
      }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setAddLessonError(data?.error || "שגיאה בקביעת שיעור");
          return;
        }
        setAdding(null);
        setAddPlayerId("");
        fetch(
          `/api/lessons?coachId=${coachId}&start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}`,
          { cache: "no-store" }
        )
          .then((res) => res.json())
          .then((arr) => setLessons(Array.isArray(arr) ? arr : []));
      })
      .catch(() => setAddLessonError("שגיאת רשת"));
  };

  const weekLabel = () => {
    const end = new Date(weekStartDate);
    end.setDate(end.getDate() + 6);
    return `${weekStartDate.toLocaleDateString("he-IL", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" })}`;
  };

  const getLessonAt = (dayIndex: number, hour: number) => {
    const slotStart = new Date(weekStartDate);
    slotStart.setDate(slotStart.getDate() + dayIndex);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + SLOT_MINUTES);
    const startT = slotStart.getTime();
    const endT = slotEnd.getTime();
    return visibleLessons.find((l) => {
      const lStart = new Date(l.start).getTime();
      const dur = (l.durationMinutes ?? 60) * 60 * 1000;
      return lStart < endT && lStart + dur > startT;
    });
  };

  const getPlayerColor = (playerId: string) => {
    const p = players.find((x) => x.id === playerId);
    return p?.color ?? "#bdbdbd";
  };

  const goToToday = () => setWeekStartDate(weekStart(new Date()));

  /** Slot is bookable only from the next full hour through 20:00 (inclusive). */
  const isSlotBookable = (dayIndex: number, hour: number) => {
    if (hour < 7 || hour > 20) return false;
    const now = new Date();
    const nextFullHour = new Date(now);
    nextFullHour.setMinutes(0, 0, 0);
    nextFullHour.setSeconds(0, 0);
    nextFullHour.setMilliseconds(0);
    if (now.getMinutes() > 0 || now.getSeconds() > 0 || now.getMilliseconds() > 0) {
      nextFullHour.setHours(nextFullHour.getHours() + 1);
    }
    const slotStart = new Date(weekStartDate);
    slotStart.setDate(slotStart.getDate() + dayIndex);
    slotStart.setHours(hour, 0, 0, 0);
    return slotStart.getTime() >= nextFullHour.getTime();
  };

  const isToday = (dayIndex: number) => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + dayIndex);
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };

  return (
    <div>
      <div className="week-nav">
        <button type="button" className="btn btn-sm" disabled={!canPrev} onClick={() => setWeekStartDate(addWeeks(weekStartDate, -1))}>
          שבוע קודם
        </button>
        <strong className="week-label">{weekLabel()}</strong>
        <button type="button" className="btn btn-sm" disabled={!canNext} onClick={() => setWeekStartDate(addWeeks(weekStartDate, 1))}>
          שבוע הבא
        </button>
        <button type="button" className="btn btn-sm btn-today" onClick={goToToday}>
          היום
        </button>
      </div>
      <p className="schedule-hint">תצוגת שבוע (ראשון–שבת)</p>
      <div className="schedule-table-wrap">
      <table className="schedule-table">
        <thead>
          <tr>
            <th>שעה</th>
            {DAY_LABELS.map((label, i) => {
              const d = new Date(weekStartDate);
              d.setDate(d.getDate() + i);
              return (
                <th key={i} className={isToday(i) ? "schedule-th-today" : ""}>
                  {label}
                  <br />
                  <span className="schedule-date">{d.toLocaleDateString("he-IL", { day: "numeric", month: "short" })}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 14 }, (_, hour) => hour + 7).map((hour) => (
            <tr key={hour}>
              <td className="schedule-time">{hour}:00</td>
              {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                const lesson = getLessonAt(dayIndex, hour);
                const isAdding = adding?.dayIndex === dayIndex && adding?.hour === hour;
                const playerColor = lesson ? getPlayerColor(lesson.playerId) : undefined;
                const playerName = lesson ? players.find((p) => p.id === lesson.playerId)?.name ?? lesson.playerId : null;
                return (
                  <td
                    key={dayIndex}
                    className={`schedule-slot ${isToday(dayIndex) ? "schedule-slot-today" : ""} ${lesson ? "schedule-slot-filled" : ""} ${canAddLesson && !lesson && !isSlotBookable(dayIndex, hour) ? "schedule-slot-unavailable-cell" : ""}`}
                    style={{
                      backgroundColor: lesson && playerColor ? hexToRgba(playerColor, 0.55) : undefined,
                      color: playerColor ? (isDark(playerColor) ? "#2c2c2c" : "#1a1a1a") : undefined,
                    }}
                  >
                    {lesson ? (
                      <span title="1h" style={{ display: "block", minHeight: "1.5em" }}>
                        {playerName ?? lesson.playerId.slice(0, 8)}
                      </span>
                    ) : canAddLesson && !isAdding && isSlotBookable(dayIndex, hour) ? (
                      <button type="button" className="schedule-slot-add" onClick={() => { setAddLessonError(null); setAdding({ dayIndex, hour }); }}>+</button>
                    ) : canAddLesson && !isAdding && !lesson ? (
                      <span className="schedule-slot-unavailable" title="לא זמין לקביעה — מהשעה העגולה הבאה עד 20:00">לא זמין</span>
                    ) : null}
                    {isAdding && (
                      <div className="schedule-add">
                        {addLessonError && <p className="form-error">{addLessonError}</p>}
                        <select
                          value={addPlayerId}
                          onChange={(e) => setAddPlayerId(e.target.value)}
                          size={1}
                        >
                          <option value="">שחקן...</option>
                          {players.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <button type="button" className="btn btn-sm btn-primary" onClick={createLesson}>הוסף (שעה)</button>
                        <button type="button" className="btn btn-sm" onClick={() => setAdding(null)}>ביטול</button>
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
