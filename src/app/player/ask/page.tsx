"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ChatMsg = { role: "user" | "assistant"; content: string };

export default function PlayerAskPage() {
  const router = useRouter();
  const [coachId, setCoachId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [coachName, setCoachName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem("session") : null;
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      const s = JSON.parse(raw);
      if (s.role !== "player") {
        router.replace("/");
        return;
      }
      setCoachId(s.coachId);
      setPlayerId(s.playerId);
    } catch {
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    if (!coachId) return;
    fetch(`/api/coaches`)
      .then((r) => r.json())
      .then((coaches: { id: string; name: string }[]) => {
        const c = coaches.find((x) => x.id === coachId);
        setCoachName(c?.name ?? coachId);
      });
  }, [coachId]);

  useEffect(() => {
    if (!coachId || !playerId) return;
    fetch(`/api/players?coachId=${coachId}`)
      .then((r) => r.json())
      .then((players: { id: string; name: string }[]) => {
        const p = players.find((x) => x.id === playerId);
        setPlayerName(p?.name ?? playerId);
      });
  }, [coachId, playerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || !coachId || !playerId || loading) return;

    setError(null);
    setInput("");
    const userMsg: ChatMsg = { role: "user", content: text };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setLoading(true);

    try {
      const res = await fetch("/api/player/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coachId,
          playerId,
          message: text,
          history: messages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "שגיאה");
        setMessages(messages);
        return;
      }
      const reply = data.reply as string;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setError("שגיאת רשת");
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  };

  if (!coachId || !playerId) {
    return (
      <div className="app-wrap">
        <p className="page-sub">טוען…</p>
      </div>
    );
  }

  return (
    <div className="app-wrap">
      <nav className="nav" style={{ marginBottom: "1rem" }}>
        <span className="nav-title">שאלה למאמן — {coachName || "…"}</span>
        <div className="nav-links">
          <Link href="/player/schedule">המערכת של המאמן</Link>
          <Link href="/">דף הבית</Link>
        </div>
      </nav>

      <div className="card player-ask-card">
        <h1 className="page-title" style={{ marginTop: 0 }}>
          שאל את המאמן (עוזר חכם)
        </h1>
        <p className="page-sub" style={{ marginBottom: "1rem" }}>
          {playerName} — התשובות מגיעות מעוזר וירטואלי לפי שם המאמן שלך. לשאלות אישיות, רפואיות או חשבוניות — פני
          ל{coachName} ישירות.
        </p>

        <div className="player-chat-log" dir="rtl">
          {messages.length === 0 && !loading && (
            <p className="player-chat-hint">כתבי כאן שאלה על טניס, אימון או תיאום שיעורים.</p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`player-chat-bubble ${m.role === "user" ? "player-chat-bubble-user" : "player-chat-bubble-assistant"}`}
            >
              <span className="player-chat-role">{m.role === "user" ? "את" : "עוזר המאמן"}</span>
              <span className="player-chat-text">{m.content}</span>
            </div>
          ))}
          {loading && (
            <div className="player-chat-bubble player-chat-bubble-assistant">
              <span className="player-chat-role">עוזר המאמן</span>
              <span className="player-chat-text player-chat-typing">כותב…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p className="form-error" role="alert" style={{ marginTop: "0.75rem" }}>
            {error}
          </p>
        )}

        <div className="player-chat-input-row">
          <textarea
            className="player-chat-textarea"
            rows={3}
            placeholder="כתבי את השאלה…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={loading}
            aria-label="שאלה למאמן"
          />
          <button type="button" className="btn btn-primary player-chat-send" onClick={send} disabled={loading || !input.trim()}>
            שלחי
          </button>
        </div>
      </div>
    </div>
  );
}
