"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import WeeklySchedule from "@/components/WeeklySchedule";
import MonthSchedule from "@/components/MonthSchedule";

type RecurringSeries = {
  id: string;
  coachId: string;
  playerId: string;
  weekday: number;
  hour: number;
  endConditionType: "afterN" | "throughMonth";
  endConditionValue: number | "current" | "next" | "both";
  startDate?: string;
  createdAt?: string;
};

const WEEKDAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const RECURRING_PAGE_SIZE = 4;

function formatDateDdMmYy(isoDate: string | undefined): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = String(date.getFullYear()).slice(-2);
  return `${d}/${m}/${y}`;
}

function ymdToDdMmYy(ymd: string): string {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y.slice(-2)}`;
}

function ddMmYyToYmd(text: string): string | null {
  const match = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!match) return null;
  const d = match[1].padStart(2, "0");
  const m = match[2].padStart(2, "0");
  const y = match[3].length === 2 ? `20${match[3]}` : match[3];
  const date = new Date(`${y}-${m}-${d}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return `${y}-${m}-${d}`;
}

export default function PlayerSchedulePage() {
  const [coachId, setCoachId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<{ id: string; name: string; color?: string }[]>([]);
  const [recurring, setRecurring] = useState<RecurringSeries[]>([]);
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<"week" | "month" | "recurring">("week");
  const [newRecurring, setNewRecurring] = useState({
    weekday: 3,
    hour: 10,
    startDate: "" as string,
    endConditionType: "afterN" as "afterN" | "throughMonth",
    endConditionValue: 4 as number | "current" | "next" | "both",
  });
  const [recurringError, setRecurringError] = useState<string | null>(null);
  const [recurringShowCount, setRecurringShowCount] = useState(RECURRING_PAGE_SIZE);
  const [coachName, setCoachName] = useState("");
  const [dateText, setDateText] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("view") === "recurring") setViewMode("recurring");
  }, [searchParams]);

  useEffect(() => {
    if (sessionStorage.getItem("scheduleNeedsRefresh") === "1") {
      sessionStorage.removeItem("scheduleNeedsRefresh");
      setScheduleRefreshKey((k) => k + 1);
    }
  }, []);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem("session") : null;
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      if (s.role !== "player") return;
      setCoachId(s.coachId);
      setPlayerId(s.playerId);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const d = String(tomorrow.getDate()).padStart(2, "0");
    const ymd = `${y}-${m}-${d}`;
    setNewRecurring((prev) => ({
      ...prev,
      weekday: (new Date().getDay() + 1) % 7,
      startDate: ymd,
    }));
    setDateText(ymdToDdMmYy(ymd));
  }, []);

  useEffect(() => {
    if (!coachId) return;
    fetch(`/api/players?coachId=${coachId}`)
      .then((r) => r.json())
      .then(setPlayers);
  }, [coachId]);

  useEffect(() => {
    if (!coachId) return;
    fetch("/api/coaches")
      .then((r) => r.json())
      .then((list: { id: string; name: string }[]) => {
        const c = list.find((x) => x.id === coachId);
        setCoachName(c?.name ?? coachId);
      });
  }, [coachId]);

  useEffect(() => {
    if (!coachId) return;
    fetch(`/api/recurring?coachId=${coachId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setRecurring(Array.isArray(data) ? data : []));
  }, [coachId, scheduleRefreshKey]);

  const addRecurring = () => {
    setRecurringError(null);
    if (!coachId || !playerId) return;
    const startDateTrimmed = newRecurring.startDate?.trim();
    if (startDateTrimmed) {
      const d = new Date(startDateTrimmed);
      if (Number.isNaN(d.getTime())) {
        setRecurringError("תאריך התחלה לא תקין");
        return;
      }
      if (d.getDay() !== newRecurring.weekday) {
        setRecurringError(`תאריך ההתחלה לא תואם ליום שנבחר. נא לבחור תאריך שהוא יום ${WEEKDAY_NAMES[newRecurring.weekday]}.`);
        return;
      }
    }
    const id = `rec-${Date.now()}`;
    const body: RecurringSeries = {
      id,
      coachId,
      playerId,
      weekday: newRecurring.weekday,
      hour: newRecurring.hour,
      endConditionType: newRecurring.endConditionType,
      endConditionValue: newRecurring.endConditionValue,
    };
    if (startDateTrimmed) body.startDate = startDateTrimmed;
    fetch("/api/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setRecurringError(data?.error || "שגיאה בשמירת שיעור חוזר");
          return;
        }
        setRecurring((prev) => [...prev, data]);
        setScheduleRefreshKey((k) => k + 1);
      })
      .catch(() => setRecurringError("שגיאת רשת"));
  };

  const deleteRecurring = (id: string) => {
    fetch(`/api/recurring/${id}`, { method: "DELETE" }).then(() => {
      setRecurring((prev) => prev.filter((r) => r.id !== id));
      setScheduleRefreshKey((k) => k + 1);
    });
  };

  const myRecurring = recurring.filter((r) => r.playerId === playerId);
  const playerName = players.find((p) => p.id === playerId)?.name ?? playerId ?? "";

  if (!coachId) return <p>טוען...</p>;

  return (
    <div className="app-wrap">
      <nav className="nav">
        <span className="nav-title">{playerName} — המערכת של המאמן שלי: {coachName || "…"}</span>
        <div className="nav-links">
          <Link href="/player/ask">שיחה עם המאמן שלי</Link>
          <Link href="/">דף הבית</Link>
        </div>
      </nav>
      <h1 className="page-title">
        {viewMode === "week" ? "המערכת של המאמן — קביעת שיעור" : "המערכת של המאמן"}
      </h1>

      <div className="view-tabs">
        <button
          type="button"
          className={viewMode === "week" ? "active" : ""}
          onClick={() => setViewMode("week")}
        >
          שבועי
        </button>
        <button
          type="button"
          className={viewMode === "month" ? "active" : ""}
          onClick={() => setViewMode("month")}
        >
          חודשי
        </button>
        <button
          type="button"
          className={viewMode === "recurring" ? "active" : ""}
          onClick={() => setViewMode("recurring")}
        >
          שיעורים חוזרים
        </button>
      </div>

      <p className="page-sub page-sub-player">
        {viewMode === "month"
          ? <strong>תצוגת חודש — צפייה בלבד. תיאום שיעורים במבט השבועי.</strong>
          : null}
      </p>

      {viewMode === "recurring" && (
        <div className="recurring-card">
          <h2>קביעת שיעור חוזר</h2>
          <p className="recurring-desc">השיעורים החוזרים יתחילו מהתאריך הנבחר.</p>
          <div className="recurring-form-grid">
            <div className="recurring-form-group">
              <label>יום</label>
              <select
                value={newRecurring.weekday}
                onChange={(e) => {
                  const newWeekday = Number(e.target.value);
                  const currentDate = newRecurring.startDate
                    ? new Date(newRecurring.startDate + "T12:00:00")
                    : new Date();
                  const weekSun = new Date(currentDate);
                  weekSun.setDate(currentDate.getDate() - currentDate.getDay());
                  const targetDate = new Date(weekSun);
                  targetDate.setDate(weekSun.getDate() + newWeekday);
                  if (currentDate.getDay() === 6 && newWeekday === 0) {
                    targetDate.setDate(targetDate.getDate() + 7);
                  }
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(0, 0, 0, 0);
                  if (targetDate < tomorrow) {
                    targetDate.setDate(targetDate.getDate() + 7);
                  }
                  const y = targetDate.getFullYear();
                  const m = String(targetDate.getMonth() + 1).padStart(2, "0");
                  const d = String(targetDate.getDate()).padStart(2, "0");
                  const ymd = `${y}-${m}-${d}`;
                  setNewRecurring((p) => ({ ...p, weekday: newWeekday, startDate: ymd }));
                  setDateText(ymdToDdMmYy(ymd));
                }}
              >
                {WEEKDAY_NAMES.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
            </div>
            <div className="recurring-form-group">
              <label>שעה</label>
              <select
                value={newRecurring.hour}
                onChange={(e) => setNewRecurring((p) => ({ ...p, hour: Number(e.target.value) }))}
              >
                {Array.from({ length: 14 }, (_, i) => i + 7).map((h) => (
                  <option key={h} value={h}>{h}:00</option>
                ))}
              </select>
            </div>
            <div className="recurring-form-group">
              <label>מתאריך (dd/mm/yy)</label>
              <input
                type="text"
                placeholder="dd/mm/yy"
                value={dateText}
                onChange={(e) => {
                  const text = e.target.value;
                  setDateText(text);
                  const ymd = ddMmYyToYmd(text);
                  if (ymd) {
                    const parsed = new Date(ymd + "T12:00:00");
                    setNewRecurring((p) => ({ ...p, startDate: ymd, weekday: parsed.getDay() }));
                  }
                }}
                aria-label="תאריך התחלה"
                style={{ maxWidth: "8rem" }}
              />
            </div>
          </div>
          <div className="recurring-form-end">
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  checked={newRecurring.endConditionType === "afterN"}
                  onChange={() => setNewRecurring((p) => ({ ...p, endConditionType: "afterN", endConditionValue: 4 }))}
                />
                אחרי
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={newRecurring.endConditionType === "afterN" ? newRecurring.endConditionValue : 4}
                onChange={(e) => setNewRecurring((p) => ({ ...p, endConditionValue: Number(e.target.value) || 4 }))}
                disabled={newRecurring.endConditionType !== "afterN"}
              />
              <span>פעמים</span>
            </div>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  checked={newRecurring.endConditionType === "throughMonth"}
                  onChange={() => setNewRecurring((p) => ({ ...p, endConditionType: "throughMonth", endConditionValue: "both" }))}
                />
                עד סוף חודש
              </label>
              {newRecurring.endConditionType === "throughMonth" && (
                <select
                  value={String(newRecurring.endConditionValue)}
                  onChange={(e) => setNewRecurring((p) => ({ ...p, endConditionValue: e.target.value as "current" | "next" | "both" }))}
                >
                  <option value="both">נוכחי והבא</option>
                  <option value="current">נוכחי בלבד</option>
                  <option value="next">הבא בלבד</option>
                </select>
              )}
            </div>
            <button type="button" className="btn btn-primary" onClick={addRecurring}>
              הוסף שיעור חוזר
            </button>
          </div>
          {recurringError && <p className="form-error" role="alert">{recurringError}</p>}
          {myRecurring.length > 0 && (
            <>
              <p className="recurring-list-title">השיעורים החוזרים שלי</p>
              <ul className="recurring-list">
                {myRecurring.slice(0, recurringShowCount).map((r) => {
                  const endDesc = r.endConditionType === "afterN"
                    ? `${r.endConditionValue} פעמים`
                    : `עד סוף חודש ${r.endConditionValue === "both" ? "נוכחי והבא" : r.endConditionValue === "current" ? "נוכחי" : "הבא"}`;
                  const fromDateStr = r.startDate ? formatDateDdMmYy(r.startDate) : "";
                  return (
                    <li key={r.id} className="recurring-list-item">
                      <span className="recurring-item-info">
                        <span style={{ color: "var(--text-muted)" }}>
                          {WEEKDAY_NAMES[r.weekday]} {r.hour}:00
                          {fromDateStr ? ` מתאריך ${fromDateStr}` : ""} — {endDesc}
                        </span>
                      </span>
                      <button type="button" className="btn btn-sm" onClick={() => deleteRecurring(r.id)}>הסר</button>
                    </li>
                  );
                })}
              </ul>
              {myRecurring.length > recurringShowCount && (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ marginTop: "0.75rem" }}
                  onClick={() => setRecurringShowCount((c) => c + RECURRING_PAGE_SIZE)}
                >
                  הצג עוד {Math.min(RECURRING_PAGE_SIZE, myRecurring.length - recurringShowCount)}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {viewMode === "week" && (
        <WeeklySchedule
          coachId={coachId}
          playerId={playerId ?? undefined}
          players={players}
          canAddLesson={true}
          scheduleRefreshKey={scheduleRefreshKey}
        />
      )}
      {viewMode === "month" && (
        <MonthSchedule
          coachId={coachId}
          players={players}
          scheduleRefreshKey={scheduleRefreshKey}
        />
      )}
    </div>
  );
}
