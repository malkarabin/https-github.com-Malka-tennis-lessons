import { NextResponse } from "next/server";
import { listRecurringByCoach, addRecurring } from "@/lib/store";
import { getMergedLessons } from "@/lib/merged-lessons";
import { expandSeries } from "@/lib/recurring";
import type { RecurringSeries } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coachId = searchParams.get("coachId");
  if (!coachId) {
    return NextResponse.json({ error: "coachId required" }, { status: 400 });
  }
  const list = listRecurringByCoach(coachId);
  const sorted = [...list].sort((a, b) => {
    const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (aT !== bT) return bT - aT;
    return b.id.localeCompare(a.id);
  });
  return NextResponse.json(sorted, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const body = (await request.json()) as RecurringSeries;
  if (
    !body.id ||
    !body.coachId ||
    !body.playerId ||
    body.weekday == null ||
    body.hour == null ||
    !body.endConditionType ||
    body.endConditionValue == null
  ) {
    return NextResponse.json(
      { error: "id, coachId, playerId, weekday, hour, endConditionType, endConditionValue required" },
      { status: 400 }
    );
  }
  if (body.weekday < 0 || body.weekday > 6) {
    return NextResponse.json({ error: "weekday must be 0-6" }, { status: 400 });
  }
  if (body.startDate != null && body.startDate !== "") {
    const startDate = new Date(body.startDate);
    if (Number.isNaN(startDate.getTime())) {
      return NextResponse.json({ error: "startDate must be a valid date" }, { status: 400 });
    }
    if (startDate.getDay() !== body.weekday) {
      const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
      return NextResponse.json(
        {
          error: `תאריך ההתחלה לא תואם ליום שנבחר. נא לבחור תאריך שהוא יום ${dayNames[body.weekday]}.`,
        },
        { status: 400 }
      );
    }
  }
  let payload: RecurringSeries = body;
  if (body.endConditionType === "afterN") {
    const n = typeof body.endConditionValue === "number" ? body.endConditionValue : Number(body.endConditionValue);
    if (Number.isNaN(n) || n < 1) {
      return NextResponse.json({ error: "endConditionValue must be a number (1 or more) for afterN" }, { status: 400 });
    }
    payload = { ...body, endConditionValue: n };
  }
  if (body.endConditionType === "throughMonth") {
    const v = String(body.endConditionValue).toLowerCase();
    if (v !== "current" && v !== "next" && v !== "both") {
      return NextResponse.json({ error: "endConditionValue must be 'current', 'next' or 'both' for throughMonth" }, { status: 400 });
    }
    payload = { ...body, endConditionValue: v as "current" | "next" | "both" };
  }
  const instances = expandSeries(payload);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const instancesFromToday = instances.filter((inst) => new Date(inst.start).getTime() >= startOfToday.getTime());
  const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  function formatDdMmYy(d: Date): string {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }
  for (const inst of instancesFromToday) {
    const instStart = new Date(inst.start);
    const instEnd = new Date(instStart.getTime() + 60 * 60 * 1000);
    const rangeStart = new Date(instStart.getTime() - 60 * 60 * 1000);
    const rangeEnd = new Date(instEnd.getTime() + 60 * 60 * 1000);
    const candidates = getMergedLessons(payload.coachId, rangeStart, rangeEnd, payload.id);
    const startT = instStart.getTime();
    const endT = instEnd.getTime();
    const conflict = candidates.find((l) => {
      if (l.playerId === payload.playerId) return false;
      const lStart = new Date(l.start).getTime();
      const lEnd = lStart + (l.durationMinutes ?? 60) * 60 * 1000;
      return lStart < endT && lEnd > startT;
    });
    if (conflict) {
      const day = dayNames[instStart.getDay()];
      const date = formatDdMmYy(instStart);
      const time = instStart.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
      return NextResponse.json(
        { error: `שעת השיעור המבוקש כבר תפוסה ביום ${day} בתאריך ${date} בשעה ${time}.` },
        { status: 400 }
      );
    }
  }
  const toSave: RecurringSeries = { ...payload, createdAt: new Date().toISOString() };
  try {
    addRecurring(toSave);
    return NextResponse.json(toSave);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save recurring series" },
      { status: 500 }
    );
  }
}
