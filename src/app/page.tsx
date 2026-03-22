"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Coach = { id: string; name: string };
type Player = { id: string; coachId: string; name: string };

function slugFromName(name: string): string {
  const base = name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0590-\u05ff\-]/gi, "")
    .toLowerCase() || "coach";
  return `${base}-${Date.now().toString(36)}`;
}

export default function HomePage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [newCoachName, setNewCoachName] = useState("");
  const [addCoachError, setAddCoachError] = useState<string | null>(null);
  const [addCoachSuccess, setAddCoachSuccess] = useState(false);
  const [session, setSession] = useState<{
    role: "coach";
    coachId: string;
  } | { role: "player"; playerId: string; coachId: string } | null>(null);

  const loadCoaches = () => {
    fetch("/api/coaches")
      .then((r) => r.json())
      .then(setCoaches);
  };

  useEffect(() => {
    loadCoaches();
  }, []);

  useEffect(() => {
    if (coaches.length === 0) return;
    Promise.all(
      coaches.map((c) =>
        fetch(`/api/players?coachId=${c.id}`).then((r) => r.json())
      )
    ).then((arr) => setPlayers(arr.flat()));
  }, [coaches]);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem("session") : null;
    if (raw) {
      try {
        setSession(JSON.parse(raw));
      } catch {
        sessionStorage.removeItem("session");
      }
    }
  }, []);

  const addCoach = (e: React.FormEvent) => {
    e.preventDefault();
    setAddCoachError(null);
    setAddCoachSuccess(false);
    const name = newCoachName.trim();
    if (!name) {
      setAddCoachError("נא להזין שם מאמן");
      return;
    }
    const id = slugFromName(name);
    fetch("/api/coaches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setAddCoachError(data?.error || "שגיאה בהוספת מאמן");
          return;
        }
        setNewCoachName("");
        setAddCoachSuccess(true);
        loadCoaches();
      })
      .catch(() => setAddCoachError("שגיאת רשת"));
  };

  const signInAsCoach = (coachId: string) => {
    const s = { role: "coach" as const, coachId };
    setSession(s);
    sessionStorage.setItem("session", JSON.stringify(s));
  };

  const signInAsPlayer = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return;
    const s = { role: "player" as const, playerId, coachId: player.coachId };
    setSession(s);
    sessionStorage.setItem("session", JSON.stringify(s));
  };

  const signOut = () => {
    setSession(null);
    sessionStorage.removeItem("session");
  };

  if (session) {
    const coachName = coaches.find((c) => c.id === session.coachId)?.name ?? session.coachId;
    const playerName = session.role === "player" ? players.find((p) => p.id === session.playerId)?.name ?? session.playerId : null;
    return (
      <div className="app-wrap">
        <nav className="nav">
          <span className="nav-title">
            {session.role === "coach" ? "מאמן" : "שחקן"} — {session.role === "player" ? `${playerName} · מאמן: ${coachName}` : coachName}
          </span>
          <div className="nav-links">
            {session.role === "coach" && (
              <>
                <Link href="/coach">השחקנים שלי</Link>
                <Link href="/coach/schedule">מערכת שבועית</Link>
                <Link href="/coach/schedule?view=month">מערכת חודשית</Link>
              </>
            )}
            {session.role === "player" && (
              <>
                <Link href="/player/schedule">המערכת של המאמן</Link>
                <Link href="/player/schedule?view=recurring">שיעורים חוזרים</Link>
                <Link href="/player/ask">שאלה למאמן</Link>
              </>
            )}
            <button type="button" className="btn btn-sm" onClick={signOut}>
              התנתק
            </button>
          </div>
        </nav>
        <p className="page-sub page-sub-player">
          {session.role === "player" && `${playerName} — המאמן שלך: ${coachName}`}
        </p>
      </div>
    );
  }

  return (
    <div className="landing">
      <div className="landing-wrap landing-wrap-with-illustration">
        <div className="landing-illustration landing-coaches-scatter" aria-hidden>
          <Image src="/coach-player-tennis.png" alt="" width={200} height={160} className="landing-coach-img landing-coach-duo" />
          <Image src="/tennis-player-login.png" alt="" width={220} height={280} className="landing-tennis-img landing-coach-img landing-coach-0" />
          <Image src="/coach-tennis-1.png" alt="" width={140} height={180} className="landing-coach-img landing-coach-1" />
          <Image src="/coach-tennis-2.png" alt="" width={120} height={160} className="landing-coach-img landing-coach-2" />
          <Image src="/coach-tennis-3.png" alt="" width={130} height={170} className="landing-coach-img landing-coach-3" />
          <Image src="/coach-tennis-4.png" alt="" width={110} height={150} className="landing-coach-img landing-coach-4" />
        </div>
        <div className="landing-main">
        <header className="landing-hero landing-hero-login">
          <div className="landing-hero-visual" aria-hidden>
            <span className="landing-tennis-icon" role="img" title="טניס">🎾</span>
          </div>
          <h1>שיעורי טניס</h1>
          <p>נהל שיעורים, שחקנים ומערכת שבועית — במקום אחד</p>
        </header>

        <section className="landing-card landing-card-login">
          <h2>כניסה למערכת</h2>
          <p>בחר אם אתה נכנס כמאמן או כשחקן.</p>
          <div className="landing-actions">
            <div>
              <label className="recurring-form-group" style={{ display: "block", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>כניסה כמאמן</span>
              </label>
              <select
                data-testid="coach-select"
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) signInAsCoach(id);
                }}
                value=""
              >
                <option value="">בחר מאמן...</option>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="recurring-form-group" style={{ display: "block", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>כניסה כשחקן</span>
              </label>
              <select
                data-testid="player-select"
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) signInAsPlayer(id);
                }}
                value=""
              >
                <option value="">בחר את שמך...</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {coaches.find((c) => c.id === p.coachId)?.name ?? p.coachId}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="landing-card">
          <h2>הוסף מאמן חדש</h2>
          <p>מאמן חדש במערכת? הוסף כאן ואז היכנס כמאמן כדי לנהל שחקנים ומערכת.</p>
          <form onSubmit={addCoach} className="landing-add-coach">
            <input
              type="text"
              placeholder="שם המאמן"
              value={newCoachName}
              onChange={(e) => {
                setNewCoachName(e.target.value);
                setAddCoachError(null);
              }}
              aria-label="שם המאמן"
            />
            <button type="submit" className="btn btn-primary">
              הוסף מאמן
            </button>
          </form>
          {addCoachError && (
            <p className="form-error" role="alert" style={{ marginTop: "0.5rem" }}>
              {addCoachError}
            </p>
          )}
          {addCoachSuccess && (
            <p style={{ marginTop: "0.5rem", color: "var(--accent)", fontSize: "0.9rem" }}>
              המאמן נוסף. כעת אפשר לבחור אותו למעלה ולהיכנס.
            </p>
          )}
        </section>
        </div>
      </div>
    </div>
  );
}
