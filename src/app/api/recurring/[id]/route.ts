import { NextResponse } from "next/server";
import { removeRecurringSeries } from "@/lib/store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  removeRecurringSeries(id);
  return NextResponse.json({ ok: true });
}
