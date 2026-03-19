import { NextResponse } from "next/server";
import { listLessonsForPlayer } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("playerId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!playerId || !start || !end) {
    return NextResponse.json(
      { error: "playerId, start, end required (ISO dates)" },
      { status: 400 }
    );
  }
  const lessons = listLessonsForPlayer(playerId, new Date(start), new Date(end));
  return NextResponse.json(lessons);
}
