import { NextResponse } from "next/server";
import { listPlayersByCoach, addPlayer } from "@/lib/store";
import type { Player } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coachId = searchParams.get("coachId");
  if (!coachId) {
    return NextResponse.json({ error: "coachId required" }, { status: 400 });
  }
  const players = listPlayersByCoach(coachId);
  return NextResponse.json(players);
}

// Pastel, soft colors — one per player (by index) so no duplicates per coach
const PASTEL_COLORS = [
  "#b5d6b2", "#a8d4e6", "#f2c4b8", "#c9b8e8", "#ffe5b4", "#b8e8d4",
  "#e8c4d4", "#c4d4e8", "#d4e8c4", "#e8d4b8", "#d4b8e8", "#b8e8e8",
  "#f0d4c4", "#d4e0f0", "#e0f0d4", "#f0e0d4", "#e8b8c4", "#c4e8e0",
  "#e6d5f1", "#d5f1e6", "#f1e6d5", "#d5e6f1", "#f1d5e6", "#e6f1d5",
];

function nextColorForCoach(coachId: string): string {
  const existing = listPlayersByCoach(coachId);
  const index = existing.length % PASTEL_COLORS.length;
  return PASTEL_COLORS[index];
}

export async function POST(request: Request) {
  const body = (await request.json()) as Player;
  if (!body.id || !body.coachId || !body.name) {
    return NextResponse.json({ error: "id, coachId, name required" }, { status: 400 });
  }
  if (!body.color) body.color = nextColorForCoach(body.coachId);
  addPlayer(body);
  return NextResponse.json(body);
}
