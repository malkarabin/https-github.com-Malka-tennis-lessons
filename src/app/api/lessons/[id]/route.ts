import { NextRequest, NextResponse } from "next/server";
import { removeLesson, listLessons, cancelRecurringOccurrence } from "@/lib/store";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Recurring instance: id = "rec-{seriesId}-{timestamp}"
  if (id.startsWith("rec-")) {
    const lastDash = id.lastIndexOf("-");
    const seriesId = id.slice(4, lastDash);        // strip "rec-" prefix and timestamp suffix
    const timestamp = Number(id.slice(lastDash + 1));
    if (!seriesId || isNaN(timestamp)) {
      return NextResponse.json({ error: "מזהה שיעור לא תקין" }, { status: 400 });
    }
    const ok = cancelRecurringOccurrence(seriesId, timestamp);
    if (!ok) return NextResponse.json({ error: "סדרת שיעורים לא נמצאה" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  // One-off lesson
  const lesson = listLessons().find((l) => l.id === id);
  if (!lesson) {
    return NextResponse.json({ error: "שיעור לא נמצא" }, { status: 404 });
  }
  removeLesson(id);
  return NextResponse.json({ ok: true });
}
