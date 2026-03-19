import { NextResponse } from "next/server";
import { getPlayer, updatePlayer, removePlayer } from "@/lib/store";
import type { Player } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const player = getPlayer(id);
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(player);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as Player;
  if (body.id !== id) return NextResponse.json({ error: "id mismatch" }, { status: 400 });
  updatePlayer(body);
  return NextResponse.json(body);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  removePlayer(id);
  return NextResponse.json({ ok: true });
}
