"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Player = { id: string; coachId: string; name: string; color?: string };

export default function CoachDashboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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

  const addPlayer = () => {
    if (!coachId || !newName.trim()) return;
    const id = `p-${Date.now()}`;
    fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, coachId, name: newName.trim() }),
    })
      .then((r) => r.json())
      .then((player) => {
        setPlayers((prev) => [...prev, player]);
        setNewName("");
      });
  };

  const updatePlayer = (id: string) => {
    const p = players.find((x) => x.id === id);
    if (!p || !editName.trim()) return;
    fetch(`/api/players/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, name: editName.trim() }),
    }).then(() => {
      setPlayers((prev) =>
        prev.map((x) => (x.id === id ? { ...x, name: editName.trim() } : x))
      );
      setEditingId(null);
      setEditName("");
    });
  };

  const removePlayer = (id: string) => {
    fetch(`/api/players/${id}`, { method: "DELETE" }).then(() =>
      setPlayers((prev) => prev.filter((x) => x.id !== id))
    );
  };

  if (!coachId) return <p>טוען...</p>;

  return (
    <div className="app-wrap">
      <nav className="nav">
        <span className="nav-title">לוח מאמן</span>
        <div className="nav-links">
          <Link href="/">דף הבית</Link>
          <Link href="/coach/schedule">מערכת שבועית</Link>
        </div>
      </nav>
      <h1 className="page-title">השחקנים שלי</h1>
      <div className="card">
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {players.map((p) => (
            <li key={p.id} style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span className="player-chip">
                <span className="player-dot" style={{ background: p.color ?? "#bdbdbd" }} />
                {editingId === p.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && updatePlayer(p.id)}
                    />
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => updatePlayer(p.id)}>שמור</button>
                    <button type="button" className="btn btn-sm" onClick={() => { setEditingId(null); setEditName(""); }}>ביטול</button>
                  </>
                ) : (
                  <>
                    {p.name}
                    <button type="button" className="btn btn-sm" onClick={() => { setEditingId(p.id); setEditName(p.name); }}>ערוך</button>
                    <button type="button" className="btn btn-sm" onClick={() => removePlayer(p.id)}>הסר</button>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            placeholder="שם שחקן חדש"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPlayer()}
          />
          <button type="button" className="btn btn-primary" onClick={addPlayer}>הוסף שחקן</button>
        </div>
      </div>
    </div>
  );
}
