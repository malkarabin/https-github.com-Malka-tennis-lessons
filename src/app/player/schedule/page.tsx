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
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("view") === "recurring") setViewMode("recurring");
  }, [searchParams]);

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
    setNewRecurring((prev) => ({
      ...prev,
      weekday: (new Date().getDay() + 1) % 7,
      startDate: `${y}-${m}-${d}`,
    }));
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
        <span className="nav-title">{playerName} — המערכת של המאמן שלי ({coachName || "…"})</span>
        <div className="nav-links">
          <Link href="/player/ask">שאלה למאמן</Link>
          <Link href="/">דף הבית</Link>
        </div>
      </nav>
      <h1 className="page-title">המערכת של המאמן</h1>

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
        {playerName && coachName ? `${playerName} — המאמן: ${coachName}. ` : ""}
        {viewMode === "week"
          ? "תצוגת שבוע (ראשון–שבת). לחיצה על תא תפוס מציגה את שם השחקן."
          : viewMode === "month"
            ? "תצוגת חודש — צפייה בלבד."
            : "קביעת שיעורים חוזרים אצל המאמן שלי."}
      </p>

      {viewMode === "recurring" && (
        <div className="recurring-card">
          <h2>שיעור חוזר</h2>
          <p className="recurring-desc">קבעי שיעור באותו יום ושעה כל שבוע. המופעים מתחילים מהתאריך שבחרת או מהשבוע המוצג.</p>
          <div className="recurring-form-grid">
            <div className="recurring-form-group">
              <label>יום</label>
              <select
                value={newRecurring.weekday}
                onChange={(e) => setNewRecurring((p) => ({ ...p, weekday: Number(e.target.value) }))}
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
              <label>מתאריך (פורמט: dd/mm/yy)</label>
              <input
                type="date"
                value={newRecurring.startDate}
                onChange={(e) => setNewRecurring((p) => ({ ...p, startDate: e.target.value }))}
                aria-label="תאריך התחלה"
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
