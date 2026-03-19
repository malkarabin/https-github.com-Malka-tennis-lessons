"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import WeeklySchedule from "@/components/WeeklySchedule";
import MonthSchedule from "@/components/MonthSchedule";

type Player = { id: string; name: string; color?: string };
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

function formatDateDdMmYy(isoDate: string | undefined): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = String(date.getFullYear()).slice(-2);
  return `${d}/${m}/${y}`;
}

function parseDdMmYyToIso(s: string | undefined): string | null {
  if (!s?.trim()) return null;
  const parts = s.trim().split(/[/.-]/);
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const y = parseInt(parts[2], 10);
  const yFull = y < 100 ? 2000 + y : y;
  if (Number.isNaN(d) || Number.isNaN(m) || Number.isNaN(yFull)) return null;
  const date = new Date(yFull, m, d);
  if (date.getDate() !== d || date.getMonth() !== m) return null;
  return `${yFull}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CoachSchedulePage() {
  const [coachId, setCoachId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [recurring, setRecurring] = useState<RecurringSeries[]>([]);
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);
  const [newRecurring, setNewRecurring] = useState({
    playerId: "",
    weekday: 3,
    hour: 10,
    startDate: "" as string,
    endConditionType: "afterN" as "afterN" | "throughMonth",
    endConditionValue: 4 as number | "current" | "next" | "both",
  });
  const [viewMode, setViewMode] = useState<"week" | "month" | "recurring">("week");
  const [recurringError, setRecurringError] = useState<string | null>(null);
  const [recurringShowCount, setRecurringShowCount] = useState(4);
  const playerSelectRef = useRef<HTMLSelectElement>(null);
  const searchParams = useSearchParams();
  const RECURRING_PAGE_SIZE = 4;

  useEffect(() => {
    if (searchParams.get("view") === "month") setViewMode("month");
  }, [searchParams]);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const d = String(tomorrow.getDate()).padStart(2, "0");
    setNewRecurring((prev) => ({
      ...prev,
      weekday: (new Date().getDay() + 1) % 7,
      startDate: formatDateDdMmYy(`${y}-${m}-${d}`),
    }));
  }, []);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem("session") : null;
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      if (s.role !== "coach") return;
      setCoachId(s.coachId);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    if (!coachId) return;
    fetch(`/api/players?coachId=${coachId}`)
      .then((r) => r.json())
      .then(setPlayers);
  }, [coachId]);

  useEffect(() => {
    if (!coachId) return;
    fetch(`/api/recurring?coachId=${coachId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setRecurring(Array.isArray(data) ? data : []));
  }, [coachId, scheduleRefreshKey]);

  const addRecurring = () => {
    setRecurringError(null);
    if (!coachId) return;
    const selectedPlayerId = (playerSelectRef.current?.value ?? newRecurring.playerId)?.trim();
    if (!selectedPlayerId) {
      setRecurringError("נא לבחור שחקן");
      return;
    }
    const startDateIso = parseDdMmYyToIso(newRecurring.startDate);
    if (newRecurring.startDate?.trim() && !startDateIso) {
      setRecurringError("תאריך התחלה לא תקין. השתמשי בפורמט dd/mm/yy");
      return;
    }
    if (startDateIso) {
      const d = new Date(startDateIso);
      if (d.getDay() !== newRecurring.weekday) {
        setRecurringError(`תאריך ההתחלה לא תואם ליום שנבחר. נא לבחור תאריך שהוא יום ${WEEKDAY_NAMES[newRecurring.weekday]}.`);
        return;
      }
    }
    const id = `rec-${Date.now()}`;
    const body: RecurringSeries = {
      id,
      coachId,
      playerId: selectedPlayerId,
      weekday: newRecurring.weekday,
      hour: newRecurring.hour,
      endConditionType: newRecurring.endConditionType,
      endConditionValue: newRecurring.endConditionValue,
    };
    if (startDateIso) body.startDate = startDateIso;
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
        setNewRecurring((prev) => ({ ...prev, playerId: "" }));
        if (playerSelectRef.current) playerSelectRef.current.value = "";
      })
      .catch(() => setRecurringError("שגיאת רשת"));
  };

  const deleteRecurring = (id: string) => {
    fetch(`/api/recurring/${id}`, { method: "DELETE" }).then(() => {
      setRecurring((prev) => prev.filter((r) => r.id !== id));
      setScheduleRefreshKey((k) => k + 1);
    });
  };

  if (!coachId) return <p>טוען...</p>;

  return (
    <div className="app-wrap">
      <nav className="nav">
        <span className="nav-title">מערכת שיעורים</span>
        <div className="nav-links">
          <Link href="/">דף הבית</Link>
          <Link href="/coach">השחקנים שלי</Link>
        </div>
      </nav>
      <h1 className="page-title">מערכת שיעורים</h1>

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

      {viewMode === "recurring" && (
      <div className="recurring-card">
        <h2>שיעור חוזר</h2>
        <p className="recurring-desc">שיעור באותו יום ושעה כל שבוע — לחודש הנוכחי והבא. המופעים מתחילים מהשבוע המוצג בתצוגה השבועית (או מהיום).</p>
        <div className="recurring-form-grid">
          <div className="recurring-form-group">
            <label>שחקן</label>
            <select
              ref={playerSelectRef}
              value={newRecurring.playerId}
              onChange={(e) => setNewRecurring((p) => ({ ...p, playerId: e.target.value }))}
            >
              <option value="">בחר שחקן...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
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
            <label>מתאריך (dd/mm/yy)</label>
            <input
              type="text"
              placeholder="31/03/26"
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
        {recurringError && (
          <p className="form-error" role="alert">{recurringError}</p>
        )}
        {recurring.length > 0 && (
          <>
            <p className="recurring-list-title">השיעורים החוזרים שלי</p>
            <ul className="recurring-list">
              {recurring.slice(0, recurringShowCount).map((r) => {
                const playerName = players.find((p) => p.id === r.playerId)?.name ?? r.playerId;
                const endDesc = r.endConditionType === "afterN"
                  ? `${r.endConditionValue} פעמים`
                  : `עד סוף חודש ${r.endConditionValue === "both" ? "נוכחי והבא" : r.endConditionValue === "current" ? "נוכחי" : "הבא"}`;
                const fromDateStr = r.startDate ? formatDateDdMmYy(r.startDate) : "";
                return (
                  <li key={r.id} className="recurring-list-item">
                    <span className="recurring-item-info">
                      <span className="player-chip">
                        <span className="player-dot" style={{ background: players.find((p) => p.id === r.playerId)?.color ?? "#bdbdbd" }} />
                        {playerName}
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>
                        {WEEKDAY_NAMES[r.weekday]} {r.hour}:00
                        {fromDateStr ? ` מתאריך ${fromDateStr}` : ""} — {endDesc}
                      </span>
                    </span>
                    <button type="button" className="btn btn-sm" onClick={() => deleteRecurring(r.id)}>
                      הסר
                    </button>
                  </li>
                );
              })}
            </ul>
            {recurring.length > recurringShowCount && (
              <button
                type="button"
                className="btn btn-sm"
                style={{ marginTop: "0.75rem" }}
                onClick={() => setRecurringShowCount((c) => c + RECURRING_PAGE_SIZE)}
              >
                הצג עוד {Math.min(RECURRING_PAGE_SIZE, recurring.length - recurringShowCount)}
              </button>
            )}
          </>
        )}
      </div>
      )}

      {viewMode === "week" && (
        <WeeklySchedule
          coachId={coachId}
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
