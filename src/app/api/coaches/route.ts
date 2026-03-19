import { NextResponse } from "next/server";
import { listCoaches, addCoach, seedIfEmpty } from "@/lib/store";
import type { Coach } from "@/lib/types";

export async function GET() {
  seedIfEmpty();
  const coaches = listCoaches();
  return NextResponse.json(coaches);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Coach;
  if (!body.id || !body.name) {
    return NextResponse.json({ error: "id and name required" }, { status: 400 });
  }
  addCoach({ id: body.id, name: body.name });
  return NextResponse.json(body);
}
