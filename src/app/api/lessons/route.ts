import { NextResponse } from "next/server";
import { addLesson } from "@/lib/store";
import { getMergedLessons } from "@/lib/merged-lessons";
import type { Lesson } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coachId = searchParams.get("coachId");
  const startStr = searchParams.get("start");
  const endStr = searchParams.get("end");
  if (!coachId || !startStr || !endStr) {
    return NextResponse.json(
      { error: "coachId, start, end required (ISO dates)" },
      { status: 400 }
    );
  }
  const start = new Date(startStr);
  const end = new Date(endStr);
  const merged = getMergedLessons(coachId, start, end);
  return NextResponse.json(merged, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Lesson;
  if (!body.id || !body.coachId || !body.playerId || !body.start) {
    return NextResponse.json(
      { error: "id, coachId, playerId, start required" },
      { status: 400 }
    );
  }
  const lessonStart = new Date(body.start);
  const lessonEnd = new Date(lessonStart.getTime() + 60 * 60 * 1000);
  const rangeStart = new Date(lessonStart.getTime() - 60 * 60 * 1000);
  const rangeEnd = new Date(lessonEnd.getTime() + 60 * 60 * 1000);
  const candidates = getMergedLessons(body.coachId, rangeStart, rangeEnd);
  const startT = lessonStart.getTime();
  const endT = lessonEnd.getTime();
  const conflict = candidates.find((l) => {
    if (l.playerId === body.playerId) return false;
    const lStart = new Date(l.start).getTime();
    const lEnd = lStart + (l.durationMinutes ?? 60) * 60 * 1000;
    return lStart < endT && lEnd > startT;
  });
  if (conflict) {
    const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    const d = lessonStart;
    const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
    const time = lessonStart.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
    return NextResponse.json(
      { error: `שעת השיעור המבוקש כבר תפוסה ביום ${dayNames[d.getDay()]} בתאריך ${dateStr} בשעה ${time}.` },
      { status: 400 }
    );
  }
  const lesson = { ...body, durationMinutes: 60 };
  const result = addLesson(lesson);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(lesson);
}
