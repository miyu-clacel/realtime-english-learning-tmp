import { NextResponse } from "next/server";
import { getRoomPublic } from "@/lib/rooms";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const room = getRoomPublic(id);

  if (!room) {
    return NextResponse.json({ error: "ルームが見つかりません" }, { status: 404 });
  }

  return NextResponse.json({ room });
}
